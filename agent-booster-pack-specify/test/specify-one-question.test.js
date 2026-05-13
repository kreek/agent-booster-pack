import { describe, expect, it } from "vitest";

import specifyOneQuestion, {
  countUserFacingQuestions,
  isSpecifyActivation,
  isSpecifyDeactivation,
  makeCorrectionPrompt,
  shouldEnforceAssistantMessage,
  SPECIFY_STATE_ENTRY,
} from "../extensions/specify-one-question.js";

const messages = (...items) =>
  items.map(([role, content]) => ({
    type: "message",
    message: { role, content },
  }));

const custom = (active) => ({
  type: "custom",
  customType: SPECIFY_STATE_ENTRY,
  data: { active },
});

function makePiHarness() {
  const commands = new Map();
  const handlers = new Map();
  const userMessages = [];
  const notifications = [];
  const appended = [];

  const pi = {
    appendEntry(customType, data) {
      appended.push({ customType, data });
    },
    sendMessage() {},
    sendUserMessage(message) {
      userMessages.push(message);
    },
    registerCommand(name, command) {
      commands.set(name, command);
    },
    on(eventName, handler) {
      handlers.set(eventName, handler);
    },
  };

  const ctx = {
    ui: {
      notify(message, level) {
        notifications.push({ message, level });
      },
    },
  };

  specifyOneQuestion(pi);

  return { commands, ctx, handlers, notifications, userMessages, appended };
}

describe("specify one-question guard", () => {
  it("detects manual specify activation commands", () => {
    expect(isSpecifyActivation("/abp:specify design the import flow")).toBe(true);
    expect(isSpecifyActivation(" /abp:specify")).toBe(true);
    expect(isSpecifyActivation("/abp:specify-off")).toBe(false);
  });

  it("detects explicit skill invocation as manual activation", () => {
    expect(isSpecifyActivation("/skill:specify design the API")).toBe(true);
    expect(isSpecifyActivation("/skill:proof add tests")).toBe(false);
  });

  it("detects manual specify deactivation", () => {
    expect(isSpecifyDeactivation("/abp:specify-off")).toBe(true);
    expect(isSpecifyDeactivation("/abp:specify off")).toBe(false);
  });

  it("does not treat old technical-design commands as activation aliases", () => {
    expect(isSpecifyActivation("/abp:technical-design design the import flow")).toBe(false);
    expect(isSpecifyActivation("/skill:technical-design design the API")).toBe(false);
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

  it("does not enforce outside active specify mode", () => {
    const history = messages(["assistant", "Should we use Postgres? Should we add Redis?"]);

    expect(shouldEnforceAssistantMessage(history, "Should we use Postgres? Should we add Redis?")).toBe(false);
  });

  it("enforces multi-question assistant messages while specify is active", () => {
    const history = [custom(true), ...messages(["assistant", "Goal noted."])];

    expect(shouldEnforceAssistantMessage(history, "Should we use Postgres? Should we add Redis?")).toBe(true);
  });

  it("allows a single question while specify is active", () => {
    const history = [custom(true), ...messages(["assistant", "Goal noted."])];

    expect(shouldEnforceAssistantMessage(history, "Should we use Postgres?")).toBe(false);
  });

  it("latest persisted specify state wins", () => {
    const history = [custom(true), custom(false)];

    expect(shouldEnforceAssistantMessage(history, "Should we use Postgres? Should we add Redis?")).toBe(false);
  });


  it("forwards command arguments through the Pi API, not the command context", async () => {
    const { commands, ctx, userMessages } = makePiHarness();

    await commands.get("abp:specify").handler("design the import flow", ctx);

    expect(userMessages).toEqual(["design the import flow"]);
  });

  it("correction prompt asks the agent to continue with exactly one decision question", () => {
    const prompt = makeCorrectionPrompt("Should we use Postgres? Should we add Redis?");

    expect(prompt).toMatch(/exactly one decision question/i);
    expect(prompt).toMatch(/continue/i);
    expect(prompt).toMatch(/notes, not questions/i);
    expect(prompt).toMatch(/current understanding/i);
    expect(prompt).toMatch(/Postgres/);
  });

  it("replaces multi-question output visibly without hidden follow-up turns", async () => {
    const { handlers, userMessages } = makePiHarness();
    const event = {
      message: {
        role: "assistant",
        content: [{ type: "text", text: "Should we use Postgres? Should we add Redis?" }],
      },
    };
    const ctx = {
      sessionManager: { getEntries: () => [custom(true)] },
    };

    const result = await handlers.get("message_end")(event, ctx);

    expect(userMessages).toEqual([]);
    expect(result.message.content[0].text).toMatch(/ABP Specify Guard blocked this response/i);
    expect(result.message.content[0].text).toMatch(/Continue with exactly one decision question/i);
  });

  it("manual commands write explicit active and inactive state", async () => {
    const { commands, ctx, appended } = makePiHarness();

    await commands.get("abp:specify").handler("design the import flow", ctx);
    await commands.get("abp:specify-off").handler("", ctx);

    expect(appended[0]).toMatchObject({ customType: SPECIFY_STATE_ENTRY, data: { active: true } });
    expect(appended[1]).toMatchObject({ customType: SPECIFY_STATE_ENTRY, data: { active: false } });
  });
});
