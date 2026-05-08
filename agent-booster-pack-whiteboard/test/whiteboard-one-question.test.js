import test from "node:test";
import assert from "node:assert/strict";

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

test("detects manual whiteboarding activation commands", () => {
  assert.equal(isWhiteboardingActivation("/abp:whiteboard design the import flow"), true);
  assert.equal(isWhiteboardingActivation(" /abp:whiteboard"), true);
  assert.equal(isWhiteboardingActivation("/abp:whiteboard-off"), false);
});

test("detects explicit skill invocation as automatic activation", () => {
  assert.equal(isWhiteboardingActivation("/skill:whiteboarding design the API"), true);
  assert.equal(isWhiteboardingActivation("/skill:proof add tests"), false);
});

test("detects manual whiteboarding deactivation", () => {
  assert.equal(isWhiteboardingDeactivation("/abp:whiteboard-off"), true);
  assert.equal(isWhiteboardingDeactivation("/abp:whiteboard off"), false);
});

test("counts user-facing questions but ignores uncertainty notes", () => {
  const text = `Possible shape: keep a queue.

Open uncertainties:
- storage backend selection
- retention window

Should the queue be durable?`;

  assert.equal(countUserFacingQuestions(text), 1);
});

test("counts multiple question list items as multiple user-facing questions", () => {
  const text = `Questions:
1. Should the queue be durable?
2. What retention window do you want?`;

  assert.equal(countUserFacingQuestions(text), 2);
});

test("does not enforce outside active whiteboarding mode", () => {
  const history = messages(["assistant", "Should we use Postgres? Should we add Redis?"]);

  assert.equal(shouldEnforceAssistantMessage(history, "Should we use Postgres? Should we add Redis?"), false);
});

test("enforces multi-question assistant messages while whiteboarding is active", () => {
  const history = [custom(true), ...messages(["assistant", "Goal noted."])];

  assert.equal(shouldEnforceAssistantMessage(history, "Should we use Postgres? Should we add Redis?"), true);
});

test("allows a single question while whiteboarding is active", () => {
  const history = [custom(true), ...messages(["assistant", "Goal noted."])];

  assert.equal(shouldEnforceAssistantMessage(history, "Should we use Postgres?"), false);
});

test("latest persisted whiteboarding state wins", () => {
  const history = [custom(true), custom(false)];

  assert.equal(shouldEnforceAssistantMessage(history, "Should we use Postgres? Should we add Redis?"), false);
});

test("correction prompt asks the agent to regenerate with exactly one decision question", () => {
  const prompt = makeCorrectionPrompt("Should we use Postgres? Should we add Redis?");

  assert.match(prompt, /exactly one decision question/i);
  assert.match(prompt, /notes, not questions/i);
  assert.match(prompt, /Postgres/);
});
