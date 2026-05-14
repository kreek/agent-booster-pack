import { describe, expect, it } from "vitest";

import {
  finalValuePromptFor,
  finalValuePromptForSessionEntries,
  makeFinalValuePrompt,
  shouldRequestFinalValueReflection,
} from "../extensions/final-value-guard.js";

import finalValueGuard from "../extensions/final-value-guard.js";

const assistantToolCall = (name, args = {}) => ({
  role: "assistant",
  content: [{ type: "toolCall", name, arguments: args }],
});

const assistantText = (text) => ({
  role: "assistant",
  content: [{ type: "text", text }],
});

const entry = (role, content) => ({ type: "message", message: { role, content } });

describe("final value guard", () => {
  it("registers the manual command and passive message_end hook", () => {
    const commands = new Map();
    const handlers = new Map();
    const fakePi = {
      registerCommand: (name, definition) => commands.set(name, definition),
      on: (eventName, handler) => handlers.set(eventName, handler),
    };

    finalValueGuard(fakePi);

    expect(commands.get("abp:final-value")).toBeTruthy();
    expect(handlers.get("message_end")).toBeTruthy();
  });

  it("automatically replaces weak final responses after changed turns", async () => {
    const handlers = new Map();
    const sessionEntries = [
      entry("user", "implement the cache"),
      entry("assistant", [{ type: "toolCall", name: "write", arguments: { path: "src/cache.js" } }]),
    ];
    const fakePi = {
      registerCommand() {},
      on: (eventName, handler) => handlers.set(eventName, handler),
    };

    finalValueGuard(fakePi);
    const result = await handlers.get("message_end")(
      { message: assistantText("Done.") },
      { sessionManager: { getBranch: () => sessionEntries } }
    );

    expect(result.message.content[0].text).toMatch(/ABP Final Value Guard/);
    expect(result.message.content[0].text).toMatch(/one concise sentence/i);
    expect(result.message.content[0].text).toMatch(/Previous final response:\nDone\./);
  });

  it("does not replace strong final responses", async () => {
    const handlers = new Map();
    const strong = assistantText(
      "Changed the cache guard to reject stale writes before updating state. This makes cache updates safer because invalid input no longer mutates durable state."
    );
    const sessionEntries = [
      entry("user", "implement the cache"),
      entry("assistant", [{ type: "toolCall", name: "write", arguments: { path: "src/cache.js" } }]),
    ];
    const fakePi = {
      registerCommand() {},
      on: (eventName, handler) => handlers.set(eventName, handler),
    };

    finalValueGuard(fakePi);
    const result = await handlers.get("message_end")({ message: strong }, { sessionManager: { getBranch: () => sessionEntries } });

    expect(result).toBeUndefined();
  });

  it("manual command asks for final value reflection from current session changes", async () => {
    const commands = new Map();
    const sent = [];
    const sessionEntries = [
      entry("user", "implement the cache"),
      entry("assistant", [{ type: "toolCall", name: "write", arguments: { path: "src/cache.js" } }]),
      entry("assistant", [{ type: "text", text: "Done." }]),
    ];
    const fakePi = {
      registerCommand: (name, definition) => commands.set(name, definition),
      sendUserMessage: (message) => sent.push(message),
      on() {},
    };

    finalValueGuard(fakePi);
    await commands.get("abp:final-value").handler("", {
      sessionManager: { getBranch: () => sessionEntries },
    });

    expect(sent).toHaveLength(1);
    expect(sent[0]).toMatch(/one concise sentence/i);
    expect(sent[0]).toMatch(/Previous final response:\nDone\./);
  });

  it("manual command falls back to a generic reflection prompt without detected changes", async () => {
    const commands = new Map();
    const sent = [];
    const fakePi = {
      registerCommand: (name, definition) => commands.set(name, definition),
      sendUserMessage: (message) => sent.push(message),
      on() {},
    };

    finalValueGuard(fakePi);
    await commands.get("abp:final-value").handler("summarize the release", {
      sessionManager: { getBranch: () => [] },
    });

    expect(sent[0]).toMatch(/Changed:/);
    expect(sent[0]).toMatch(/Insight:/);
    expect(sent[0]).toMatch(/Proof:/);
    expect(sent[0]).toMatch(/summarize the release/);
  });

  it("does not request final value reflection for read-only turns", () => {
    const turnMessages = [assistantToolCall("read"), assistantText("The workflow skill already has that language.")];

    expect(shouldRequestFinalValueReflection(turnMessages)).toBe(false);
    expect(finalValuePromptFor(turnMessages)).toBeNull();
  });

  it("does not treat stderr redirection to /dev/null as a change", () => {
    const turnMessages = [assistantToolCall("bash", { command: "rg TODO 2>/dev/null" }), assistantText("No TODOs found.")];

    expect(finalValuePromptFor(turnMessages)).toBeNull();
  });

  it("uses a one-sentence prompt for one-file source edits", () => {
    const turnMessages = [assistantToolCall("edit", { path: "src/cache.js" }), assistantText("Updated cache handling.")];

    const prompt = finalValuePromptFor(turnMessages);

    expect(shouldRequestFinalValueReflection(turnMessages)).toBe(true);
    expect(prompt).toMatch(/one concise sentence/i);
    expect(prompt).toMatch(/what changed and why it matters/i);
    expect(prompt).toMatch(/implementation/i);
    expect(prompt).not.toMatch(/3-bullet/);
  });

  it("uses a one-sentence documentation prompt for one-file markdown writes", () => {
    const turnMessages = [
      assistantToolCall("write", { path: "docs/PRD.md" }),
      assistantText("Created the PRD at docs/PRD.md."),
    ];

    const prompt = finalValuePromptFor(turnMessages);

    expect(shouldRequestFinalValueReflection(turnMessages)).toBe(true);
    expect(prompt).toMatch(/one concise sentence/i);
    expect(prompt).toMatch(/document/i);
    expect(prompt).not.toMatch(/implementation/i);
  });

  it("uses a three-bullet prompt for medium multi-file changes", () => {
    const turnMessages = [
      assistantToolCall("edit", { path: "src/cache.js" }),
      assistantToolCall("write", { path: "test/cache.test.js" }),
      assistantText("Updated cache handling."),
    ];

    const prompt = finalValuePromptFor(turnMessages);

    expect(prompt).toMatch(/3-bullet summary/i);
    expect(prompt).toMatch(/Changed: what changed/);
    expect(prompt).toMatch(/Why: why this is better or safer/);
    expect(prompt).toMatch(/Insight: the key system insight/);
  });

  it("uses a medium implementation prompt for pathless mutating bash", () => {
    const turnMessages = [
      assistantToolCall("bash", { command: "python - <<'PY'\nopen('src/cache.js', 'w').write('x')\nPY" }),
      assistantText("Updated cache handling."),
    ];

    const prompt = finalValuePromptFor(turnMessages);

    expect(prompt).toMatch(/3-bullet summary/i);
    expect(prompt).toMatch(/implementation/i);
  });

  it("uses the full prompt for large changes", () => {
    const turnMessages = [
      assistantToolCall("write", { path: "src/app.py" }),
      assistantToolCall("write", { path: "src/storage.py" }),
      assistantToolCall("write", { path: "src/service.py" }),
      assistantToolCall("write", { path: "tests/test_app.py" }),
      assistantText("Implemented the app."),
    ];

    const prompt = finalValuePromptFor(turnMessages);

    expect(prompt).toMatch(/Insight: the key system insight/i);
    expect(prompt).toMatch(/Proof: what was proven/i);
    expect(prompt).toMatch(/Unproven: what remains unproven/i);
  });

  it("allows a sufficiently substantial small-change final response without judging keywords", () => {
    const turnMessages = [
      assistantToolCall("write", { path: "src/release.js" }),
      assistantText(
        "Changed the release guard to check registry state before version bumps. This gives maintainers a clearer handoff after a one-file implementation change."
      ),
    ];

    expect(shouldRequestFinalValueReflection(turnMessages)).toBe(false);
  });

  it("allows a large-change final response with the required labels", () => {
    const turnMessages = [
      assistantToolCall("write", { path: "src/app.py" }),
      assistantToolCall("write", { path: "src/storage.py" }),
      assistantToolCall("write", { path: "src/service.py" }),
      assistantToolCall("write", { path: "tests/test_app.py" }),
      assistantText(`Changed: implemented the approved web app across the FastAPI, storage, service, and test layers.

Why: the PRD is now a runnable local application with a tested service boundary and explicit SQLite persistence.

Insight: the provider and UI can now change independently because the service boundary owns the domain rules.

Proof: validation covered domain calculations, cache behavior, HTTP endpoints, linting, formatting, typing, and app import.

Unproven: live Yahoo Finance behavior still needs manual verification against the real network provider.`),
    ];

    expect(shouldRequestFinalValueReflection(turnMessages)).toBe(false);
  });

  it("requests a prompt when a large-change final response omits required labels", () => {
    const turnMessages = [
      assistantToolCall("write", { path: "src/app.py" }),
      assistantToolCall("write", { path: "src/storage.py" }),
      assistantToolCall("write", { path: "src/service.py" }),
      assistantToolCall("write", { path: "tests/test_app.py" }),
      assistantText(`Implemented company profile + daily history fetching/caching.

Changed:
- domain, service, provider, dashboard, and tests.

Validation:
- pytest passed
- ruff passed
- mypy passed`),
    ];

    const prompt = finalValuePromptFor(turnMessages);

    expect(prompt).toMatch(/using exactly these labels/i);
    expect(prompt).toMatch(/Unproven:/);
  });

  it("requests a prompt when required labels are empty", () => {
    const turnMessages = [
      assistantToolCall("write", { path: "src/app.py" }),
      assistantToolCall("write", { path: "src/storage.py" }),
      assistantToolCall("write", { path: "src/service.py" }),
      assistantToolCall("write", { path: "tests/test_app.py" }),
      assistantText(`Changed:
Why:
Insight:
Proof:
Unproven:`),
    ];

    const prompt = finalValuePromptFor(turnMessages);

    expect(prompt).toMatch(/using exactly these labels/i);
  });

  it("final value prompt keeps alternative strategy language for large changes", () => {
    const prompt = makeFinalValuePrompt("Updated the release skill.", {
      subject: "implementation",
      size: "large",
      uniquePathCount: 5,
    });

    expect(prompt).toMatch(/better or safer/i);
    expect(prompt).toMatch(/key system insight/i);
    expect(prompt).toMatch(/alternative strategies/i);
  });

  it("detects changes from session entries scoped to the latest user turn", () => {
    const sessionEntries = [
      entry("user", "older request"),
      entry("assistant", [{ type: "toolCall", name: "write", arguments: { path: "old.txt" } }]),
      entry("assistant", [{ type: "text", text: "Changed old.txt." }]),
      entry("user", "implement the PRD"),
      entry("assistant", [{ type: "toolCall", name: "write", arguments: { path: "src/app.py" } }]),
      entry("assistant", [{ type: "text", text: "Implemented the app and tests." }]),
    ];

    const prompt = finalValuePromptForSessionEntries(sessionEntries);

    expect(prompt).toMatch(/Previous final response:\nImplemented the app and tests\./);
    expect(prompt).toMatch(/what changed and why it matters/i);
  });
});
