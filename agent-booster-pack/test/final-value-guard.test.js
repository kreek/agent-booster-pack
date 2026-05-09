import { describe, expect, it } from "vitest";

import {
  finalValuePromptFor,
  finalValuePromptForSessionEntries,
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

const entry = (role, content) => ({ type: "message", message: { role, content } });

describe("final value guard", () => {
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
    expect(prompt).toMatch(/Enables: what it enables next/);
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

    expect(prompt).toMatch(/Enables: what it enables going forward/i);
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

Enables: future provider and UI changes can build on stable domain and HTTP seams.

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
Enables:
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
    expect(prompt).toMatch(/enables going forward/i);
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
