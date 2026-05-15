import { describe, expect, it } from "vitest";

import scaffoldDecisionGate, {
  APPROVE_CHOICE,
  CANCEL_CHOICE,
  REFINE_CHOICE,
  hasScaffoldDecisionGate,
  isScaffoldActivation,
  isScaffoldDeactivation,
  isScaffoldMutation,
  scaffoldGateStatus,
  scaffoldReminder,
} from "../extensions/scaffold-decision-gate.js";

const userText = (text) => ({
  type: "message",
  message: { role: "user", content: [{ type: "text", text }] },
});

const assistantText = (text) => ({
  type: "message",
  message: { role: "assistant", content: [{ type: "text", text }] },
});

const customEntry = (customType, data = {}) => ({ type: "custom", customType, data });

const decisionMenu = `1. Approve — create files / install packages / run generators
2. Refine — change the scaffold plan
3. Cancel — stop scaffolding`;

const validGateText = `Scaffold Decision Gate

Project intent: make a tiny API
Project kind: API
Language/runtime: TypeScript on Node
Deployment assumption: Cloudflare
Framework/template: Hono
Quality baseline: pnpm, vitest, eslint, prettier, tsc, coverage, CI
Files and commands: create package.json and tests
User decision:
${decisionMenu}`;

function makePi({ entries } = {}) {
  const handlers = new Map();
  const commands = new Map();
  const appended = [];
  const sent = [];

  return {
    appended,
    sent,
    registerCommand(name, config) {
      commands.set(name, config);
    },
    on(event, handler) {
      handlers.set(event, handler);
    },
    appendEntry(type, data) {
      appended.push([type, data]);
      if (entries) entries.push({ type: "custom", customType: type, data });
    },
    async sendUserMessage(text) {
      sent.push(text);
    },
    async command(name, args = "", ctx = makeCtx()) {
      return commands.get(name).handler(args, ctx);
    },
    async emit(event, payload, ctx = makeCtx()) {
      return handlers.get(event)?.(payload, ctx);
    },
  };
}

function makeCtx(entries = [], { selectChoice, hasUI = true } = {}) {
  const selectCalls = [];
  return {
    hasUI,
    sessionManager: { getEntries: () => entries },
    ui: {
      notify() {},
      async select(title, choices) {
        selectCalls.push({ title, choices });
        return selectChoice ?? choices[0];
      },
    },
    selectCalls,
  };
}

describe("scaffold decision gate", () => {
  it("activates only from explicit scaffold commands", () => {
    expect(isScaffoldActivation("/abp:scaffold build a web app")).toBe(true);
    expect(isScaffoldActivation("/skill:scaffolding create a CLI")).toBe(true);
    expect(isScaffoldActivation("let's make a simple temperature converter in React")).toBe(false);
    expect(isScaffoldActivation("create a Svelte app for recipes")).toBe(false);
    expect(isScaffoldActivation("update the React button copy")).toBe(false);
  });

  it("deactivates only from the explicit off command", () => {
    expect(isScaffoldDeactivation("/abp:scaffold-off")).toBe(true);
    expect(isScaffoldDeactivation("/abp:scaffold-off now")).toBe(false);
  });

  it("recognizes scaffold mutations", () => {
    expect(isScaffoldMutation("write", { path: "package.json" })).toBe(true);
    expect(isScaffoldMutation("edit", { path: "package.json" })).toBe(true);
    expect(isScaffoldMutation("edit", { path: "agents/.agents/skills/workflow/SKILL.md" })).toBe(false);
    expect(isScaffoldMutation("bash", { command: "pnpm create vite my-app" })).toBe(true);
    expect(isScaffoldMutation("bash", { command: "npm install vitest -D" })).toBe(true);
    expect(isScaffoldMutation("bash", { command: "echo '{}' > package.json" })).toBe(true);
    expect(isScaffoldMutation("bash", { command: "rg TODO 2>/dev/null" })).toBe(false);
  });

  it("validates Scaffold Decision Gate content with hasScaffoldDecisionGate", () => {
    expect(hasScaffoldDecisionGate(validGateText)).toBe(true);

    const missingDeployment = `Scaffold Decision Gate\n\nProject intent: make a tiny API\nProject kind: API\nLanguage/runtime: TypeScript on Node\nFramework/template: Fastify fallback\nQuality baseline: pnpm, vitest, eslint, prettier, tsc, CI\nFiles and commands: create package.json and tests\nUser decision:\n${decisionMenu}`;
    expect(hasScaffoldDecisionGate(missingDeployment)).toBe(false);

    const vagueGate = `Scaffold Decision Gate\n\nProject intent: make a tiny API\nProject kind: API\nLanguage/runtime: TypeScript on Node\nDeployment assumption: container\nFramework/template: Fastify fallback\nQuality baseline: tests and scripts if feasible\nFiles and commands: create package.json and tests where practical\nUser decision:\n${decisionMenu}`;
    expect(hasScaffoldDecisionGate(vagueGate)).toBe(false);

    const weakGate = `Scaffold Decision Gate\n\nProject intent: make a tiny API\nProject kind: API\nLanguage/runtime: TypeScript on Node\nDeployment assumption: container\nFramework/template: Fastify fallback\nQuality baseline: pnpm, vitest, eslint, prettier, tsc\nFiles and commands: create package.json and tests\nUser decision:\n${decisionMenu}`;
    expect(hasScaffoldDecisionGate(weakGate)).toBe(false);

    const blockedGate = `Scaffold Decision Gate\n\nProject intent: make a tiny API\nProject kind: API\nLanguage/runtime: TypeScript on Node\nDeployment assumption: container\nFramework/template: Fastify fallback\nQuality baseline: test and typecheck; blocker: network unavailable, so lockfile install is deferred\nFiles and commands: create package.json and tests; blocked by network for install\nUser decision:\n${decisionMenu}`;
    expect(hasScaffoldDecisionGate(blockedGate)).toBe(true);
  });

  it("scaffoldGateStatus returns null when inactive or not a mutation", () => {
    expect(scaffoldGateStatus("write", { path: "package.json" }, [])).toBeNull();
    expect(scaffoldGateStatus("bash", { command: "rg TODO" }, [
      customEntry("abp-scaffold-state", { active: true }),
    ])).toBeNull();
  });

  it("scaffoldGateStatus reports no-gate when active without a valid gate message", () => {
    const entries = [customEntry("abp-scaffold-state", { active: true })];
    expect(scaffoldGateStatus("write", { path: "package.json" }, entries)).toEqual({ kind: "no-gate" });
  });

  it("scaffoldGateStatus reports needs-decision when a valid gate exists and no matching approval is recorded", () => {
    const entries = [
      customEntry("abp-scaffold-state", { active: true }),
      assistantText(validGateText),
    ];
    const status = scaffoldGateStatus("write", { path: "package.json" }, entries);
    expect(status?.kind).toBe("needs-decision");
    expect(typeof status?.gateHash).toBe("string");
  });

  it("scaffoldGateStatus reports approved when a matching-hash approval is recorded", () => {
    const entries = [
      customEntry("abp-scaffold-state", { active: true }),
      assistantText(validGateText),
    ];
    const { gateHash } = scaffoldGateStatus("write", { path: "package.json" }, entries);
    entries.push(customEntry("abp-scaffold-decision", { choice: "approve", gateHash }));
    expect(scaffoldGateStatus("write", { path: "package.json" }, entries)).toEqual({ kind: "approved", gateHash });
  });

  it("scaffoldGateStatus invalidates a stale approval when a new gate is written", () => {
    const oldGateText = validGateText.replace("tiny API", "old tiny API");
    const entries = [
      customEntry("abp-scaffold-state", { active: true }),
      assistantText(oldGateText),
    ];
    const { gateHash: oldHash } = scaffoldGateStatus("write", { path: "package.json" }, entries);
    entries.push(customEntry("abp-scaffold-decision", { choice: "approve", gateHash: oldHash }));
    entries.push(assistantText(validGateText));

    const status = scaffoldGateStatus("write", { path: "package.json" }, entries);
    expect(status?.kind).toBe("needs-decision");
    expect(status?.gateHash).not.toBe(oldHash);
  });

  it("scaffoldGateStatus ignores approvals from earlier activations", () => {
    const entries = [
      customEntry("abp-scaffold-state", { active: true }),
      assistantText(validGateText),
    ];
    const { gateHash } = scaffoldGateStatus("write", { path: "package.json" }, entries);
    entries.push(customEntry("abp-scaffold-decision", { choice: "approve", gateHash }));
    entries.push(customEntry("abp-scaffold-state", { active: true }));
    entries.push(userText("now scaffold another app"));

    expect(scaffoldGateStatus("write", { path: "package.json" }, entries)).toEqual({ kind: "no-gate" });
  });

  it("tool_call hook blocks without prompting when no valid gate exists yet", async () => {
    const entries = [customEntry("abp-scaffold-state", { active: true })];
    const pi = makePi({ entries });
    scaffoldDecisionGate(pi);
    const ctx = makeCtx(entries);

    const verdict = await pi.emit("tool_call", { toolName: "write", input: { path: "package.json" } }, ctx);

    expect(verdict).toMatchObject({ block: true });
    expect(verdict.reason).toMatch(/Scaffold Decision Gate/);
    expect(ctx.selectCalls).toHaveLength(0);
  });

  it("tool_call hook prompts the UI picker and allows when user picks Approve", async () => {
    const entries = [
      customEntry("abp-scaffold-state", { active: true }),
      assistantText(validGateText),
    ];
    const pi = makePi({ entries });
    scaffoldDecisionGate(pi);
    const ctx = makeCtx(entries, { selectChoice: APPROVE_CHOICE });

    const verdict = await pi.emit("tool_call", { toolName: "write", input: { path: "package.json" } }, ctx);

    expect(verdict).toBeUndefined();
    expect(ctx.selectCalls).toHaveLength(1);
    expect(ctx.selectCalls[0].choices).toEqual([APPROVE_CHOICE, REFINE_CHOICE, CANCEL_CHOICE]);
    const decision = pi.appended.find(([type]) => type === "abp-scaffold-decision");
    expect(decision?.[1]).toMatchObject({ choice: "approve" });
  });

  it("tool_call hook fails closed without UI instead of relying on dialog defaults", async () => {
    const entries = [
      customEntry("abp-scaffold-state", { active: true }),
      assistantText(validGateText),
    ];
    const pi = makePi({ entries });
    scaffoldDecisionGate(pi);
    const ctx = makeCtx(entries, { hasUI: false });

    const verdict = await pi.emit("tool_call", { toolName: "write", input: { path: "package.json" } }, ctx);

    expect(verdict).toMatchObject({ block: true });
    expect(verdict.reason).toMatch(/requires an interactive UI/i);
    expect(ctx.selectCalls).toHaveLength(0);
    expect(pi.appended.find(([type]) => type === "abp-scaffold-decision")).toBeUndefined();
  });

  it("tool_call hook blocks with Refine reason when user picks Refine", async () => {
    const entries = [
      customEntry("abp-scaffold-state", { active: true }),
      assistantText(validGateText),
    ];
    const pi = makePi({ entries });
    scaffoldDecisionGate(pi);
    const ctx = makeCtx(entries, { selectChoice: REFINE_CHOICE });

    const verdict = await pi.emit("tool_call", { toolName: "write", input: { path: "package.json" } }, ctx);

    expect(verdict).toMatchObject({ block: true });
    expect(verdict.reason).toMatch(/Refine/);
  });

  it("tool_call hook blocks with Cancel reason when user picks Cancel", async () => {
    const entries = [
      customEntry("abp-scaffold-state", { active: true }),
      assistantText(validGateText),
    ];
    const pi = makePi({ entries });
    scaffoldDecisionGate(pi);
    const ctx = makeCtx(entries, { selectChoice: CANCEL_CHOICE });

    const verdict = await pi.emit("tool_call", { toolName: "write", input: { path: "package.json" } }, ctx);

    expect(verdict).toMatchObject({ block: true });
    expect(verdict.reason).toMatch(/cancel/i);
  });

  it("tool_call hook does not re-prompt when an approval matches the current gate hash", async () => {
    const entries = [
      customEntry("abp-scaffold-state", { active: true }),
      assistantText(validGateText),
    ];
    const pi = makePi({ entries });
    scaffoldDecisionGate(pi);
    const ctx = makeCtx(entries, { selectChoice: APPROVE_CHOICE });

    await pi.emit("tool_call", { toolName: "write", input: { path: "package.json" } }, ctx);
    const callsAfterFirst = ctx.selectCalls.length;

    const verdict = await pi.emit("tool_call", { toolName: "write", input: { path: "vite.config.ts" } }, ctx);

    expect(verdict).toBeUndefined();
    expect(ctx.selectCalls.length).toBe(callsAfterFirst);
  });

  it("tool_call hook re-prompts when a new gate message appears after an approval", async () => {
    const entries = [
      customEntry("abp-scaffold-state", { active: true }),
      assistantText(validGateText),
    ];
    const pi = makePi({ entries });
    scaffoldDecisionGate(pi);
    const ctx = makeCtx(entries, { selectChoice: APPROVE_CHOICE });

    await pi.emit("tool_call", { toolName: "write", input: { path: "package.json" } }, ctx);
    entries.push(assistantText(validGateText.replace("tiny API", "different API")));

    await pi.emit("tool_call", { toolName: "write", input: { path: "package.json" } }, ctx);

    expect(ctx.selectCalls.length).toBe(2);
  });

  it("injects an active reminder into the agent prompt", async () => {
    const entries = [customEntry("abp-scaffold-state", { active: true })];
    const pi = makePi({ entries });
    scaffoldDecisionGate(pi);

    const result = await pi.emit("before_agent_start", { systemPrompt: "base" }, makeCtx(entries));

    expect(result.systemPrompt).toBe(`base${scaffoldReminder()}`);
  });

  it("auto-enables on /skill:scaffolding input", async () => {
    const pi = makePi();
    scaffoldDecisionGate(pi);

    const result = await pi.emit("input", { text: "/skill:scaffolding create a worker" });

    expect(result).toEqual({ action: "continue" });
    expect(pi.appended.at(-1)).toEqual(["abp-scaffold-state", { active: true, source: "input" }]);
  });
});
