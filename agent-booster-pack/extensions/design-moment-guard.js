// Design-Moment Guard. Fires when a mutating tool call looks like the
// first touch on a new public surface (API/CLI/schema/etc.) and no
// Interface Design Gate packet has been approved this cycle. The agent
// is nudged to open a contract-first packet before implementation lands.
//
// This gate is intentionally conservative: false positives turn ABP
// into the kind of friction Pi's creator built Pi to escape.

const MARKER = "ABP Design-Moment Guard";

export const DESIGN_MOMENT_STATE_ENTRY = "abp-design-moment-allowed";
const INTERFACE_GATE_CYCLE_ENTRY = "abp-interface-gate-cycle";
const INTERFACE_GATE_UI_ALLOW_ENTRY = "abp-interface-gate-ui-allowed";
const INTERFACE_GATE_TITLE = "Interface Design Gate";

const APPROVAL_PATTERN = /\b(approve|approved|yes|looks good|go ahead|ship it|implement it|proceed)\b/i;
const REJECTION_PATTERN = /\b(reject|rejected|no|revise|change it|not that|don't implement|do not implement)\b/i;

const SURFACE_DIR_PATTERNS = [
  /(^|\/)(api|routes|handlers|controllers|endpoints)\//i,
  /(^|\/)(cli|commands|bin)\//i,
  /(^|\/)(schema|schemas|migrations)\//i,
  /(^|\/)(contracts|proto|protobuf)\//i,
  /(^|\/)src\/(index|mod|lib)\.[A-Za-z]+$/i,
  /(^|\/)src\/[^/]+\.(api|routes|endpoints|cli|schema)\.[A-Za-z]+$/i,
];

const SURFACE_FILE_PATTERNS = [
  /(^|\/)openapi[^/]*\.(ya?ml|json)$/i,
  /\.(graphql|gql|proto)$/i,
];

const EXCLUDED_PATH_PATTERNS = [
  /(^|\/)(tests?|__tests__|spec|specs|fixtures?|mocks?|stubs?)\//i,
  /\.(test|spec)\.[A-Za-z]+$/i,
  /\.md$/i,
  /\.(ya?ml|json|toml|lock)$/i,
];

const NEW_EXPORT_PATTERNS = [
  /^[ \t]*export[ \t]+(?:async[ \t]+)?(function|class|const|let|var|interface|type|enum)[ \t]+[A-Za-z_$]/m,
  /^[ \t]*export[ \t]+default[ \t]+(?:async[ \t]+)?(?:function|class)[ \t]+[A-Za-z_$]/m,
  /^[ \t]*pub[ \t]+(?:async[ \t]+)?(fn|struct|enum|trait|mod|const|type)[ \t]+[A-Za-z_]/m,
  /^[ \t]*func[ \t]+[A-Z][A-Za-z0-9_]*[ \t]*\(/m,
  /^[ \t]*type[ \t]+[A-Z][A-Za-z0-9_]*[ \t]+(?:struct|interface)/m,
  /^[ \t]*def[ \t]+[A-Za-z_][A-Za-z0-9_]*[ \t]*\(/m,
];

const BASH_NEW_FILE_PATTERN = /(?:^|[;&|]|\s)(?:tee\b|cat\b[\s\S]*?<<[\s\S]*?>|mv\b|cp\b|touch\b)[\s\S]*?(?:>{1,2}\s*)?(\S+)/i;

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

function lastUserMessageIndex(entries) {
  for (let index = entries.length - 1; index >= 0; index -= 1) {
    const message = entries[index]?.message ?? entries[index];
    if (message?.role === "user") return index;
  }
  return -1;
}

function lastClosedCycleIndex(entries) {
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

export function hasInterfaceGateApproval(entries) {
  const cycleStart = lastClosedCycleIndex(entries) + 1;
  const messages = chatMessages(entries.slice(cycleStart));
  const latestGateIndex = messages.findLastIndex(
    (message) => message.role === "assistant" && message.text.includes(INTERFACE_GATE_TITLE),
  );
  if (latestGateIndex === -1) return false;

  return messages.slice(latestGateIndex + 1).some((message) => {
    if (message.role !== "user") return false;
    if (REJECTION_PATTERN.test(message.text)) return false;
    return APPROVAL_PATTERN.test(message.text);
  });
}

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

export function hasDesignMomentAllowedThisTurn(entries) {
  const cutoff = lastUserMessageIndex(entries);
  for (let index = entries.length - 1; index > cutoff; index -= 1) {
    const entry = entries[index];
    if (entry?.type === "custom" && entry?.customType === DESIGN_MOMENT_STATE_ENTRY) {
      return true;
    }
  }
  return false;
}

export function isSurfacePath(path) {
  if (typeof path !== "string" || path.length === 0) return false;
  if (SURFACE_FILE_PATTERNS.some((pattern) => pattern.test(path))) return true;
  if (EXCLUDED_PATH_PATTERNS.some((pattern) => pattern.test(path))) return false;
  return SURFACE_DIR_PATTERNS.some((pattern) => pattern.test(path));
}

export function introducesNewExport(text) {
  if (typeof text !== "string" || text.length === 0) return false;
  return NEW_EXPORT_PATTERNS.some((pattern) => pattern.test(text));
}

export function editNewTexts(input) {
  if (!input || typeof input !== "object") return [];
  if (!Array.isArray(input.edits)) return [];
  return input.edits
    .map((edit) => (typeof edit?.newText === "string" ? edit.newText : ""))
    .filter((text) => text.length > 0);
}

function bashSurfaceTarget(command) {
  if (typeof command !== "string" || command.length === 0) return null;
  const match = BASH_NEW_FILE_PATTERN.exec(command);
  if (!match) return null;
  const candidate = match[1]?.replace(/^['"]|['"]$/g, "");
  return isSurfacePath(candidate) ? candidate : null;
}

export function designMomentFor(toolName, input) {
  if (toolName === "write") {
    const path = String(input?.path ?? "");
    if (!isSurfacePath(path)) return null;
    return { path, source: "write" };
  }

  if (toolName === "edit") {
    const path = String(input?.path ?? "");
    if (!isSurfacePath(path)) return null;
    const texts = editNewTexts(input);
    if (!texts.some((text) => introducesNewExport(text))) return null;
    return { path, source: "edit" };
  }

  if (toolName === "bash") {
    const path = bashSurfaceTarget(typeof input?.command === "string" ? input.command : "");
    if (!path) return null;
    return { path, source: "bash" };
  }

  return null;
}

export function shouldPromptDesignMoment(toolName, input, entries) {
  const moment = designMomentFor(toolName, input);
  if (!moment) return null;
  if (hasDesignMomentAllowedThisTurn(entries)) return null;
  if (hasInterfaceUiAllowThisTurn(entries)) return null;
  if (hasInterfaceGateApproval(entries)) return null;
  return moment;
}

export function designMomentBlockReason(moment) {
  return (
    `${MARKER}: this change writes to ${moment.path}, which looks like a new public surface ` +
    "(API/CLI/schema/contract). Open an Interface Design Gate packet first:\n" +
    "- Current interface: existing shape or \"new interface\"\n" +
    "- Proposed interface: concrete function/class/module/API/config/event shape\n" +
    "- Why this boundary: why this interface belongs here\n" +
    "- User decision: ask the user to approve, revise, or rule it out\n" +
    "Then retry the tool call. If this is not a new public surface, write a one-line note saying so and proceed."
  );
}

function uiConfirmPrompt(moment) {
  return (
    `${moment.path} looks like a new public surface. The Interface Design Gate ` +
    "asks you to approve a contract before the agent implements one. " +
    "Allow this mutation without a packet, or block so the agent can open one?"
  );
}

export function designMomentReminder() {
  return (
    `\n\n${MARKER}:\nBefore your first mutating tool call on a new or materially changed public surface ` +
    "(API/CLI/schema/contract/migration), open an Interface Design Gate packet with Current interface, " +
    "Proposed interface, Why this boundary, and User decision. The runtime checks the file path; if the " +
    "path looks like a public surface and you have not opened a packet, the call will be paused."
  );
}

export default function designMomentGuard(pi) {
  pi.on("before_agent_start", async (event) => ({
    systemPrompt: event.systemPrompt + designMomentReminder(),
  }));

  pi.on("tool_call", async (event, ctx) => {
    const entries = ctx.sessionManager.getBranch();
    const moment = shouldPromptDesignMoment(event.toolName, event.input, entries);
    if (!moment) return;

    if (!ctx.hasUI) {
      return { block: true, reason: designMomentBlockReason(moment) };
    }

    const allowed = await ctx.ui.confirm(MARKER, uiConfirmPrompt(moment));
    if (!allowed) {
      return { block: true, reason: designMomentBlockReason(moment) };
    }

    pi.appendEntry(DESIGN_MOMENT_STATE_ENTRY, { path: moment.path, allowedAt: Date.now() });
  });
}
