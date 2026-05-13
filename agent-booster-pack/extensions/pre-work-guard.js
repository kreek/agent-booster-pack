const PRE_WORK_MARKER = "ABP Pre-Work Reflection Gate";
const PRE_WORK_STATE_ENTRY = "abp-pre-work-explained";
export const BRANCH_GUARD_STATE_ENTRY = "abp-branch-isolation-accepted";

const PROTECTED_BRANCHES = new Set(["main", "master"]);
const BRANCH_CHOICE = "Create/switch to a topic branch in this worktree";
const CONTINUE_CHOICE = "Continue on current branch";
const STOP_CHOICE = "Stop and let me handle Git";
const CHANGE_TOOL_NAMES = new Set(["edit", "write"]);
const MUTATING_BASH_PATTERN = /(\btee\b|\bpython\b[\s\S]*\bopen\([^)]*['"]w|\bnode\b[\s\S]*writeFile|\bperl\s+-pi\b|\bsed\s+-i\b|\bmv\b|\bcp\b|\btouch\b|\bchmod\b|\bgit\s+apply\b|\bpatch\b)/i;
const TOPIC_BRANCH_PATTERN = /^(feature|fix|refactor|chore)\//;


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

function hasCustomEntryThisTurn(entries, customType) {
  const cutoff = lastUserMessageIndex(entries);
  for (let index = entries.length - 1; index > cutoff; index -= 1) {
    const entry = entries[index];
    if (entry?.type === "custom" && entry?.customType === customType) return true;
  }
  return false;
}

export function hasAlreadyExplainedThisTurn(entries) {
  return hasCustomEntryThisTurn(entries, PRE_WORK_STATE_ENTRY);
}

export function lastBranchIsolationEntry(entries) {
  for (let index = entries.length - 1; index >= 0; index -= 1) {
    const entry = entries[index];
    if (entry?.type === "custom" && entry?.customType === BRANCH_GUARD_STATE_ENTRY) {
      return entry.data ?? null;
    }
  }
  return null;
}

export function branchIsolationAcceptedFor(entries, branch) {
  const last = lastBranchIsolationEntry(entries);
  return last != null && last.branch === branch;
}

async function git(exec, ...args) {
  return exec("git", args);
}

export async function branchIsolationStatus(exec) {
  const inside = await git(exec, "rev-parse", "--is-inside-work-tree");
  if (inside.code !== 0 || inside.stdout.trim() !== "true") return null;

  const branchResult = await git(exec, "branch", "--show-current");
  const branch = branchResult.stdout.trim() || "(detached HEAD)";
  const statusResult = await git(exec, "status", "--porcelain");
  const dirty = statusResult.stdout.trim().length > 0;

  if (PROTECTED_BRANCHES.has(branch)) return { kind: "protected_branch", branch, dirty };
  if (dirty && TOPIC_BRANCH_PATTERN.test(branch)) return null;
  if (dirty) return { kind: "dirty_branch", branch, dirty };

  for (const baseBranch of PROTECTED_BRANCHES) {
    const baseExists = await git(exec, "rev-parse", "--verify", baseBranch);
    if (baseExists.code !== 0) continue;

    const merged = await git(exec, "merge-base", "--is-ancestor", "HEAD", baseBranch);
    if (merged.code !== 0) return { kind: "unmerged_branch", branch, dirty };
    break;
  }

  return null;
}

function branchGuardPrompt(status) {
  const reason =
    status.kind === "protected_branch"
      ? `You are on protected branch ${status.branch}. Start implementation on a topic branch.`
      : status.kind === "unmerged_branch"
        ? `Current branch ${status.branch} has commits not merged to main. Choose how to isolate this work.`
        : `Current branch ${status.branch} has uncommitted changes. Choose how to isolate this work.`;
  return `${reason}\n\nPick the next Git step:`;
}

function invalidBranchName(name) {
  return !name || /\s/.test(name) || name.startsWith("-");
}

export async function handleBranchIsolation({ exec, ui, hasUI, entries, appendEntry }) {
  const status = await branchIsolationStatus(exec);
  if (!status) return;
  if (branchIsolationAcceptedFor(entries, status.branch)) return;

  if (!hasUI) {
    return { block: true, reason: "ABP Branch Isolation Guard: create or switch to a topic branch before mutating files." };
  }

  const choices = [BRANCH_CHOICE, CONTINUE_CHOICE, STOP_CHOICE];
  const choice = await ui.select(branchGuardPrompt(status), choices);

  if (choice === BRANCH_CHOICE) {
    const branchName = String(await ui.input("Topic branch name (example: fix/customer-cache)") ?? "").trim();
    if (invalidBranchName(branchName)) {
      return { block: true, reason: "ABP Branch Isolation Guard: no valid topic branch name was provided." };
    }

    const result = await git(exec, "switch", "-c", branchName);
    if (result.code !== 0) {
      return { block: true, reason: result.stderr.trim() || `ABP Branch Isolation Guard: could not create ${branchName}.` };
    }

    appendEntry(BRANCH_GUARD_STATE_ENTRY, { choice, branch: branchName, acceptedAt: Date.now() });
    return;
  }

  if (choice === CONTINUE_CHOICE) {
    appendEntry(BRANCH_GUARD_STATE_ENTRY, { choice, branch: status.branch, acceptedAt: Date.now() });
    return;
  }

  return { block: true, reason: "ABP Branch Isolation Guard: stopped so you can handle Git state." };
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
  return `\n\n${PRE_WORK_MARKER}:\nBefore your first mutating tool call (edit, write, mutating bash) in a turn, write a brief pre-work explanation with non-empty labels. For a single-file edit, use Plan: and Why:. For multi-file or mutating-bash changes, use Plan:, Why:, and Alternatives:. Git packaging commands such as git add/commit/merge do not need this explainer. The explanation teaches the user the codebase you are writing and gives them a chance to redirect before code lands.`;
}

export function manualPreWorkPrompt(intent) {
  const subject = String(intent ?? "").trim();
  return [
    "Use ABP pre-work reflection before changing files.",
    "",
    "State:",
    "- Plan: what will change",
    "- Why: why this is better or safer than the current state",
    "- Alternatives: options considered or rejected",
    "",
    subject ? `Intent: ${subject}` : "Then wait for the user's next instruction before implementation.",
  ].join("\n");
}

export default function preWorkGuard(pi) {
  pi.registerCommand("abp:branch", {
    description: "Run ABP branch isolation check",
    handler: async (_args, ctx) => {
      const entries = ctx.sessionManager?.getBranch?.() ?? [];
      const branchResult = await handleBranchIsolation({
        exec: (...args) => pi.exec(...args, { signal: ctx.signal, timeout: 5000 }),
        ui: ctx.ui,
        hasUI: ctx.hasUI,
        entries,
        appendEntry: (...args) => pi.appendEntry(...args),
      });

      if (branchResult) return branchResult;
      ctx.ui.notify("ABP branch check complete", "info");
    },
  });

  pi.registerCommand("abp:prework", {
    description: "Ask the agent for an ABP pre-work reflection",
    handler: async (args) => {
      await pi.sendUserMessage(manualPreWorkPrompt(args));
    },
  });
}
