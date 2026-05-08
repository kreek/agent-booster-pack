const CHANGE_TOOL_NAMES = new Set(["edit", "write"]);
const FINAL_VALUE_GUARD_MARKER = "ABP Final Value Guard";
const FINAL_VALUE_GUARD_MESSAGE = "abp-final-value-guard";

const CHANGE_PATTERN = /\b(changed|updated|added|implemented|fixed|removed|created|bumped|committed|now)\b/i;
const BETTER_PATTERN = /\b(better|improv\w*|because|prevents?|reduces?|avoids?|simpler|safer|clearer|reliable|replaces|compared|previous|before)\b/i;
const ENABLES_PATTERN = /\b(enables?|going forward|future|next|allows?|unblocks?|sets up|makes it possible|can now)\b/i;
const ALTERNATIVE_PATTERN = /\b(not an improvement|cannot justify|can't justify|alternative strateg\w*|revise|revert|reduce|different strategy|instead)\b/i;

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

function changeToolCalls(messages) {
  return messages
    .filter((message) => message?.role === "assistant" && Array.isArray(message.content))
    .flatMap((message) => message.content)
    .filter((item) => item?.type === "toolCall" && CHANGE_TOOL_NAMES.has(item.name));
}

function finalValueChangeKind(messages) {
  const calls = changeToolCalls(messages);
  if (calls.length === 0) return null;

  const paths = calls.map(changedPath).filter(Boolean);
  const subject = paths.length === calls.length && paths.every(isDocumentationPath) ? "documentation" : "implementation";
  const size = new Set(paths).size === 1 ? "small" : "normal";

  return { subject, size };
}

function lastAssistantText(messages) {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message?.role !== "assistant") continue;

    const text = messageText(message.content).trim();
    if (text) return text;
  }
  return "";
}

function hasFinalValueReflection(text) {
  if (!CHANGE_PATTERN.test(text)) return false;
  return (BETTER_PATTERN.test(text) && ENABLES_PATTERN.test(text)) || ALTERNATIVE_PATTERN.test(text);
}

function isFinalValueCorrectionTurn(messages) {
  return messages.some((message) => messageText(message.content).includes(FINAL_VALUE_GUARD_MARKER));
}

export function shouldRequestFinalValueReflection(messages) {
  return finalValuePromptFor(messages) !== null;
}

export function finalValuePromptFor(messages) {
  if (!Array.isArray(messages) || messages.length === 0) return null;
  if (isFinalValueCorrectionTurn(messages)) return null;

  const changeKind = finalValueChangeKind(messages);
  if (!changeKind) return null;
  if (hasFinalValueReflection(lastAssistantText(messages))) return null;

  return makeFinalValuePrompt(lastAssistantText(messages), changeKind);
}

export function makeFinalValuePrompt(finalText, changeKind = { subject: "implementation", size: "normal" }) {
  const subject = changeKind.subject === "documentation" ? "document" : "implementation";
  const secondItem =
    changeKind.subject === "documentation"
      ? "why the document is clearer or more useful than what came before"
      : "why the change or new feature is better than what came before";

  if (changeKind.size === "small") {
    const request =
      changeKind.subject === "documentation"
        ? "Replace it with one sentence stating what document changed and why it matters."
        : "Replace it with one sentence stating what changed and why it matters for the implementation.";

    return `${FINAL_VALUE_GUARD_MARKER} requested a stronger final step.

Your previous final response was brief. ${request}

Previous final response:
${finalText}`;
  }

  return `${FINAL_VALUE_GUARD_MARKER} requested a stronger final step.

Your previous final response did not explain the value of the ${subject} clearly enough. Respond with a concise final summary that states:

1. what changed,
2. ${secondItem}, and
3. what it enables going forward.

If you cannot justify the change as an improvement, say so directly and explain why it may not be an improvement. Then name alternative strategies such as revising, reducing, reverting, or choosing a different approach.

Previous final response:
${finalText}`;
}

export default function finalValueGuard(pi) {
  pi.on("agent_end", async (event) => {
    const prompt = finalValuePromptFor(event.messages);
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
