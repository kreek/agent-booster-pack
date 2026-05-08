import test from "node:test";
import assert from "node:assert/strict";

import {
  finalValuePromptFor,
  makeFinalValuePrompt,
  shouldRequestFinalValueReflection,
} from "../extensions/final-value-guard.js";

const assistantToolCall = (name, args = {}) => ({
  role: "assistant",
  content: [{ type: "toolCall", name, arguments: args }],
});

const assistantText = (text) => ({
  role: "assistant",
  content: [{ type: "text", text }],
});

test("does not request final value reflection for read-only turns", () => {
  const turnMessages = [assistantToolCall("read"), assistantText("The workflow skill already has that language.")];

  assert.equal(shouldRequestFinalValueReflection(turnMessages), false);
  assert.equal(finalValuePromptFor(turnMessages), null);
});

test("uses a short implementation prompt for one-file source edits", () => {
  const turnMessages = [assistantToolCall("edit", { path: "src/cache.js" }), assistantText("Updated cache handling.")];

  const prompt = finalValuePromptFor(turnMessages);

  assert.equal(shouldRequestFinalValueReflection(turnMessages), true);
  assert.match(prompt, /one sentence/i);
  assert.match(prompt, /what changed and why it matters/i);
  assert.match(prompt, /implementation/i);
  assert.doesNotMatch(prompt, /1\./);
});

test("uses a short documentation prompt for one-file markdown writes", () => {
  const turnMessages = [
    assistantToolCall("write", { path: "docs/PRD.md" }),
    assistantText("Created the PRD at docs/PRD.md."),
  ];

  const prompt = finalValuePromptFor(turnMessages);

  assert.equal(shouldRequestFinalValueReflection(turnMessages), true);
  assert.match(prompt, /one sentence/i);
  assert.match(prompt, /what document changed/i);
  assert.doesNotMatch(prompt, /implementation/i);
  assert.doesNotMatch(prompt, /1\./);
});

test("uses the full prompt for multi-file implementation changes", () => {
  const turnMessages = [
    assistantToolCall("edit", { path: "src/cache.js" }),
    assistantToolCall("write", { path: "test/cache.test.js" }),
    assistantText("Updated cache handling."),
  ];

  const prompt = finalValuePromptFor(turnMessages);

  assert.equal(shouldRequestFinalValueReflection(turnMessages), true);
  assert.match(prompt, /1\. what changed/);
  assert.match(prompt, /2\. why the change or new feature is better/);
  assert.match(prompt, /3\. what it enables going forward/);
});

test("allows final implementation summary that explains value and future direction", () => {
  const turnMessages = [
    assistantToolCall("write", { path: "src/release.js" }),
    assistantText(
      "Changed the release guard to check registry state before version bumps. This is better because it prevents over-broad releases, and it enables future agents to choose package-specific publish plans."
    ),
  ];

  assert.equal(shouldRequestFinalValueReflection(turnMessages), false);
});

test("allows final summary that reflects on weak improvement and alternatives", () => {
  const turnMessages = [
    assistantToolCall("edit", { path: "src/guard.js" }),
    assistantText(
      "Changed the guard, but I cannot justify it as an improvement yet. Alternative strategies are to remove the guard, reduce its scope, or ask for a narrower policy before keeping it."
    ),
  ];

  assert.equal(shouldRequestFinalValueReflection(turnMessages), false);
});

test("final value prompt keeps the full alternative strategy language for normal changes", () => {
  const prompt = makeFinalValuePrompt("Updated the release skill.", { subject: "implementation", size: "normal" });

  assert.match(prompt, /why.+better/i);
  assert.match(prompt, /enables.+going forward/i);
  assert.match(prompt, /alternative strategies/i);
});
