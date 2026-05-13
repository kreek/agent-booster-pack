import { describe, expect, it } from "vitest";

import permissionGuard, { ghPermissionVerdict } from "../extensions/permission-guard.js";

function makePi() {
  const handlers = new Map();
  return {
    on(event, handler) {
      handlers.set(event, handler);
    },
    async callTool(event, ctx) {
      return handlers.get("tool_call")?.(event, ctx);
    },
  };
}

function makeCtx({ hasUI = true, allowed = true } = {}) {
  const confirms = [];
  return {
    hasUI,
    ui: {
      async confirm(title, message) {
        confirms.push({ title, message });
        return allowed;
      },
    },
    confirms,
  };
}

describe("permission guard", () => {
  it("ignores non-bash tool calls and bash commands that do not invoke gh", () => {
    expect(ghPermissionVerdict("read", { path: "README.md" })).toBeNull();
    expect(ghPermissionVerdict("bash", { command: "git status --short" })).toBeNull();
  });

  it("detects direct gh commands, common wrappers, and nested shell invocation", () => {
    expect(ghPermissionVerdict("bash", { command: "gh pr view 123" })).toMatchObject({ command: "gh pr view 123" });
    expect(ghPermissionVerdict("bash", { command: "env GH_TOKEN=x gh pr diff" })).toMatchObject({ command: "env GH_TOKEN=x gh pr diff" });
    expect(ghPermissionVerdict("bash", { command: "command gh run view" })).toMatchObject({ command: "command gh run view" });
    expect(ghPermissionVerdict("bash", { command: "xargs gh pr view" })).toMatchObject({ command: "xargs gh pr view" });
    expect(ghPermissionVerdict("bash", { command: "bash -lc 'gh pr view'" })).toMatchObject({ command: "bash -lc 'gh pr view'" });
  });

  it("does not trigger on gh as part of another command name", () => {
    expect(ghPermissionVerdict("bash", { command: "ghq list" })).toBeNull();
    expect(ghPermissionVerdict("bash", { command: "echo ghost" })).toBeNull();
  });

  it("does not register automatic gh tool-call prompting", async () => {
    const pi = makePi();
    permissionGuard(pi);

    const result = await pi.callTool({ toolName: "bash", input: { command: "gh pr view" } }, makeCtx({ hasUI: false }));

    expect(result).toBeUndefined();
  });
});
