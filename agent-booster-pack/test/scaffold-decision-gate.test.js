import { describe, expect, it } from "vitest";

import scaffoldDecisionGate, {
  hasScaffoldDecisionGate,
  isScaffoldActivation,
  isScaffoldApproved,
  isScaffoldDeactivation,
  scaffoldReminder,
  shouldBlockScaffoldMutation,
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

function makePi() {
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

function makeCtx(entries = []) {
  return {
    sessionManager: { getEntries: () => entries },
    ui: { notify() {} },
  };
}

describe("scaffold decision gate", () => {
  it("activates from the manual command, skill invocation, and explicit fresh app requests", () => {
    expect(isScaffoldActivation("/abp:scaffold build a web app")).toBe(true);
    expect(isScaffoldActivation("/skill:scaffolding create a CLI")).toBe(true);
    expect(isScaffoldActivation("let's make a simple temperature converter in React")).toBe(true);
    expect(isScaffoldActivation("create a Svelte app for recipes")).toBe(true);
    expect(isScaffoldActivation("update the React button copy")).toBe(false);
  });

  it("deactivates only from the explicit off command", () => {
    expect(isScaffoldDeactivation("/abp:scaffold-off")).toBe(true);
    expect(isScaffoldDeactivation("/abp:scaffold-off now")).toBe(false);
  });

  it("requires a Scaffold Decision Gate packet followed by a menu approval", () => {
    const gate = assistantText(`Scaffold Decision Gate\n\nProject intent: make a tiny API\nProject kind: API\nLanguage/runtime: TypeScript on Node\nDeployment assumption: container\nFramework/template: Fastify fallback\nQuality baseline: pnpm, vitest, eslint, prettier, tsc, coverage, CI\nFiles and commands: create package.json and tests\nUser decision:\n${decisionMenu}`);

    expect(isScaffoldApproved([gate])).toBe(false);
    expect(isScaffoldApproved([gate, userText("1")])).toBe(true);
    expect(isScaffoldApproved([gate, userText("approve")])).toBe(true);
    expect(isScaffoldApproved([gate, userText("approved")])).toBe(true);
    expect(isScaffoldApproved([gate, userText("go ahead")])).toBe(true);
    expect(isScaffoldApproved([gate, userText("2")])).toBe(false);
    expect(isScaffoldApproved([gate, userText("refine the framework")])).toBe(false);
    expect(isScaffoldApproved([gate, userText("change the framework")])).toBe(false);
    expect(isScaffoldApproved([gate, userText("3")])).toBe(false);
    expect(isScaffoldApproved([gate, userText("cancel")])).toBe(false);
  });

  it("rejects incomplete Scaffold Decision Gate packets", () => {
    const missingDeployment = `Scaffold Decision Gate\n\nProject intent: make a tiny API\nProject kind: API\nLanguage/runtime: TypeScript on Node\nFramework/template: Fastify fallback\nQuality baseline: pnpm, vitest, eslint, prettier, tsc, CI\nFiles and commands: create package.json and tests\nUser decision:\n${decisionMenu}`;

    expect(hasScaffoldDecisionGate(missingDeployment)).toBe(false);
    expect(isScaffoldApproved([assistantText(missingDeployment), userText("approved")])).toBe(false);
  });

  it("rejects vague Scaffold Decision Gate baselines unless a blocker is named", () => {
    const vagueGate = `Scaffold Decision Gate\n\nProject intent: make a tiny API\nProject kind: API\nLanguage/runtime: TypeScript on Node\nDeployment assumption: container\nFramework/template: Fastify fallback\nQuality baseline: tests and scripts if feasible\nFiles and commands: create package.json and tests where practical\nUser decision:\n${decisionMenu}`;

    expect(hasScaffoldDecisionGate(vagueGate)).toBe(false);
    expect(isScaffoldApproved([assistantText(vagueGate), userText("approved")])).toBe(false);
  });

  it("rejects gates that omit CI or coverage unless the omission is explicit", () => {
    const weakGate = `Scaffold Decision Gate\n\nProject intent: make a tiny API\nProject kind: API\nLanguage/runtime: TypeScript on Node\nDeployment assumption: container\nFramework/template: Fastify fallback\nQuality baseline: pnpm, vitest, eslint, prettier, tsc\nFiles and commands: create package.json and tests\nUser decision:\n${decisionMenu}`;

    expect(hasScaffoldDecisionGate(weakGate)).toBe(false);
    expect(isScaffoldApproved([assistantText(weakGate), userText("approved")])).toBe(false);
  });

  it("accepts a limited Scaffold Decision Gate baseline when it names the blocker", () => {
    const blockedGate = `Scaffold Decision Gate\n\nProject intent: make a tiny API\nProject kind: API\nLanguage/runtime: TypeScript on Node\nDeployment assumption: container\nFramework/template: Fastify fallback\nQuality baseline: test and typecheck; blocker: network unavailable, so lockfile install is deferred\nFiles and commands: create package.json and tests; blocked by network for install\nUser decision:\n${decisionMenu}`;

    expect(hasScaffoldDecisionGate(blockedGate)).toBe(true);
    expect(isScaffoldApproved([assistantText(blockedGate), userText("approved")])).toBe(true);
  });

  it("blocks scaffold mutation after approval of an incomplete gate", () => {
    const entries = [
      customEntry("abp-scaffold-state", { active: true }),
      assistantText(`Scaffold Decision Gate\nProject intent: app\nProject kind: web app\nLanguage/runtime: TypeScript\nFramework/template: Svelte\nQuality baseline: tests if feasible\nFiles and commands: create scaffold\nUser decision:\n${decisionMenu}`),
      userText("approve"),
    ];

    expect(shouldBlockScaffoldMutation("write", { path: "package.json" }, entries)).toBeTruthy();
  });

  it("blocks scaffold file writes while active and unapproved", () => {
    const entries = [customEntry("abp-scaffold-state", { active: true })];

    const verdict = shouldBlockScaffoldMutation("write", { path: "package.json" }, entries);

    expect(verdict).toBeTruthy();
    expect(verdict.reason).toMatch(/Scaffold Decision Gate/);
  });

  it("blocks package installs and generator commands while active and unapproved", () => {
    const entries = [customEntry("abp-scaffold-state", { active: true })];

    expect(shouldBlockScaffoldMutation("bash", { command: "pnpm create vite my-app" }, entries)).toBeTruthy();
    expect(shouldBlockScaffoldMutation("bash", { command: "npm install vitest -D" }, entries)).toBeTruthy();
    expect(shouldBlockScaffoldMutation("bash", { command: "echo '{}' > package.json" }, entries)).toBeTruthy();
    expect(shouldBlockScaffoldMutation("bash", { command: "rg TODO 2>/dev/null" }, entries)).toBeNull();
  });

  it("allows scaffold mutation after the user approves the gate packet", () => {
    const entries = [
      customEntry("abp-scaffold-state", { active: true }),
      assistantText(`Scaffold Decision Gate\nProject intent: app\nProject kind: web app\nLanguage/runtime: TypeScript\nDeployment assumption: Cloudflare\nFramework/template: Hono\nQuality baseline: pnpm, vitest, eslint, prettier, tsc, coverage, CI\nFiles and commands: create scaffold\nUser decision:\n${decisionMenu}`),
      userText("approve"),
    ];

    expect(shouldBlockScaffoldMutation("write", { path: "package.json" }, entries)).toBeNull();
  });

  it("does not reuse approval from an earlier scaffold activation", () => {
    const entries = [
      customEntry("abp-scaffold-state", { active: true }),
      assistantText(`Scaffold Decision Gate\nProject intent: old app\nProject kind: web app\nLanguage/runtime: TypeScript\nDeployment assumption: Cloudflare\nFramework/template: Hono\nQuality baseline: pnpm, vitest, eslint, prettier, tsc, coverage, CI\nFiles and commands: create scaffold\nUser decision:\n${decisionMenu}`),
      userText("approve"),
      customEntry("abp-scaffold-state", { active: true }),
      userText("now scaffold another app"),
    ];

    expect(shouldBlockScaffoldMutation("write", { path: "package.json" }, entries)).toBeTruthy();
  });

  it("injects an active reminder into the agent prompt", async () => {
    const pi = makePi();
    scaffoldDecisionGate(pi);
    const entries = [customEntry("abp-scaffold-state", { active: true })];

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
