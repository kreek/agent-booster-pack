// Provides Pi's soft runtime gate for ABP's collaborative interface design rule.

const GATE_TITLE = "Interface Design Gate";

const REQUIRED_GATE_FIELDS = [
  "current interface:",
  "proposed interface:",
  "why this boundary:",
  "user decision:",
];

const INTERFACE_INTENT_PATTERN = /\b(interface|contract|api|class|method|module facade|exported type|export(?:ed)? function|public function|adapter|service boundary|component props|schema|endpoint|config key|file format|event payload|message payload)\b/i;
const APPROVAL_PATTERN = /\b(approve|approved|yes|looks good|go ahead|ship it|implement it|proceed)\b/i;
const REJECTION_PATTERN = /\b(reject|rejected|no|revise|change it|not that|don't implement|do not implement)\b/i;
const MUTATING_BASH_PATTERN = /(>>?|\btee\b|\bpython\b[\s\S]*\bopen\([^)]*['"]w|\bnode\b[\s\S]*writeFile|\bperl\s+-pi\b|\bsed\s+-i\b|\bmv\b|\bcp\b|\btouch\b|\bchmod\b|\bgit\s+apply\b|\bpatch\b)/i;

/**
 * Return normalized text content for a Pi session message-like value.
 * Supports plain strings and text content arrays so tests and runtime session
 * entries use the same detection path.
 */
export function messageText(value) {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item?.text === "string" ? item.text : ""))
      .join("\n");
  }
  return "";
}

/**
 * Extract chat messages from Pi session entries, ignoring custom state and
 * tool-result entries that do not carry user or assistant design decisions.
 */
export function chatMessages(entries) {
  return entries
    .map((entry) => entry?.message ?? entry)
    .filter((message) => message?.role === "user" || message?.role === "assistant")
    .map((message) => ({ role: message.role, text: messageText(message.content) }));
}

/** Return true when recent chat contains the lean Interface Design Gate packet. */
export function hasInterfaceGatePrompt(entries) {
  return chatMessages(entries).some(
    (message) =>
      message.role === "assistant" &&
      message.text.includes(GATE_TITLE) &&
      REQUIRED_GATE_FIELDS.every((field) => message.text.toLowerCase().includes(field))
  );
}

/**
 * Return true when the user approved the latest Interface Design Gate prompt.
 * Approval before a later gate prompt does not count as sign-off.
 */
export function hasInterfaceGateApproval(entries) {
  const messages = chatMessages(entries);
  const latestGateIndex = messages.findLastIndex(
    (message) => message.role === "assistant" && message.text.includes(GATE_TITLE)
  );

  if (latestGateIndex === -1) return false;

  return messages.slice(latestGateIndex + 1).some((message) => {
    if (message.role !== "user") return false;
    if (REJECTION_PATTERN.test(message.text)) return false;
    return APPROVAL_PATTERN.test(message.text);
  });
}

/** Classify whether a tool call can mutate files or project state. */
export function classifyToolCall(toolName, input) {
  if (toolName === "edit" || toolName === "write") return "mutating";
  if (toolName !== "bash") return "read_only";

  const command = typeof input?.command === "string" ? input.command : "";
  return MUTATING_BASH_PATTERN.test(command) ? "mutating" : "read_only";
}

/** Return true when recent chat suggests an interface design decision is in play. */
export function hasInterfaceIntent(entries) {
  return chatMessages(entries).some((message) => INTERFACE_INTENT_PATTERN.test(message.text));
}

/**
 * Decide whether a mutating tool call should trigger Pi's soft interface gate.
 * The gate fires only when interface intent exists and no user approval follows
 * the latest lean gate packet.
 */
export function isPotentialInterfaceImplementation(toolName, input, entries) {
  if (classifyToolCall(toolName, input) !== "mutating") return false;
  if (hasInterfaceGateApproval(entries)) return false;
  return hasInterfaceIntent(entries);
}

function gateReminder() {
  return `\n\nABP Interface Design Gate:\nWhen work defines or materially changes a durable interface/contract between components, stop before implementation. Show:\n- Current interface: existing shape or "new interface"\n- Proposed interface: concrete function/class/module/API/config/event shape\n- Why this boundary: why this interface belongs here\n- User decision: ask the user to approve, revise, or rule it out\nThe agent may propose the shape, but the user must approve or revise it before implementation code lands.`;
}

function blockReason() {
  return "Interface Design Gate: show the current interface, proposed interface, and why this boundary belongs here, then ask the user to approve or revise before implementation.";
}

/** Register the Interface Design Gate extension with Pi. */
export default function interfaceDesignGate(pi) {
  pi.on("before_agent_start", async (event) => ({
    systemPrompt: event.systemPrompt + gateReminder(),
  }));

  pi.on("tool_call", async (event, ctx) => {
    const entries = ctx.sessionManager.getBranch();
    if (!isPotentialInterfaceImplementation(event.toolName, event.input, entries)) return;

    if (!ctx.hasUI) return { block: true, reason: blockReason() };

    const allowed = await ctx.ui.confirm("Interface Design Gate", blockReason());
    if (!allowed) return { block: true, reason: blockReason() };
  });
}
