import test from "node:test";
import assert from "node:assert/strict";

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

test("does not trigger on read-only tool calls", () => {
  const entries = [userText("look around"), assistantToolCall("read", { path: "src/x.js" })];
  assert.equal(shouldBlockPreWork("read", { path: "src/x.js" }, entries), null);
});

test("blocks first edit when latest assistant text has no plan or why", () => {
  const entries = [userText("update cache"), assistantText("Sure, here we go.")];
  const verdict = shouldBlockPreWork("edit", { path: "src/cache.js" }, entries);

  assert.ok(verdict, "expected the gate to block the first edit");
  assert.deepEqual(verdict.missing, ["plan", "why"]);

  const reason = makePreWorkBlockReason(verdict.missing, verdict.kind);
  assert.match(reason, /Pre-Work Reflection Gate/);
  assert.match(reason, /plan/);
  assert.match(reason, /why/);
});

test("partial explanation passes for single-file edit (small tier)", () => {
  const entries = [
    userText("speed up cache lookups"),
    assistantText("I'll update src/cache.js to use a Map because it's simpler than the current Set+Array combo."),
  ];

  assert.equal(shouldBlockPreWork("edit", { path: "src/cache.js" }, entries), null);
});

test("full explanation passes for mutating bash (normal tier)", () => {
  const fullText =
    "I'll rename the helper across src/ because the existing name is misleading. " +
    "Considered keeping the old name and aliasing it, but that leaves two ways to refer to the same function. Rejected.";
  const entries = [userText("rename helper"), assistantText(fullText)];

  assert.equal(shouldBlockPreWork("bash", { command: "sed -i 's/oldHelper/newHelper/g' src/*.js" }, entries), null);
});

test("small/normal split is observable on the same text", () => {
  const partialText = "I'll update src/cache.js to use a Map because it's simpler than the current implementation.";
  const entries = [userText("speed up cache"), assistantText(partialText)];

  assert.equal(shouldBlockPreWork("edit", { path: "src/cache.js" }, entries), null);

  const verdict = shouldBlockPreWork("bash", { command: "sed -i 's/Set/Map/g' src/cache.js" }, entries);
  assert.ok(verdict, "mutating bash should require alternatives even when plan and why are present");
  assert.deepEqual(verdict.missing, ["alternatives"]);
});

test("second edit in same turn passes after the explained-this-turn marker is present", () => {
  const entries = [
    userText("update cache"),
    assistantText("I'll update src/cache.js to use a Map because it's simpler."),
    assistantToolCall("edit", { path: "src/cache.js" }),
    customEntry(PRE_WORK_STATE_ENTRY, { explainedAt: 1 }),
    assistantText("Now applying the second part."),
    assistantToolCall("edit", { path: "src/cache-utils.js" }),
  ];

  assert.equal(hasAlreadyExplainedThisTurn(entries), true);
  assert.equal(shouldBlockPreWork("edit", { path: "src/cache-utils.js" }, entries), null);
});

test("state from prior turn is stale once a new user message arrives", () => {
  const entries = [
    userText("update cache"),
    assistantText("I'll update src/cache.js to use a Map because it's simpler."),
    customEntry(PRE_WORK_STATE_ENTRY, { explainedAt: 1 }),
    userText("now also tweak the formatter"),
    assistantText("Sure."),
  ];

  assert.equal(hasAlreadyExplainedThisTurn(entries), false);
  const verdict = shouldBlockPreWork("edit", { path: "src/formatter.js" }, entries);
  assert.ok(verdict, "expected the gate to fire again on the second turn");
});

test("registers before_agent_start handler that appends the pre-work reminder", async () => {
  const handlers = new Map();
  const fakePi = {
    on: (eventName, handler) => handlers.set(eventName, handler),
    appendEntry: () => {},
  };

  preWorkGuard(fakePi);

  const handler = handlers.get("before_agent_start");
  assert.ok(handler, "expected a before_agent_start handler to be registered");

  const result = await handler({ systemPrompt: "base." });
  assert.match(result.systemPrompt, /^base\./);
  assert.match(result.systemPrompt, /Pre-Work Reflection Gate/);
  assert.match(result.systemPrompt, /plan/i);
  assert.match(result.systemPrompt, /alternatives/i);
});

test("past-tense reflection does not satisfy the future-tense plan requirement", () => {
  const entries = [
    userText("clean up the cache"),
    assistantText("I changed the cache because it was slow. The result is simpler than before."),
  ];

  const verdict = shouldBlockPreWork("edit", { path: "src/cache.js" }, entries);
  assert.ok(verdict, "past-tense summary should not satisfy a pre-work plan");
  assert.ok(verdict.missing.includes("plan"));
});

test("preWorkChangeKind classifies edit as small implementation by default", () => {
  assert.deepEqual(preWorkChangeKind("edit", { path: "src/x.js" }), { subject: "implementation", size: "small" });
  assert.deepEqual(preWorkChangeKind("write", { path: "docs/PRD.md" }), { subject: "documentation", size: "small" });
  assert.deepEqual(preWorkChangeKind("bash", { command: "sed -i 's/a/b/' x" }), { subject: "implementation", size: "normal" });
  assert.equal(preWorkChangeKind("read", {}), null);
});

test("hasPreWorkExplanation matches plan + why for small, plan + why + alternatives for normal", () => {
  const partial = "I'll add a guard because it's safer.";
  const full = partial + " Considered inlining it, but rejected that.";

  assert.equal(hasPreWorkExplanation(partial, "small"), true);
  assert.equal(hasPreWorkExplanation(partial, "normal"), false);
  assert.equal(hasPreWorkExplanation(full, "normal"), true);

  assert.deepEqual(missingElements("Sure, here we go.", "small"), ["plan", "why"]);
  assert.deepEqual(missingElements(partial, "normal"), ["alternatives"]);
});

test("preWorkReminder mentions the gate, plan, and alternatives", () => {
  const reminder = preWorkReminder();
  assert.match(reminder, /Pre-Work Reflection Gate/);
  assert.match(reminder, /plan/i);
  assert.match(reminder, /alternatives/i);
});
