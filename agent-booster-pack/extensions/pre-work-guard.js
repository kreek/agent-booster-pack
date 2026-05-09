const PRE_WORK_MARKER = "ABP Pre-Work Reflection Gate";
const PRE_WORK_STATE_ENTRY = "abp-pre-work-explained";

const CHANGE_TOOL_NAMES = new Set(["edit", "write"]);
const MUTATING_BASH_PATTERN = /(\btee\b|\bpython\b[\s\S]*\bopen\([^)]*['"]w|\bnode\b[\s\S]*writeFile|\bperl\s+-pi\b|\bsed\s+-i\b|\bmv\b|\bcp\b|\btouch\b|\bchmod\b|\bgit\s+apply\b|\bpatch\b)/i;


export function messageText(value) {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    return value.map((item) => (typeof item?.text === "string" ? item.text : "")).join("\n");
  }
  return "";
}

export function chatMessages(entries) {
  return entries
    .map((entry) => entry?.message ?? entry)
    .filter((message) => message?.role === "user" || message?.role === "assistant")
    .map((message) => ({ role: message.role, text: messageText(message.content) }));
}

export function lastAssistantText(entries) {
  const messages = chatMessages(entries);
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    if (messages[index].role !== "assistant") continue;
    const text = messages[index].text.trim();
    if (text) return text;
  }
  return "";
}

function isDocumentationPath(path) {
  return /(^|\/)README\.md$/i.test(path) || /(^|\/)docs\/.*\.md$/i.test(path) || /\.md$/i.test(path);
}

export function classifyToolCall(toolName, input) {
  if (CHANGE_TOOL_NAMES.has(toolName)) return "mutating";
  if (toolName !== "bash") return "read_only";

  const command = typeof input?.command === "string" ? input.command : "";
  return MUTATING_BASH_PATTERN.test(command) ? "mutating" : "read_only";
}

export function preWorkChangeKind(toolName, input) {
  if (classifyToolCall(toolName, input) !== "mutating") return null;
  if (toolName === "bash") return { subject: "implementation", size: "normal" };

  const path = String(input?.path ?? "");
  const subject = isDocumentationPath(path) ? "documentation" : "implementation";
  return { subject, size: "small" };
}

function labelContent(text, label, labels) {
  const labelAlternatives = labels.join("|");
  const pattern = new RegExp(
    `(^|\\n)\\s*(-\\s*)?${label}:[ \\t]*([\\s\\S]*?)(?=\\n\\s*(-\\s*)?(${labelAlternatives}):|$)`,
    "i"
  );
  return text.match(pattern)?.[3]?.trim() ?? "";
}

export function missingElements(text, size) {
  const labels = size === "normal" ? ["Plan", "Why", "Alternatives"] : ["Plan", "Why"];
  return labels
    .filter((label) => labelContent(text, label, labels).length === 0)
    .map((label) => label.toLowerCase());
}

export function hasPreWorkExplanation(text, size) {
  return missingElements(text, size).length === 0;
}

function lastUserMessageIndex(entries) {
  for (let index = entries.length - 1; index >= 0; index -= 1) {
    const entry = entries[index];
    const message = entry?.message ?? entry;
    if (message?.role === "user") return index;
  }
  return -1;
}

export function hasAlreadyExplainedThisTurn(entries) {
  const cutoff = lastUserMessageIndex(entries);
  for (let index = entries.length - 1; index > cutoff; index -= 1) {
    const entry = entries[index];
    if (entry?.type === "custom" && entry?.customType === PRE_WORK_STATE_ENTRY) return true;
  }
  return false;
}

export function shouldBlockPreWork(toolName, input, entries) {
  const kind = preWorkChangeKind(toolName, input);
  if (!kind) return null;
  if (hasAlreadyExplainedThisTurn(entries)) return null;

  const text = lastAssistantText(entries);
  const missing = missingElements(text, kind.size);
  if (missing.length === 0) return null;
  return { kind, missing };
}

export function makePreWorkBlockReason(missing, kind) {
  const subject = kind.subject === "documentation" ? "the document" : "the implementation";
  const elementPhrases = {
    plan: "Plan: a concrete description of what will change",
    why: "Why: why the change is worth doing or safer than the current state",
    alternatives: "Alternatives: the options considered or rejected",
  };

  const items = missing.map((key) => `- ${elementPhrases[key]}`).join("\n");
  const tier = kind.size === "small" ? "two labeled lines are fine" : "three labeled lines are fine";

  return `${PRE_WORK_MARKER}: your last message is missing ${missing.join(" and ")} for ${subject}. Add a brief pre-work explanation (${tier}) using these labels:\n${items}\n\nThen retry the tool call.`;
}

export function preWorkReminder() {
  return `\n\n${PRE_WORK_MARKER}:\nBefore your first mutating tool call (edit, write, mutating bash) in a turn, write a brief pre-work explanation with non-empty labels. For a single-file edit, use Plan: and Why:. For multi-file or mutating-bash changes, use Plan:, Why:, and Alternatives:. The explanation teaches the user the codebase you are writing and gives them a chance to redirect before code lands.`;
}

export default function preWorkGuard(pi) {
  pi.on("before_agent_start", async (event) => ({
    systemPrompt: event.systemPrompt + preWorkReminder(),
  }));

  pi.on("tool_call", async (event, ctx) => {
    const entries = ctx.sessionManager.getBranch();
    if (classifyToolCall(event.toolName, event.input) !== "mutating") return;
    if (hasAlreadyExplainedThisTurn(entries)) return;

    const verdict = shouldBlockPreWork(event.toolName, event.input, entries);
    if (verdict) {
      return { block: true, reason: makePreWorkBlockReason(verdict.missing, verdict.kind) };
    }

    pi.appendEntry(PRE_WORK_STATE_ENTRY, { explainedAt: Date.now() });
  });
}
