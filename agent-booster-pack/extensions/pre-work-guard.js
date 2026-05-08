const PRE_WORK_MARKER = "ABP Pre-Work Reflection Gate";
const PRE_WORK_STATE_ENTRY = "abp-pre-work-explained";

const CHANGE_TOOL_NAMES = new Set(["edit", "write"]);
const MUTATING_BASH_PATTERN = /(>>?|\btee\b|\bpython\b[\s\S]*\bopen\([^)]*['"]w|\bnode\b[\s\S]*writeFile|\bperl\s+-pi\b|\bsed\s+-i\b|\bmv\b|\bcp\b|\btouch\b|\bchmod\b|\bgit\s+apply\b|\bpatch\b)/i;

const PLAN_PATTERN = /\b(I'll|I will|going to|plan to|next I'll|about to|will (add|change|create|edit|write|update|introduce|refactor|extract|move|rename|remove|delete|fix))\b/i;
const WHY_PATTERN = /\b(better|because|so that|to (?:improve|simplify|fix|prevent|reduce|avoid|enable|unblock|clarify)|in order to|this avoids|this prevents|this simplifies|safer|clearer|simpler|reliable)\b/i;
const ALTERNATIVES_PATTERN = /\b(alternative|considered|instead of|rather than|rejected|ruled out|trade[- ]?off|other option|could also|vs\.?|versus)\b/i;

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

export function missingElements(text, size) {
  const missing = [];
  if (!PLAN_PATTERN.test(text)) missing.push("plan");
  if (!WHY_PATTERN.test(text)) missing.push("why");
  if (size === "normal" && !ALTERNATIVES_PATTERN.test(text)) missing.push("alternatives");
  return missing;
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
    plan: "a concrete plan for what will change (e.g., \"I'll add…\", \"I'll update…\")",
    why: "a rationale for why the change is an improvement (\"because\", \"better\", \"safer\", etc.)",
    alternatives: "the alternatives you considered or rejected (\"considered\", \"instead of\", \"rather than\")",
  };

  const items = missing.map((key) => `- ${elementPhrases[key]}`).join("\n");
  const tier = kind.size === "small" ? "one sentence is fine" : "a brief paragraph";

  return `${PRE_WORK_MARKER}: your last message is missing ${missing.join(" and ")} for ${subject}. Add a brief pre-work explanation (${tier}) that includes:\n${items}\n\nThen retry the tool call.`;
}

export function preWorkReminder() {
  return `\n\n${PRE_WORK_MARKER}:\nBefore your first mutating tool call (edit, write, mutating bash) in a turn, write a brief pre-work explanation. For a single-file edit, one sentence covering the plan and why is enough. For multi-file or mutating-bash changes, also name the alternatives you considered or rejected. The explanation teaches the user the codebase you are writing and gives them a chance to redirect before code lands.`;
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
