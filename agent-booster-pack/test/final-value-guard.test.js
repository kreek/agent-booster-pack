import { describe, expect, it } from "vitest";

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

describe("final value guard", () => {
it("does not request final value reflection for read-only turns", () => {
  const turnMessages = [assistantToolCall("read"), assistantText("The workflow skill already has that language.")];

  expect(shouldRequestFinalValueReflection(turnMessages)).toBe(false);
  expect(finalValuePromptFor(turnMessages)).toBeNull();
});

it("uses a short implementation prompt for one-file source edits", () => {
  const turnMessages = [assistantToolCall("edit", { path: "src/cache.js" }), assistantText("Updated cache handling.")];

  const prompt = finalValuePromptFor(turnMessages);

  expect(shouldRequestFinalValueReflection(turnMessages)).toBe(true);
  expect(prompt).toMatch(/one sentence/i);
  expect(prompt).toMatch(/what changed and why it matters/i);
  expect(prompt).toMatch(/implementation/i);
  expect(prompt).not.toMatch(/1\./);
});

it("uses a short documentation prompt for one-file markdown writes", () => {
  const turnMessages = [
    assistantToolCall("write", { path: "docs/PRD.md" }),
    assistantText("Created the PRD at docs/PRD.md."),
  ];

  const prompt = finalValuePromptFor(turnMessages);

  expect(shouldRequestFinalValueReflection(turnMessages)).toBe(true);
  expect(prompt).toMatch(/one sentence/i);
  expect(prompt).toMatch(/what document changed/i);
  expect(prompt).not.toMatch(/implementation/i);
  expect(prompt).not.toMatch(/1\./);
});

it("uses the full prompt for multi-file implementation changes", () => {
  const turnMessages = [
    assistantToolCall("edit", { path: "src/cache.js" }),
    assistantToolCall("write", { path: "test/cache.test.js" }),
    assistantText("Updated cache handling."),
  ];

  const prompt = finalValuePromptFor(turnMessages);

  expect(shouldRequestFinalValueReflection(turnMessages)).toBe(true);
  expect(prompt).toMatch(/1\. what changed/);
  expect(prompt).toMatch(/2\. why the change or new feature is better/);
  expect(prompt).toMatch(/3\. what it enables going forward/);
});

it("allows final implementation summary that explains value and future direction", () => {
  const turnMessages = [
    assistantToolCall("write", { path: "src/release.js" }),
    assistantText(
      "Changed the release guard to check registry state before version bumps. This is better because it prevents over-broad releases, and it enables future agents to choose package-specific publish plans."
    ),
  ];

  expect(shouldRequestFinalValueReflection(turnMessages)).toBe(false);
});

it("allows final summary that reflects on weak improvement and alternatives", () => {
  const turnMessages = [
    assistantToolCall("edit", { path: "src/guard.js" }),
    assistantText(
      "Changed the guard, but I cannot justify it as an improvement yet. Alternative strategies are to remove the guard, reduce its scope, or ask for a narrower policy before keeping it."
    ),
  ];

  expect(shouldRequestFinalValueReflection(turnMessages)).toBe(false);
});

it("final value prompt keeps the full alternative strategy language for normal changes", () => {
  const prompt = makeFinalValuePrompt("Updated the release skill.", { subject: "implementation", size: "normal" });

  expect(prompt).toMatch(/why.+better/i);
  expect(prompt).toMatch(/enables.+going forward/i);
  expect(prompt).toMatch(/alternative strategies/i);
});
});
