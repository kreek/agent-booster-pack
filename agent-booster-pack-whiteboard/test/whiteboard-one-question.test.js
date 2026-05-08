import { describe, expect, it } from "vitest";

import {
  countUserFacingQuestions,
  isWhiteboardingActivation,
  isWhiteboardingDeactivation,
  makeCorrectionPrompt,
  shouldEnforceAssistantMessage,
  WHITEBOARD_STATE_ENTRY,
} from "../extensions/whiteboard-one-question.js";

const messages = (...items) =>
  items.map(([role, content]) => ({
    type: "message",
    message: { role, content },
  }));

const custom = (active) => ({
  type: "custom",
  customType: WHITEBOARD_STATE_ENTRY,
  data: { active },
});

describe("whiteboard one-question guard", () => {
it("detects manual whiteboarding activation commands", () => {
  expect(isWhiteboardingActivation("/abp:whiteboard design the import flow")).toBe(true);
  expect(isWhiteboardingActivation(" /abp:whiteboard")).toBe(true);
  expect(isWhiteboardingActivation("/abp:whiteboard-off")).toBe(false);
});

it("detects explicit skill invocation as automatic activation", () => {
  expect(isWhiteboardingActivation("/skill:whiteboarding design the API")).toBe(true);
  expect(isWhiteboardingActivation("/skill:proof add tests")).toBe(false);
});

it("detects manual whiteboarding deactivation", () => {
  expect(isWhiteboardingDeactivation("/abp:whiteboard-off")).toBe(true);
  expect(isWhiteboardingDeactivation("/abp:whiteboard off")).toBe(false);
});

it("counts user-facing questions but ignores uncertainty notes", () => {
  const text = `Possible shape: keep a queue.

Open uncertainties:
- storage backend selection
- retention window

Should the queue be durable?`;

  expect(countUserFacingQuestions(text)).toBe(1);
});

it("counts multiple question list items as multiple user-facing questions", () => {
  const text = `Questions:
1. Should the queue be durable?
2. What retention window do you want?`;

  expect(countUserFacingQuestions(text)).toBe(2);
});

it("does not enforce outside active whiteboarding mode", () => {
  const history = messages(["assistant", "Should we use Postgres? Should we add Redis?"]);

  expect(shouldEnforceAssistantMessage(history, "Should we use Postgres? Should we add Redis?")).toBe(false);
});

it("enforces multi-question assistant messages while whiteboarding is active", () => {
  const history = [custom(true), ...messages(["assistant", "Goal noted."])];

  expect(shouldEnforceAssistantMessage(history, "Should we use Postgres? Should we add Redis?")).toBe(true);
});

it("allows a single question while whiteboarding is active", () => {
  const history = [custom(true), ...messages(["assistant", "Goal noted."])];

  expect(shouldEnforceAssistantMessage(history, "Should we use Postgres?")).toBe(false);
});

it("latest persisted whiteboarding state wins", () => {
  const history = [custom(true), custom(false)];

  expect(shouldEnforceAssistantMessage(history, "Should we use Postgres? Should we add Redis?")).toBe(false);
});

it("correction prompt asks the agent to regenerate with exactly one decision question", () => {
  const prompt = makeCorrectionPrompt("Should we use Postgres? Should we add Redis?");

  expect(prompt).toMatch(/exactly one decision question/i);
  expect(prompt).toMatch(/notes, not questions/i);
  expect(prompt).toMatch(/Postgres/);
});
});
