import { describe, expect, it } from "vitest";

import codeReviewRuntime, {
  CODE_REVIEW_SECTIONS,
  CHECKLIST_ITEMS,
  makeCodeReviewPrompt,
  normalizeReviewTarget,
  startReviewSession,
  updateReviewCheck,
  completeReview,
  renderReviewCheckResult,
  renderReviewCompleteResult,
} from "../extensions/code-review-runtime.js";

describe("code review runtime", () => {
  it("normalizes omitted review target to working-tree", () => {
    expect(normalizeReviewTarget("")).toBe("working-tree");
    expect(normalizeReviewTarget(undefined)).toBe("working-tree");
  });

  it("accepts explicit local review targets", () => {
    expect(normalizeReviewTarget("staged")).toBe("staged");
    expect(normalizeReviewTarget("branch")).toBe("branch");
    expect(normalizeReviewTarget("HEAD~2..HEAD")).toBe("HEAD~2..HEAD");
  });

  it("builds a prompt with required review sections", () => {
    const prompt = makeCodeReviewPrompt("staged");

    for (const section of CODE_REVIEW_SECTIONS) {
      expect(prompt).toContain(`${section}:`);
    }
  });

  it("builds a checklist projected from the code-review skill verification duties", () => {
    const prompt = makeCodeReviewPrompt("working-tree");

    for (const item of CHECKLIST_ITEMS) {
      expect(prompt).toContain(item);
    }

    expect(prompt).toMatch(/Checked \| Not applicable \| Unproven/);
    expect(prompt).toMatch(/AI-agent failure modes/i);
    expect(prompt).toMatch(/security pass/i);
    expect(prompt).toMatch(/tests\/proof evidence/i);
  });

  it("registers a review command that sends the structured prompt", async () => {
    const commands = new Map();
    const sent = [];
    const fakePi = {
      registerCommand: (name, definition) => commands.set(name, definition),
      registerTool() {},
      sendUserMessage: (message) => sent.push(message),
    };

    codeReviewRuntime(fakePi);

    const command = commands.get("review");
    expect(command).toBeTruthy();
    expect(command.description).toMatch(/code review/i);

    await command.handler("staged", { ui: { notify() {} } });

    expect(sent).toHaveLength(1);
    expect(sent[0]).toContain("Review Target: staged");
    expect(sent[0]).toContain("Findings:");
    expect(sent[0]).toContain("Recommendation:");
  });

  it("starts a review session with every checklist item pending", () => {
    const session = startReviewSession("staged");

    expect(session.target).toBe("staged");
    expect(session.checks).toHaveLength(CHECKLIST_ITEMS.length);
    expect(session.checks.every((check) => check.status === "Pending")).toBe(true);
  });

  it("records evidenced status for one checklist item", () => {
    const session = startReviewSession("working-tree");
    const result = updateReviewCheck(session, {
      item: CHECKLIST_ITEMS[0],
      status: "Checked",
      evidence: "Read package.json and lockfile to confirm Node/Vitest toolchain.",
    });

    expect(result.ok).toBe(true);
    expect(result.session.checks[0]).toMatchObject({
      item: CHECKLIST_ITEMS[0],
      status: "Checked",
      evidence: "Read package.json and lockfile to confirm Node/Vitest toolchain.",
    });
  });

  it("rejects checklist updates without evidence", () => {
    const session = startReviewSession("working-tree");
    const result = updateReviewCheck(session, {
      item: CHECKLIST_ITEMS[0],
      status: "Checked",
      evidence: " ",
    });

    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/evidence/i);
  });

  it("blocks review completion until every checklist item is resolved", () => {
    const session = startReviewSession("working-tree");
    const result = completeReview(session, {
      findings: "No findings.",
      proof: "Inspected diff only.",
      residualRisk: "Tests were not run.",
      recommendation: "No recommendation because review is unproven",
    });

    expect(result.ok).toBe(false);
    expect(result.reason).toContain(CHECKLIST_ITEMS[0]);
  });

  it("accepts completion after every checklist item has evidenced status", () => {
    const session = CHECKLIST_ITEMS.reduce((current, item) => {
      const result = updateReviewCheck(current, {
        item,
        status: item.includes("Release") ? "Not applicable" : "Checked",
        evidence: `Evidence for ${item}`,
      });
      expect(result.ok).toBe(true);
      return result.session;
    }, startReviewSession("staged"));

    const result = completeReview(session, {
      findings: "No findings.",
      proof: "npm test passed.",
      residualRisk: "No CI status checked.",
      recommendation: "Approve with residual risk",
    });

    expect(result.ok).toBe(true);
    expect(result.summary).toContain("Recommendation: Approve with residual risk");
    expect(result.summary).toContain("Residual Risk: No CI status checked.");
  });

  it("registers review_check and review_complete tools", () => {
    const tools = new Map();
    const fakePi = {
      registerCommand() {},
      registerTool: (definition) => tools.set(definition.name, definition),
    };

    codeReviewRuntime(fakePi);

    expect(tools.get("review_check")).toBeTruthy();
    expect(tools.get("review_complete")).toBeTruthy();
  });

  it("renders checklist progress with blank and checked squares", () => {
    const session = updateReviewCheck(startReviewSession("working-tree"), {
      item: CHECKLIST_ITEMS[0],
      status: "Checked",
      evidence: "Inspected package.json.",
    }).session;

    const lines = renderReviewCheckResult({ session }).render(120);

    expect(lines.join("\n")).toContain("☑ Runtime/toolchain constraints checked");
    expect(lines.join("\n")).toContain("☐ Diff intent and impact identified");
  });

  it("renders review findings with priority square badges", () => {
    const result = completeReview(
      CHECKLIST_ITEMS.reduce((current, item) => {
        return updateReviewCheck(current, {
          item,
          status: "Checked",
          evidence: `Evidence for ${item}`,
        }).session;
      }, startReviewSession("working-tree")),
      {
        findings: [
          "High — src/a.js:1: breaks auth.",
          "Medium — src/b.js:2: missing test.",
          "Low — src/c.js:3: clarify name.",
        ].join("\n"),
        proof: "npm test passed.",
        residualRisk: "CI not checked.",
        recommendation: "Request changes",
      }
    );

    const lines = renderReviewCompleteResult({ summary: result.summary }).render(120);
    const text = lines.join("\n");

    expect(text).toContain("■ P1 High — src/a.js:1: breaks auth.");
    expect(text).toContain("■ P2 Medium — src/b.js:2: missing test.");
    expect(text).toContain("■ P3 Low — src/c.js:3: clarify name.");
  });

  it("records review_check progress only after /review starts a session", async () => {
    const commands = new Map();
    const tools = new Map();
    const fakePi = {
      registerCommand: (name, definition) => commands.set(name, definition),
      registerTool: (definition) => tools.set(definition.name, definition),
      sendUserMessage() {},
    };

    codeReviewRuntime(fakePi);

    const beforeStart = await tools.get("review_check").execute("tool-1", {
      item: CHECKLIST_ITEMS[0],
      status: "Checked",
      evidence: "Inspected package.json.",
    });
    expect(beforeStart.isError).toBe(true);
    expect(beforeStart.content[0].text).toMatch(/Run \/review/i);

    await commands.get("review").handler("staged", { ui: { notify() {} } });

    const afterStart = await tools.get("review_check").execute("tool-2", {
      item: CHECKLIST_ITEMS[0],
      status: "Checked",
      evidence: "Inspected package.json.",
    });
    expect(afterStart.isError).toBeUndefined();
    expect(afterStart.content[0].text).toContain(CHECKLIST_ITEMS[0]);
  });

  it("keeps review_complete blocked through the tools until every item has evidence", async () => {
    const commands = new Map();
    const tools = new Map();
    const fakePi = {
      registerCommand: (name, definition) => commands.set(name, definition),
      registerTool: (definition) => tools.set(definition.name, definition),
      sendUserMessage() {},
    };

    codeReviewRuntime(fakePi);
    await commands.get("review").handler("working-tree", { ui: { notify() {} } });

    const incomplete = await tools.get("review_complete").execute("tool-1", {
      findings: "No findings.",
      proof: "Inspected diff only.",
      residualRisk: "Tests were not run.",
      recommendation: "No recommendation because review is unproven",
    });
    expect(incomplete.isError).toBe(true);
    expect(incomplete.content[0].text).toContain(CHECKLIST_ITEMS[0]);

    for (const item of CHECKLIST_ITEMS) {
      const result = await tools.get("review_check").execute("tool-check", {
        item,
        status: item.includes("Release") ? "Not applicable" : "Checked",
        evidence: `Evidence for ${item}`,
      });
      expect(result.isError).toBeUndefined();
    }

    const complete = await tools.get("review_complete").execute("tool-2", {
      findings: "No findings.",
      proof: "npm test passed.",
      residualRisk: "No CI status checked.",
      recommendation: "Approve with residual risk",
    });
    expect(complete.isError).toBeUndefined();
    expect(complete.content[0].text).toContain("Review Target: working-tree");

    const afterComplete = await tools.get("review_complete").execute("tool-3", {
      findings: "No findings.",
      proof: "npm test passed.",
      residualRisk: "No CI status checked.",
      recommendation: "Approve with residual risk",
    });
    expect(afterComplete.isError).toBe(true);
    expect(afterComplete.content[0].text).toMatch(/No active ABP review session/i);
  });

  it("ignores malformed persisted review sessions", async () => {
    const events = new Map();
    const tools = new Map();
    const fakePi = {
      registerCommand() {},
      registerTool: (definition) => tools.set(definition.name, definition),
      sendUserMessage() {},
      appendEntry() {},
      on: (eventName, handler) => events.set(eventName, handler),
    };

    codeReviewRuntime(fakePi);
    await events.get("session_start")(
      {},
      {
        sessionManager: {
          getEntries: () => [
            {
              type: "custom",
              customType: "abp-code-review-session",
              data: {
                target: "staged",
                checks: CHECKLIST_ITEMS.map((item) => ({ item, status: "Bypassed", evidence: "bad state" })),
              },
            },
          ],
        },
      }
    );

    const result = await tools.get("review_complete").execute("tool-1", {
      findings: "No findings.",
      proof: "Malformed persisted state.",
      residualRisk: "No active valid session.",
      recommendation: "No recommendation because review is unproven",
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toMatch(/No active ABP review session/i);
  });

  it("restores the latest active review session from persisted Pi entries", async () => {
    const entries = [];
    const firstCommands = new Map();
    const firstTools = new Map();
    const firstPi = {
      registerCommand: (name, definition) => firstCommands.set(name, definition),
      registerTool: (definition) => firstTools.set(definition.name, definition),
      sendUserMessage() {},
      appendEntry: (customType, data) => entries.push({ type: "custom", customType, data }),
      on() {},
    };

    codeReviewRuntime(firstPi);
    await firstCommands.get("review").handler("staged", { ui: { notify() {} } });
    await firstTools.get("review_check").execute("tool-1", {
      item: CHECKLIST_ITEMS[0],
      status: "Checked",
      evidence: "Inspected package.json.",
    });

    const restoredEvents = new Map();
    const restoredTools = new Map();
    const restoredPi = {
      registerCommand() {},
      registerTool: (definition) => restoredTools.set(definition.name, definition),
      sendUserMessage() {},
      appendEntry: (customType, data) => entries.push({ type: "custom", customType, data }),
      on: (eventName, handler) => restoredEvents.set(eventName, handler),
    };

    codeReviewRuntime(restoredPi);
    await restoredEvents.get("session_start")({}, { sessionManager: { getEntries: () => entries } });

    const incomplete = await restoredTools.get("review_complete").execute("tool-2", {
      findings: "No findings.",
      proof: "Inspected persisted session.",
      residualRisk: "Only one item was checked before reload.",
      recommendation: "No recommendation because review is unproven",
    });

    expect(incomplete.isError).toBe(true);
    expect(incomplete.content[0].text).toContain(CHECKLIST_ITEMS[1]);
    expect(incomplete.content[0].text).not.toMatch(/No active ABP review session/i);
  });
});
