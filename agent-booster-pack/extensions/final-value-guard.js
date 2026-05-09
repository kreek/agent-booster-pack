const CHANGE_TOOL_NAMES = new Set(["edit", "write"]);
const FINAL_VALUE_GUARD_MARKER = "ABP Final Value Guard";
const FINAL_VALUE_GUARD_MESSAGE = "abp-final-value-guard";
const MUTATING_BASH_PATTERN = /(\btee\b|\bpython\b[\s\S]*\bopen\([^)]*['"]w|\bnode\b[\s\S]*writeFile|\bperl\s+-pi\b|\bsed\s+-i\b|\bmv\b|\bcp\b|\btouch\b|\bchmod\b|\bgit\s+apply\b|\bpatch\b)/i;

function messageText(value) {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    return value.map((item) => (typeof item?.text === "string" ? item.text : "")).join("\n");
  }
  return "";
}

function changedPath(toolCall) {
  return String(toolCall?.arguments?.path ?? toolCall?.input?.path ?? "");
}

function isDocumentationPath(path) {
  return /(^|\/)README\.md$/i.test(path) || /(^|\/)docs\/.*\.md$/i.test(path) || /\.md$/i.test(path);
}

function normalizeMessages(values) {
  return values.map((value) => value?.message ?? value).filter(Boolean);
}

function latestUserScopedMessages(entries) {
  const messages = normalizeMessages(entries);
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    if (messages[index]?.role === "user") return messages.slice(index + 1);
  }
  return messages;
}

function isChangeToolCall(item) {
  if (item?.type !== "toolCall") return false;
  if (CHANGE_TOOL_NAMES.has(item.name)) return true;
  if (item.name !== "bash") return false;

  const command = typeof item?.arguments?.command === "string" ? item.arguments.command : "";
  return MUTATING_BASH_PATTERN.test(command);
}

function changeToolCalls(messages) {
  return normalizeMessages(messages)
    .filter((message) => message?.role === "assistant" && Array.isArray(message.content))
    .flatMap((message) => message.content)
    .filter(isChangeToolCall);
}

function finalValueChangeKind(messages) {
  const calls = changeToolCalls(messages);
  if (calls.length === 0) return null;

  const paths = calls.map(changedPath).filter(Boolean);
  const uniquePathCount = new Set(paths).size;
  const hasPathlessChange = paths.length < calls.length;
  const subject = paths.length === calls.length && paths.every(isDocumentationPath) ? "documentation" : "implementation";

  if (hasPathlessChange && uniquePathCount === 0) return { subject, size: "medium", uniquePathCount };
  if (uniquePathCount <= 1) return { subject, size: "small", uniquePathCount };
  if (uniquePathCount <= 3) return { subject, size: "medium", uniquePathCount };
  return { subject, size: "large", uniquePathCount };
}

function lastAssistantText(messages) {
  const normalized = normalizeMessages(messages);
  for (let index = normalized.length - 1; index >= 0; index -= 1) {
    const message = normalized[index];
    if (message?.role !== "assistant") continue;

    const text = messageText(message.content).trim();
    if (text) return text;
  }
  return "";
}

function isFinalValueCorrectionTurn(messages) {
  return normalizeMessages(messages).some((message) => messageText(message.content).includes(FINAL_VALUE_GUARD_MARKER));
}

function labelContent(text, label, labels) {
  const labelAlternatives = labels.join("|");
  const pattern = new RegExp(
    `(^|\\n)\\s*(-\\s*)?${label}:\\s*([\\s\\S]*?)(?=\\n\\s*(-\\s*)?(${labelAlternatives}):|$)`,
    "i"
  );
  return text.match(pattern)?.[3]?.trim() ?? "";
}

function hasRequiredFinalStructure(text, changeKind) {
  if (changeKind.size === "small") return text.trim().length >= 80;

  const labels = changeKind.size === "medium" ? ["Changed", "Why", "Enables"] : ["Changed", "Why", "Enables", "Proof", "Unproven"];
  return labels.every((label) => labelContent(text, label, labels).length > 0);
}

export function shouldRequestFinalValueReflection(messages) {
  return finalValuePromptFor(messages) !== null;
}

export function finalValuePromptForSessionEntries(entries) {
  return finalValuePromptFor(latestUserScopedMessages(entries));
}

export function finalValuePromptFor(messages) {
  if (!Array.isArray(messages) || messages.length === 0) return null;
  if (isFinalValueCorrectionTurn(messages)) return null;

  const changeKind = finalValueChangeKind(messages);
  if (!changeKind) return null;

  const finalText = lastAssistantText(messages);
  if (hasRequiredFinalStructure(finalText, changeKind)) return null;

  return makeFinalValuePrompt(finalText, changeKind);
}

export function makeFinalValuePrompt(finalText, changeKind = { subject: "implementation", size: "large", uniquePathCount: 4 }) {
  const subject = changeKind.subject === "documentation" ? "document" : "implementation";
  const scope = changeKind.uniquePathCount ? `${changeKind.uniquePathCount} changed file${changeKind.uniquePathCount === 1 ? "" : "s"}` : "the changes";

  if (changeKind.size === "small") {
    return `${FINAL_VALUE_GUARD_MARKER} requested a stronger final step.

The turn changed ${scope}. Replace the previous final response with one concise sentence that states what changed and why it matters for the ${subject}.

Previous final response:
${finalText}`;
  }

  if (changeKind.size === "medium") {
    return `${FINAL_VALUE_GUARD_MARKER} requested a stronger final step.

The turn changed ${scope}. Replace the previous final response with a concise 3-bullet summary using exactly these labels:
- Changed: what changed in the ${subject}
- Why: why this is better or safer than what came before
- Enables: what it enables next

If the change may not be an improvement, say that under Why: and name the safer alternative.

Previous final response:
${finalText}`;
  }

  return `${FINAL_VALUE_GUARD_MARKER} requested a stronger final step.

The turn changed ${scope}. Replace the previous final response with a concise final summary using exactly these labels:

- Changed: what changed
- Why: why the new ${subject} is better or safer than what came before
- Enables: what it enables going forward
- Proof: what was proven by the validation evidence
- Unproven: what remains unproven or needs human review

If the change may not be an improvement, say that under Why: and name alternative strategies such as revising, reducing, reverting, or choosing a different approach.

Previous final response:
${finalText}`;
}

export default function finalValueGuard(pi) {
  pi.on("agent_end", async (event, ctx) => {
    const branchMessages = latestUserScopedMessages(ctx.sessionManager.getBranch());
    const prompt = finalValuePromptFor(branchMessages) ?? finalValuePromptFor(event.messages);
    if (!prompt) return;

    pi.sendMessage(
      {
        customType: FINAL_VALUE_GUARD_MESSAGE,
        content: prompt,
        display: false,
        details: { source: FINAL_VALUE_GUARD_MARKER },
      },
      { deliverAs: "followUp", triggerTurn: true }
    );
  });
}
