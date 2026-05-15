// Provides Pi's soft runtime gate for ABP's collaborative interface design rule.

const GATE_TITLE = "Interface Design Gate";

export const INTERFACE_GATE_CYCLE_ENTRY = "abp-interface-gate-cycle";
export const INTERFACE_GATE_UI_ALLOW_ENTRY = "abp-interface-gate-ui-allowed";
export const INTERFACE_GATE_STATE_ENTRY = "abp-interface-gate-state";

const REQUIRED_GATE_FIELDS = [
  "current interface:",
  "proposed interface:",
  "why this boundary:",
  "acceptance and proof:",
  "user decision:",
];

const APPROVAL_PATTERN = /\b(approve|approved|yes|looks good|go ahead|ship it|implement it|proceed)\b/i;
const REJECTION_PATTERN = /\b(reject|rejected|no|revise|change it|not that|don't implement|do not implement)\b/i;
const SHELL_FILE_REDIRECT_PATTERN = /(?:^|[^\d])>>?\s*(?!&|\d)(?!\/dev\/null\b)\S/i;
const MUTATING_BASH_PATTERN = /(\btee\b|\bpython\b[\s\S]*\bopen\([^)]*['"]w|\bnode\b[\s\S]*writeFile|\bperl\s+-pi\b|\bsed\s+-i\b|\bmv\b|\bcp\b|\btouch\b|\bchmod\b|\bgit\s+apply\b|\bpatch\b)/i;

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
  return chatMessages(entries).some(isInterfaceGatePrompt);
}

export function latestInterfaceGateState(entries) {
  const stateEntry = entries
    .filter((entry) => entry?.type === "custom" && entry.customType === INTERFACE_GATE_STATE_ENTRY)
    .at(-1);

  return stateEntry?.data?.active === true;
}

function isInterfaceGatePrompt(message) {
  return (
    message.role === "assistant" &&
    message.text.includes(GATE_TITLE) &&
    REQUIRED_GATE_FIELDS.every((field) => message.text.toLowerCase().includes(field))
  );
}

function isInterfaceGateAttempt(message) {
  return message.role === "assistant" && message.text.includes(GATE_TITLE);
}

/**
 * Return the entry index of the most recent closed-cycle marker, or -1.
 * A closed cycle scopes intent and approval lookups: anything before the
 * marker belongs to a prior, settled design decision.
 */
export function lastClosedCycleIndex(entries) {
  for (let index = entries.length - 1; index >= 0; index -= 1) {
    const entry = entries[index];
    if (
      entry?.type === "custom" &&
      entry?.customType === INTERFACE_GATE_CYCLE_ENTRY &&
      entry?.data?.state === "closed"
    ) {
      return index;
    }
  }
  return -1;
}

/** Return the entry index of the most recent user message, or -1. */
export function lastUserMessageIndex(entries) {
  for (let index = entries.length - 1; index >= 0; index -= 1) {
    const message = entries[index]?.message ?? entries[index];
    if (message?.role === "user") return index;
  }
  return -1;
}

/**
 * Return true when the user clicked Allow on a prior gate prompt within the
 * current turn. The allow persists until the next user message starts a new
 * turn, mirroring `pre-work-guard`'s `hasAlreadyExplainedThisTurn` shape.
 */
export function hasInterfaceUiAllowThisTurn(entries) {
  const cutoff = lastUserMessageIndex(entries);
  for (let index = entries.length - 1; index > cutoff; index -= 1) {
    const entry = entries[index];
    if (entry?.type === "custom" && entry?.customType === INTERFACE_GATE_UI_ALLOW_ENTRY) {
      return true;
    }
  }
  return false;
}

/**
 * Return true when the user approved the latest Interface Design Gate prompt
 * within the current cycle. Approval before a later gate prompt does not
 * count, and approvals from prior closed cycles do not carry over.
 */
export function hasInterfaceGateApproval(entries) {
  const cycleStart = lastClosedCycleIndex(entries) + 1;
  const messages = chatMessages(entries.slice(cycleStart));
  const latestGateIndex = messages.findLastIndex(isInterfaceGatePrompt);

  if (latestGateIndex === -1) return false;

  return messages.slice(latestGateIndex + 1).some((message) => {
    if (message.role !== "user") return false;
    if (REJECTION_PATTERN.test(message.text)) return false;
    return APPROVAL_PATTERN.test(message.text);
  });
}

/**
 * Return the entry index of the latest user message that approves the latest
 * gate prompt, or -1. Used to lazily reconcile a closed-cycle marker.
 */
function latestApprovingUserMessageEntryIndex(entries) {
  let latestGateEntryIndex = -1;
  for (let index = entries.length - 1; index >= 0; index -= 1) {
    const message = entries[index]?.message ?? entries[index];
    if (message?.role !== "assistant") continue;
    if (isInterfaceGatePrompt({ role: "assistant", text: messageText(message.content) })) {
      latestGateEntryIndex = index;
      break;
    }
  }
  if (latestGateEntryIndex === -1) return -1;

  for (let index = entries.length - 1; index > latestGateEntryIndex; index -= 1) {
    const message = entries[index]?.message ?? entries[index];
    if (message?.role !== "user") continue;
    const text = messageText(message.content);
    if (REJECTION_PATTERN.test(text)) continue;
    if (APPROVAL_PATTERN.test(text)) return index;
  }
  return -1;
}

/** Classify whether a tool call can mutate files or project state. */
export function classifyToolCall(toolName, input) {
  if (toolName === "edit" || toolName === "write") return "mutating";
  if (toolName !== "bash") return "read_only";

  const command = typeof input?.command === "string" ? input.command : "";
  return MUTATING_BASH_PATTERN.test(command) || SHELL_FILE_REDIRECT_PATTERN.test(command)
    ? "mutating"
    : "read_only";
}

/**
 * Return true when the current cycle has an Interface Design Gate packet whose
 * approval protocol is still open. Semantic detection belongs to the agent and
 * ABP skills; the runtime only enforces an explicit gate packet once shown.
 */
export function hasOpenInterfaceGatePrompt(entries) {
  const cycleStart = lastClosedCycleIndex(entries) + 1;
  return chatMessages(entries.slice(cycleStart)).some(isInterfaceGateAttempt);
}

/**
 * Decide whether a mutating tool call should trigger Pi's soft interface gate.
 * The gate fires only after an explicit gate packet exists, no user approval
 * follows the latest gate prompt, and no UI allow has cleared this turn.
 */
export function isPotentialInterfaceImplementation(toolName, input, entries) {
  if (classifyToolCall(toolName, input) !== "mutating") return false;
  if (hasInterfaceUiAllowThisTurn(entries)) return false;
  if (hasInterfaceGateApproval(entries)) return false;
  return hasOpenInterfaceGatePrompt(entries);
}

function gateReminder() {
  return `Use the contract-first skill for this Interface Design Gate workflow.

Before implementing a durable interface or contract, show:

Interface Design Gate

Current interface: existing shape or "new interface"
Proposed interface: concrete function/class/module/API/config/event shape
Why this boundary: why this interface belongs here
Acceptance and proof: what must be true, and how the result will be checked
User decision: ask the user to approve, revise, or rule it out

The agent may propose the shape, but the user must approve or revise it before implementation code lands.`;
}

function blockReason() {
  return "Interface Design Gate: show the current interface, proposed interface, why this boundary belongs here, and acceptance/proof, then ask the user to approve or revise before implementation.";
}

/**
 * Lazily append a closed-cycle marker when the user has approved the latest
 * gate prompt but no marker exists for that approval yet. Idempotent: if the
 * approval is already followed by a close marker, this is a no-op.
 */
function reconcileClosedCycle(pi, entries) {
  const approvingIndex = latestApprovingUserMessageEntryIndex(entries);
  if (approvingIndex === -1) return;

  const lastCloseIndex = lastClosedCycleIndex(entries);
  if (lastCloseIndex > approvingIndex) return;

  pi.appendEntry(INTERFACE_GATE_CYCLE_ENTRY, { state: "closed", at: Date.now() });
}

/** Register the Interface Design Gate extension with Pi. */
export default function interfaceDesignGate(pi) {
  pi.registerCommand("abp:contract", {
    description: "Start ABP Interface Design Gate workflow",
    handler: async (args, ctx) => {
      pi.appendEntry(INTERFACE_GATE_STATE_ENTRY, { active: true, source: "command", at: Date.now() });
      if (ctx.hasUI !== false) ctx.ui.notify("ABP Interface Design Gate enabled", "info");

      const intent = String(args ?? "").trim();
      await pi.sendUserMessage(intent ? `${gateReminder()}\n\nIntent: ${intent}` : gateReminder());
    },
  });

  pi.registerCommand("abp:contract-off", {
    description: "Stop ABP Interface Design Gate workflow",
    handler: async (_args, ctx) => {
      pi.appendEntry(INTERFACE_GATE_STATE_ENTRY, { active: false, source: "command", at: Date.now() });
      if (ctx.hasUI !== false) ctx.ui.notify("ABP Interface Design Gate disabled", "info");
    },
  });

  pi.on("tool_call", async (event, ctx) => {
    const entries = ctx.sessionManager.getBranch();
    if (!latestInterfaceGateState(entries)) return;

    reconcileClosedCycle(pi, entries);

    const refreshed = ctx.sessionManager.getBranch();
    if (!isPotentialInterfaceImplementation(event.toolName, event.input, refreshed)) return;

    if (ctx.hasUI === false) {
      return { block: true, reason: `Interface Design Gate requires an interactive UI decision before implementation. ${blockReason()}` };
    }

    const allowed = await ctx.ui.confirm("Interface Design Gate", blockReason());
    if (!allowed) return { block: true, reason: blockReason() };

    pi.appendEntry(INTERFACE_GATE_UI_ALLOW_ENTRY, { allowedAt: Date.now() });
  });
}
