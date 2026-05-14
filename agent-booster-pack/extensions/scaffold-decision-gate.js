export const SCAFFOLD_STATE_ENTRY = "abp-scaffold-state";

const EXPLICIT_ACTIVATION_PATTERN = /^\s*(\/abp:scaffold(?:\s|$)|\/skill:scaffolding(?:\s|$))/i;
const FRESH_SCAFFOLD_PATTERN = /\b(create|make|build|scaffold|set\s+up|setup|initialize|init)\b[\s\S]*\b(app|project|site|website|web\s+app|api|cli|tool|library|worker|react|svelte|vue|next|vite)\b/i;
const DEACTIVATION_PATTERN = /^\s*\/abp:scaffold-off\s*$/i;
const CHANGE_TOOL_NAMES = new Set(["edit", "write"]);
const SCAFFOLD_BASH_PATTERN = /(\bnpm\s+(create|init|install|i|add)\b|\bpnpm\s+(create|init|install|i|add|dlx)\b|\byarn\s+(create|init|add|install|dlx)\b|\bbun\s+(create|init|install|add|x)\b|\bnpx\b|\buv\s+(init|add|sync|pip\s+install)\b|\bpip\s+install\b|\bpoetry\s+(init|add|install)\b|\bcargo\s+(init|new|add)\b|\bgo\s+mod\s+init\b|\bdotnet\s+new\b|\bcomposer\s+(init|require|install|create-project)\b|\bmix\s+new\b|\bswift\s+package\s+init\b|\bmkdir\b|\btouch\b|\btee\b|(^|[^0-9])>|\bcat\s+<<|\bcp\b|\bmv\b|\bgit\s+init\b)/i;
const REQUIRED_GATE_LABELS = [
  "Project intent",
  "Project kind",
  "Language/runtime",
  "Deployment assumption",
  "Framework/template",
  "Quality baseline",
  "Files and commands",
  "User decision",
];
const APPROVAL_PATTERN = /^\s*(1\b|approve\b|approved\b|go ahead\b|proceed\b|yes\b|do it\b)/i;
const NON_APPROVAL_PATTERN = /^\s*(2\b|3\b|refine\b|change\b|cancel\b|revise\b|instead\b|no\b|not yet\b|different\b|choose another\b)/i;
const DECISION_MENU_PATTERN = /1\.\s*Approve\b[\s\S]*create files\s*\/\s*install packages\s*\/\s*run generators[\s\S]*2\.\s*Refine\b[\s\S]*change the scaffold plan[\s\S]*3\.\s*Cancel\b[\s\S]*stop scaffolding/i;
const VAGUE_BASELINE_PATTERN = /\b(if feasible|where practical|as needed|where applicable|if possible|try to)\b/i;
const BLOCKER_PATTERN = /\b(blocker|blocked by|because|cannot|unavailable|not available|defer|deferred)\b/i;

function messageText(value) {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    return value.map((item) => (typeof item?.text === "string" ? item.text : "")).join("\n");
  }
  return "";
}

function chatMessages(entries) {
  return entries
    .map((entry) => entry?.message ?? entry)
    .filter((message) => message?.role === "user" || message?.role === "assistant")
    .map((message) => ({ role: message.role, text: messageText(message.content).trim() }))
    .filter((message) => message.text.length > 0);
}

function latestScaffoldState(entries) {
  const stateEntry = entries
    .filter((entry) => entry?.type === "custom" && entry.customType === SCAFFOLD_STATE_ENTRY)
    .at(-1);

  return stateEntry?.data?.active === true;
}

function latestActiveStateIndex(entries) {
  for (let index = entries.length - 1; index >= 0; index -= 1) {
    const entry = entries[index];
    if (entry?.type !== "custom" || entry.customType !== SCAFFOLD_STATE_ENTRY) continue;
    return entry.data?.active === true ? index : -1;
  }
  return -1;
}

function latestGateIndex(messages) {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    if (messages[index].role !== "assistant") continue;
    if (hasScaffoldDecisionGate(messages[index].text)) return index;
  }
  return -1;
}

export function isScaffoldActivation(text) {
  const value = String(text ?? "");
  if (isScaffoldDeactivation(value)) return false;
  return EXPLICIT_ACTIVATION_PATTERN.test(value) || FRESH_SCAFFOLD_PATTERN.test(value);
}

export function isScaffoldDeactivation(text) {
  return DEACTIVATION_PATTERN.test(String(text ?? ""));
}

function escapedLabel(label) {
  return label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function labelValue(text, label) {
  const labels = REQUIRED_GATE_LABELS.map(escapedLabel).join("|");
  const pattern = new RegExp(`(^|\\n)\\s*${escapedLabel(label)}:\\s*([\\s\\S]*?)(?=\\n\\s*(${labels}):|$)`, "i");
  return text.match(pattern)?.[2]?.trim() ?? "";
}

function baselineAndFilesText(text) {
  const baseline = labelValue(text, "Quality baseline");
  const files = labelValue(text, "Files and commands");
  return `${baseline}\n${files}`;
}

function hasVagueBaseline(text) {
  return VAGUE_BASELINE_PATTERN.test(baselineAndFilesText(text));
}

function hasQualityGateBaseline(text) {
  const value = baselineAndFilesText(text);
  return /\b(ci|continuous integration)\b/i.test(value) && /\bcoverage\b/i.test(value);
}

function hasDecisionMenu(text) {
  return DECISION_MENU_PATTERN.test(labelValue(text, "User decision"));
}

export function hasScaffoldDecisionGate(text) {
  const value = String(text ?? "");
  if (!value.includes("Scaffold Decision Gate")) return false;
  if (!REQUIRED_GATE_LABELS.every((label) => labelValue(value, label).length > 0)) return false;
  if (!hasDecisionMenu(value)) return false;
  if (hasVagueBaseline(value) && !BLOCKER_PATTERN.test(value)) return false;
  if (!hasQualityGateBaseline(value) && !BLOCKER_PATTERN.test(value)) return false;
  return true;
}

export function isScaffoldApproved(entries) {
  const activationIndex = latestActiveStateIndex(entries);
  const scopedEntries = activationIndex >= 0 ? entries.slice(activationIndex + 1) : entries;
  const messages = chatMessages(scopedEntries);
  const gateIndex = latestGateIndex(messages);
  if (gateIndex < 0) return false;

  for (const message of messages.slice(gateIndex + 1)) {
    if (message.role !== "user") continue;
    if (NON_APPROVAL_PATTERN.test(message.text)) return false;
    if (APPROVAL_PATTERN.test(message.text)) return true;
  }

  return false;
}

export function isScaffoldMutation(toolName, input) {
  if (CHANGE_TOOL_NAMES.has(toolName)) return true;
  if (toolName !== "bash") return false;

  const command = typeof input?.command === "string" ? input.command : "";
  return SCAFFOLD_BASH_PATTERN.test(command);
}

export function shouldBlockScaffoldMutation(toolName, input, entries) {
  if (!latestScaffoldState(entries)) return null;
  if (!isScaffoldMutation(toolName, input)) return null;
  if (isScaffoldApproved(entries)) return null;

  return {
    reason: "ABP Scaffold Decision Gate: before scaffold files, installs, or generators, present a Scaffold Decision Gate with the 1 Approve / 2 Refine / 3 Cancel menu and wait for user approval.",
  };
}

export function scaffoldReminder() {
  return `\n\nABP Scaffold Decision Gate is active. Before creating scaffold files, installing packages, or running generators, present a Scaffold Decision Gate with Project intent, Project kind, Language/runtime, Deployment assumption, Framework/template, Quality baseline, Files and commands, and User decision. User decision must offer: 1. Approve — create files / install packages / run generators; 2. Refine — change the scaffold plan; 3. Cancel — stop scaffolding. The user decides setup choices; you wire the chosen tests, linting, formatting, typecheck, coverage, CI, and README. Wait for option 1 or clear approval before mutating scaffold files.`;
}

function scaffoldPrompt(intent) {
  const subject = String(intent ?? "").trim();
  return [
    "Use ABP Scaffold Decision Gate before scaffold mutation.",
    "",
    "Present setup options in order of importance, recommend one, and wait for approval:",
    "- Project intent: what the app/tool/library should do",
    "- Project kind: app, library, CLI, API, worker, frontend, fullstack, or other",
    "- Language/runtime: selected option and why",
    "- Deployment assumption: local, static host, Node/server, Cloudflare, container, or other",
    "- Framework/template: Backstage template when one fits, otherwise fallback stack and tradeoff",
    "- Quality baseline: package manager, test, lint, format, typecheck, coverage, CI",
    "- Files and commands: what will be created or run",
    "- User decision:",
    "  1. Approve — create files / install packages / run generators",
    "  2. Refine — change the scaffold plan",
    "  3. Cancel — stop scaffolding",
    "",
    subject ? `Intent: ${subject}` : "Then wait for option 1 or a clear approval before creating files or running scaffold commands.",
  ].join("\n");
}

export default function scaffoldDecisionGate(pi) {
  pi.registerCommand("abp:scaffold", {
    description: "Start ABP scaffold decision gate",
    handler: async (args, ctx) => {
      pi.appendEntry(SCAFFOLD_STATE_ENTRY, { active: true, source: "command" });
      ctx.ui.notify("ABP scaffold decision gate enabled", "info");
      await pi.sendUserMessage(scaffoldPrompt(args));
    },
  });

  pi.registerCommand("abp:scaffold-off", {
    description: "Stop ABP scaffold decision gate",
    handler: async (_args, ctx) => {
      pi.appendEntry(SCAFFOLD_STATE_ENTRY, { active: false, source: "command" });
      ctx.ui.notify("ABP scaffold decision gate disabled", "info");
    },
  });

  pi.on("input", async (event, ctx) => {
    if (isScaffoldDeactivation(event.text)) {
      pi.appendEntry(SCAFFOLD_STATE_ENTRY, { active: false, source: "input" });
      ctx.ui.notify("ABP scaffold decision gate disabled", "info");
      return { action: "handled" };
    }

    if (isScaffoldActivation(event.text)) {
      pi.appendEntry(SCAFFOLD_STATE_ENTRY, { active: true, source: "input" });
      ctx.ui.notify("ABP scaffold decision gate enabled", "info");
    }

    return { action: "continue" };
  });

  pi.on("before_agent_start", async (event, ctx) => {
    if (!latestScaffoldState(ctx.sessionManager.getEntries())) return;
    return { systemPrompt: event.systemPrompt + scaffoldReminder() };
  });

  pi.on("tool_call", async (event, ctx) => {
    const verdict = shouldBlockScaffoldMutation(event.toolName, event.input, ctx.sessionManager.getEntries());
    if (!verdict) return;
    return { block: true, reason: verdict.reason };
  });
}
