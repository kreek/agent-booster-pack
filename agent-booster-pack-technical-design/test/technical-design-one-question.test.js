import { describe, expect, it } from "vitest";

import technicalDesignOneQuestion, {
  countUserFacingQuestions,
  isTechnicalDesignActivation,
  isTechnicalDesignDeactivation,
  makeCorrectionPrompt,
  shouldEnforceAssistantMessage,
  TECHNICAL_DESIGN_STATE_ENTRY,
} from "../extensions/technical-design-one-question.js";

const messages = (...items) =>
  items.map(([role, content]) => ({
    type: "message",
    message: { role, content },
  }));

const custom = (active) => ({
  type: "custom",
  customType: TECHNICAL_DESIGN_STATE_ENTRY,
  data: { active },
});

function makePiHarness() {
  const commands = new Map();
  const userMessages = [];
  const notifications = [];

  const pi = {
    appendEntry() {},
    sendMessage() {},
    sendUserMessage(message) {
      userMessages.push(message);
    },
    registerCommand(name, command) {
      commands.set(name, command);
    },
    on() {},
  };

  const ctx = {
    ui: {
      notify(message, level) {
        notifications.push({ message, level });
      },
    },
  };

  technicalDesignOneQuestion(pi);

  return { commands, ctx, notifications, userMessages };
}

describe("technical-design one-question guard", () => {
  it("detects manual technical-design activation commands", () => {
    expect(isTechnicalDesignActivation("/abp:technical-design design the import flow")).toBe(true);
    expect(isTechnicalDesignActivation(" /abp:technical-design")).toBe(true);
    expect(isTechnicalDesignActivation("/abp:technical-design-off")).toBe(false);
  });

  it("detects explicit skill invocation as automatic activation", () => {
    expect(isTechnicalDesignActivation("/skill:technical-design design the API")).toBe(true);
    expect(isTechnicalDesignActivation("/skill:proof add tests")).toBe(false);
  });

  it("detects manual technical-design deactivation", () => {
    expect(isTechnicalDesignDeactivation("/abp:technical-design-off")).toBe(true);
    expect(isTechnicalDesignDeactivation("/abp:technical-design off")).toBe(false);
  });

  it("does not treat old whiteboard commands as activation aliases", () => {
    expect(isTechnicalDesignActivation("/abp:whiteboard design the import flow")).toBe(false);
    expect(isTechnicalDesignActivation("/skill:whiteboarding design the API")).toBe(false);
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

  it("does not enforce outside active technical-design mode", () => {
    const history = messages(["assistant", "Should we use Postgres? Should we add Redis?"]);

    expect(shouldEnforceAssistantMessage(history, "Should we use Postgres? Should we add Redis?")).toBe(false);
  });

  it("enforces multi-question assistant messages while technical-design is active", () => {
    const history = [custom(true), ...messages(["assistant", "Goal noted."])];

    expect(shouldEnforceAssistantMessage(history, "Should we use Postgres? Should we add Redis?")).toBe(true);
  });

  it("allows a single question while technical-design is active", () => {
    const history = [custom(true), ...messages(["assistant", "Goal noted."])];

    expect(shouldEnforceAssistantMessage(history, "Should we use Postgres?")).toBe(false);
  });

  it("latest persisted technical-design state wins", () => {
    const history = [custom(true), custom(false)];

    expect(shouldEnforceAssistantMessage(history, "Should we use Postgres? Should we add Redis?")).toBe(false);
  });


  it("forwards command arguments through the Pi API, not the command context", async () => {
    const { commands, ctx, userMessages } = makePiHarness();

    await commands.get("abp:technical-design").handler("design the import flow", ctx);

    expect(userMessages).toEqual(["design the import flow"]);
  });

  it("correction prompt asks the agent to regenerate with exactly one decision question", () => {
    const prompt = makeCorrectionPrompt("Should we use Postgres? Should we add Redis?");

    expect(prompt).toMatch(/exactly one decision question/i);
    expect(prompt).toMatch(/notes, not questions/i);
    expect(prompt).toMatch(/Postgres/);
  });
});
