export const CODE_REVIEW_SECTIONS = [
  "Review Target",
  "Scope",
  "Checklist",
  "Findings",
  "Proof",
  "Residual Risk",
  "Recommendation",
];

export const CHECKLIST_ITEMS = [
  "Runtime/toolchain constraints checked",
  "Diff intent and impact identified",
  "Security pass completed",
  "Data-loss/destructive-action risk checked",
  "Contract/API/schema/config changes checked",
  "Error handling and edge cases checked",
  "Tests/proof evidence checked",
  "Dead code, duplication, generated drift checked",
  "AI-agent failure modes checked",
  "Release/version/migration implications checked or marked not applicable",
];

export const REVIEW_STATUSES = ["Checked", "Not applicable", "Unproven"];
export const REVIEW_RECOMMENDATIONS = [
  "Block",
  "Request changes",
  "Approve with residual risk",
  "No recommendation because review is unproven",
];

const REVIEW_SESSION_ENTRY = "abp-code-review-session";

export function normalizeReviewTarget(value) {
  const target = String(value ?? "").trim();
  return target.length > 0 ? target : "working-tree";
}

function checklistLines() {
  return CHECKLIST_ITEMS.map((item) => `- ${item}: Pending until review_check records Checked | Not applicable | Unproven with evidence`).join("\n");
}

function text(value) {
  return String(value ?? "").trim();
}

function unresolvedChecks(session) {
  return session.checks.filter((check) => check.status === "Pending" || text(check.evidence).length === 0);
}

export function startReviewSession(value) {
  return {
    target: normalizeReviewTarget(value),
    checks: CHECKLIST_ITEMS.map((item) => ({ item, status: "Pending", evidence: "" })),
  };
}

export function updateReviewCheck(session, params) {
  const item = text(params?.item);
  const status = text(params?.status);
  const evidence = text(params?.evidence);

  if (!CHECKLIST_ITEMS.includes(item)) return { ok: false, reason: `Unknown review checklist item: ${item}` };
  if (!REVIEW_STATUSES.includes(status)) return { ok: false, reason: `Invalid review status for ${item}: ${status}` };
  if (evidence.length === 0) return { ok: false, reason: `Evidence is required for ${item}.` };

  return {
    ok: true,
    session: {
      ...session,
      checks: session.checks.map((check) => (check.item === item ? { item, status, evidence } : check)),
    },
  };
}

function requiredText(params, key) {
  const value = text(params?.[key]);
  return value.length === 0 ? null : value;
}

export function completeReview(session, params) {
  const unresolved = unresolvedChecks(session);
  if (unresolved.length > 0) {
    return {
      ok: false,
      reason: `Review checklist is not complete. Resolve these items first: ${unresolved.map((check) => check.item).join(", ")}`,
    };
  }

  const findings = requiredText(params, "findings");
  const proof = requiredText(params, "proof");
  const residualRisk = requiredText(params, "residualRisk");
  const recommendation = requiredText(params, "recommendation");
  if (!findings || !proof || !residualRisk || !recommendation) {
    return { ok: false, reason: "findings, proof, residualRisk, and recommendation are required." };
  }
  if (!REVIEW_RECOMMENDATIONS.includes(recommendation)) {
    return { ok: false, reason: `Invalid review recommendation: ${recommendation}` };
  }

  return {
    ok: true,
    summary: `Review Target: ${session.target}\n\nChecklist:\n${session.checks
      .map((check) => `- ${check.item}: ${check.status} — ${check.evidence}`)
      .join("\n")}\n\nFindings: ${findings}\n\nProof: ${proof}\n\nResidual Risk: ${residualRisk}\n\nRecommendation: ${recommendation}`,
  };
}

export function makeCodeReviewPrompt(value) {
  const target = normalizeReviewTarget(value);

  return `Use the code-review skill to review this target. The checklist below is the compact runtime projection of the code-review skill's Verification section plus its AI-Agent Failure Modes section.

Review Target: ${target}

Scope:
State what diff or PR scope you reviewed. If the target is ambiguous or unavailable, say so and mark the review unproven.

Checklist:
${checklistLines()}

While reviewing, call review_check after each checklist pass with the item, status, and concrete evidence. You cannot complete the review until every item has a status and non-empty evidence. Then call review_complete with findings, proof, residualRisk, and recommendation.

Findings:
List findings in severity order. For each finding include file/line or anchor, issue, impact, fix direction, and evidence or missing proof. If there are no findings, write "No findings" and do not omit Residual Risk.

Proof:
Name test, build, typecheck, lint, CI, or inspection evidence. If evidence was not run or cannot be checked, mark it Unproven and name the blocker.

Residual Risk:
Name unreviewed scope, assumptions, generated/vendor/lockfile limits, missing CI, or why remaining risk is low.

Recommendation:
Choose one: Block, Request changes, Approve with residual risk, or No recommendation because review is unproven.`;
}

const reviewCheckParameters = {
  type: "object",
  properties: {
    item: { type: "string", enum: CHECKLIST_ITEMS },
    status: { type: "string", enum: REVIEW_STATUSES },
    evidence: { type: "string" },
  },
  required: ["item", "status", "evidence"],
};

const reviewCompleteParameters = {
  type: "object",
  properties: {
    findings: { type: "string" },
    proof: { type: "string" },
    residualRisk: { type: "string" },
    recommendation: { type: "string", enum: REVIEW_RECOMMENDATIONS },
  },
  required: ["findings", "proof", "residualRisk", "recommendation"],
};

function textComponent(lines, theme) {
  return {
    render(width) {
      return lines.map((line) => String(line).slice(0, width));
    },
    invalidate() {},
  };
}

function checklistIcon(status) {
  if (status === "Pending") return "☐";
  return "☑";
}

function statusColor(status, theme, value) {
  if (!theme) return value;
  if (status === "Unproven") return theme.fg("warning", value);
  if (status === "Not applicable") return theme.fg("muted", value);
  if (status === "Checked") return theme.fg("success", value);
  return theme.fg("dim", value);
}

function resolvedCheckCount(checks) {
  return checks.filter((check) => check.status !== "Pending" && text(check.evidence).length > 0).length;
}

function latestResolvedCheck(checks) {
  return checks.findLast?.((check) => check.status !== "Pending" && text(check.evidence).length > 0)
    ?? [...checks].reverse().find((check) => check.status !== "Pending" && text(check.evidence).length > 0)
    ?? null;
}

export function renderReviewCheckResult(result, _options, theme) {
  const session = result?.details?.session ?? result?.session;
  const checks = Array.isArray(session?.checks) ? session.checks : [];
  const check = result?.details?.check ?? result?.check ?? latestResolvedCheck(checks);
  const resolved = resolvedCheckCount(checks);
  const total = checks.length || CHECKLIST_ITEMS.length;
  const label = check ? `${checklistIcon(check.status)} ${check.item}` : "☐ Review checklist";
  const status = check?.status ?? "Pending";
  const lines = [
    "ABP code-review progress",
    `${statusColor(status, theme, label)} — ${status} (${resolved}/${total} resolved)`,
  ];
  return textComponent(lines, theme);
}

function findingPriority(line) {
  if (/^(Critical|High)\b/i.test(line)) return { badge: "■ P1", color: "error" };
  if (/^Medium\b/i.test(line)) return { badge: "■ P2", color: "warning" };
  if (/^Low\b/i.test(line)) return { badge: "■ P3", color: "warning" };
  return null;
}

function summarySection(summary, name, nextName) {
  const start = summary.indexOf(`${name}:`);
  if (start === -1) return "";
  const bodyStart = start + name.length + 1;
  const end = nextName ? summary.indexOf(`\n\n${nextName}:`, bodyStart) : -1;
  return summary.slice(bodyStart, end === -1 ? undefined : end).trim();
}

function renderFindingLine(line, theme) {
  const priority = findingPriority(line);
  if (!priority) return line;

  const badge = theme ? theme.fg(priority.color, priority.badge) : priority.badge;
  return `${badge} ${line}`;
}

export function renderReviewCompleteResult(result, _options, theme) {
  const summary = String(result?.details?.summary ?? result?.summary ?? result?.content?.[0]?.text ?? "");
  const findings = summarySection(summary, "Findings", "Proof");
  const lines = ["ABP code-review findings"];
  lines.push(...(findings || "No findings").split("\n").map((line) => renderFindingLine(line.trim(), theme)));
  return textComponent(lines, theme);
}

function toolText(value, details) {
  return { content: [{ type: "text", text: value }], details };
}

function toolError(reason) {
  return { ...toolText(reason), isError: true };
}

function isReviewSession(value) {
  if (value == null || typeof value.target !== "string" || !Array.isArray(value.checks)) return false;
  if (value.checks.length !== CHECKLIST_ITEMS.length) return false;

  return value.checks.every(
    (check, index) =>
      check?.item === CHECKLIST_ITEMS[index] &&
      (check.status === "Pending" || REVIEW_STATUSES.includes(check.status)) &&
      typeof check.evidence === "string"
  );
}

function latestPersistedSession(entries) {
  let session = null;
  for (const entry of entries ?? []) {
    if (entry?.type !== "custom" || entry?.customType !== REVIEW_SESSION_ENTRY) continue;
    session = isReviewSession(entry.data) ? entry.data : null;
  }
  return session;
}

export default function codeReviewRuntime(pi) {
  let activeSession = null;

  function persistSession() {
    pi.appendEntry?.(REVIEW_SESSION_ENTRY, activeSession);
  }

  pi.on?.("session_start", async (_event, ctx) => {
    activeSession = latestPersistedSession(ctx?.sessionManager?.getEntries?.());
  });

  pi.registerCommand("review", {
    description: "Run an ABP code review with the runtime checklist",
    handler: async (args) => {
      activeSession = startReviewSession(args);
      persistSession();
      pi.sendUserMessage(makeCodeReviewPrompt(args));
    },
  });

  pi.registerTool({
    name: "review_check",
    label: "Review Check",
    description: "Record evidenced status for one ABP code-review checklist item.",
    parameters: reviewCheckParameters,
    promptSnippet: "Record evidenced status for one active ABP code-review checklist item.",
    promptGuidelines: [
      "Use review_check during /review after completing each checklist pass; provide concrete evidence and mark unknowns Unproven.",
    ],
    renderResult: renderReviewCheckResult,
    async execute(_toolCallId, params) {
      if (!activeSession) return toolError("No active ABP review session. Run /review [target] first.");

      const result = updateReviewCheck(activeSession, params);
      if (!result.ok) return toolError(result.reason);

      activeSession = result.session;
      persistSession();
      return toolText(`Recorded review check: ${params.item} — ${params.status}`, {
        session: activeSession,
        check: activeSession.checks.find((check) => check.item === params.item),
      });
    },
  });

  pi.registerTool({
    name: "review_complete",
    label: "Review Complete",
    description: "Complete an ABP code review after every checklist item has evidenced status.",
    parameters: reviewCompleteParameters,
    promptSnippet: "Complete the active ABP code review only after every review_check item is resolved.",
    promptGuidelines: [
      "Use review_complete only after all /review checklist items have been recorded with review_check.",
    ],
    renderResult: renderReviewCompleteResult,
    async execute(_toolCallId, params) {
      if (!activeSession) return toolError("No active ABP review session. Run /review [target] first.");

      const result = completeReview(activeSession, params);
      if (!result.ok) return toolError(result.reason);

      activeSession = null;
      persistSession();
      return toolText(`Review complete: ${params.recommendation}`, {
        summary: result.summary,
      });
    },
  });
}
