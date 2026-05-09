import { describe, expect, it } from "vitest";

import {
  hasAlreadyExplainedThisTurn,
  hasPreWorkExplanation,
  makePreWorkBlockReason,
  missingElements,
  preWorkChangeKind,
  preWorkReminder,
  shouldBlockPreWork,
} from "../extensions/pre-work-guard.js";

import preWorkGuard from "../extensions/pre-work-guard.js";

const PRE_WORK_STATE_ENTRY = "abp-pre-work-explained";

const userText = (text) => ({
  type: "message",
  message: { role: "user", content: [{ type: "text", text }] },
});

const assistantText = (text) => ({
  type: "message",
  message: { role: "assistant", content: [{ type: "text", text }] },
});

const assistantToolCall = (name, args = {}) => ({
  type: "message",
  message: { role: "assistant", content: [{ type: "toolCall", name, arguments: args }] },
});

const customEntry = (customType, data = {}) => ({ type: "custom", customType, data });

describe("pre-work guard", () => {
it("does not trigger on read-only tool calls", () => {
  const entries = [userText("look around"), assistantToolCall("read", { path: "src/x.js" })];
  expect(shouldBlockPreWork("read", { path: "src/x.js" }, entries)).toBeNull();
});

it("does not treat stderr redirection to /dev/null as mutating bash", () => {
  const entries = [userText("look around"), assistantText("I'll inspect the code because I need the current shape first.")];

  expect(shouldBlockPreWork("bash", { command: "rg TODO 2>/dev/null" }, entries)).toBeNull();
  expect(preWorkChangeKind("bash", { command: "rg TODO 2>/dev/null" })).toBeNull();
});

it("blocks first edit when latest assistant text has no plan or why", () => {
  const entries = [userText("update cache"), assistantText("Sure, here we go.")];
  const verdict = shouldBlockPreWork("edit", { path: "src/cache.js" }, entries);

  expect(verdict, "expected the gate to block the first edit").toBeTruthy();
  expect(verdict.missing).toEqual(["plan", "why"]);

  const reason = makePreWorkBlockReason(verdict.missing, verdict.kind);
  expect(reason).toMatch(/Pre-Work Reflection Gate/);
  expect(reason).toMatch(/plan/);
  expect(reason).toMatch(/why/);
});

it("labeled explanation passes for single-file edit (small tier)", () => {
  const entries = [
    userText("speed up cache lookups"),
    assistantText("Plan: update src/cache.js to use a Map.\nWhy: it simplifies the current Set+Array combo."),
  ];

  expect(shouldBlockPreWork("edit", { path: "src/cache.js" }, entries)).toBeNull();
});

it("labeled explanation passes for mutating bash (normal tier)", () => {
  const fullText = [
    "Plan: rename the helper across src/.",
    "Why: the existing name is misleading.",
    "Alternatives: considered keeping the old name and aliasing it, but that leaves two names for one function.",
  ].join("\n");
  const entries = [userText("rename helper"), assistantText(fullText)];

  expect(shouldBlockPreWork("bash", { command: "sed -i 's/oldHelper/newHelper/g' src/*.js" }, entries)).toBeNull();
});

it("small/normal split is observable on the same labeled text", () => {
  const partialText = "Plan: update src/cache.js to use a Map.\nWhy: it simplifies the current implementation.";
  const entries = [userText("speed up cache"), assistantText(partialText)];

  expect(shouldBlockPreWork("edit", { path: "src/cache.js" }, entries)).toBeNull();

  const verdict = shouldBlockPreWork("bash", { command: "sed -i 's/Set/Map/g' src/cache.js" }, entries);
  expect(verdict, "mutating bash should require alternatives even when plan and why are present").toBeTruthy();
  expect(verdict.missing).toEqual(["alternatives"]);
});

it("empty labeled slots do not satisfy the pre-work explanation", () => {
  const entries = [userText("update cache"), assistantText("Plan:\nWhy: simplify cache behavior")];

  const verdict = shouldBlockPreWork("edit", { path: "src/cache.js" }, entries);

  expect(verdict, "expected empty Plan: label to block").toBeTruthy();
  expect(verdict.missing).toEqual(["plan"]);
});

it("second edit in same turn passes after the explained-this-turn marker is present", () => {
  const entries = [
    userText("update cache"),
    assistantText("Plan: update src/cache.js to use a Map.\nWhy: it is simpler."),
    assistantToolCall("edit", { path: "src/cache.js" }),
    customEntry(PRE_WORK_STATE_ENTRY, { explainedAt: 1 }),
    assistantText("Now applying the second part."),
    assistantToolCall("edit", { path: "src/cache-utils.js" }),
  ];

  expect(hasAlreadyExplainedThisTurn(entries)).toBe(true);
  expect(shouldBlockPreWork("edit", { path: "src/cache-utils.js" }, entries)).toBeNull();
});

it("state from prior turn is stale once a new user message arrives", () => {
  const entries = [
    userText("update cache"),
    assistantText("Plan: update src/cache.js to use a Map.\nWhy: it is simpler."),
    customEntry(PRE_WORK_STATE_ENTRY, { explainedAt: 1 }),
    userText("now also tweak the formatter"),
    assistantText("Sure."),
  ];

  expect(hasAlreadyExplainedThisTurn(entries)).toBe(false);
  const verdict = shouldBlockPreWork("edit", { path: "src/formatter.js" }, entries);
  expect(verdict, "expected the gate to fire again on the second turn").toBeTruthy();
});

it("registers before_agent_start handler that appends the pre-work reminder", async () => {
  const handlers = new Map();
  const fakePi = {
    on: (eventName, handler) => handlers.set(eventName, handler),
    appendEntry: () => {},
  };

  preWorkGuard(fakePi);

  const handler = handlers.get("before_agent_start");
  expect(handler, "expected a before_agent_start handler to be registered").toBeTruthy();

  const result = await handler({ systemPrompt: "base." });
  expect(result.systemPrompt).toMatch(/^base\./);
  expect(result.systemPrompt).toMatch(/Pre-Work Reflection Gate/);
  expect(result.systemPrompt).toMatch(/plan/i);
  expect(result.systemPrompt).toMatch(/alternatives/i);
});

it("past-tense reflection does not satisfy the future-tense plan requirement", () => {
  const entries = [
    userText("clean up the cache"),
    assistantText("I changed the cache because it was slow. The result is simpler than before."),
  ];

  const verdict = shouldBlockPreWork("edit", { path: "src/cache.js" }, entries);
  expect(verdict, "past-tense summary should not satisfy a pre-work plan").toBeTruthy();
  expect(verdict.missing).toContain("plan");
});

it("preWorkChangeKind classifies edit as small implementation by default", () => {
  expect(preWorkChangeKind("edit", { path: "src/x.js" })).toEqual({ subject: "implementation", size: "small" });
  expect(preWorkChangeKind("write", { path: "docs/PRD.md" })).toEqual({ subject: "documentation", size: "small" });
  expect(preWorkChangeKind("bash", { command: "sed -i 's/a/b/' x" })).toEqual({ subject: "implementation", size: "normal" });
  expect(preWorkChangeKind("read", {})).toBeNull();
});

it("hasPreWorkExplanation matches labeled plan + why for small, plus alternatives for normal", () => {
  const partial = "Plan: add a guard.\nWhy: it is safer.";
  const full = partial + "\nAlternatives: considered inlining it, but rejected that.";

  expect(hasPreWorkExplanation(partial, "small")).toBe(true);
  expect(hasPreWorkExplanation(partial, "normal")).toBe(false);
  expect(hasPreWorkExplanation(full, "normal")).toBe(true);

  expect(missingElements("Sure, here we go.", "small")).toEqual(["plan", "why"]);
  expect(missingElements(partial, "normal")).toEqual(["alternatives"]);
});

it("preWorkReminder mentions the gate, plan, and alternatives", () => {
  const reminder = preWorkReminder();
  expect(reminder).toMatch(/Pre-Work Reflection Gate/);
  expect(reminder).toMatch(/plan/i);
  expect(reminder).toMatch(/alternatives/i);
});
});
