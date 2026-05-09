import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { cleanupTempDir, makeTempDir, ROOT, run } from "./helpers.mjs";
import { formatCommand, selectChecks } from "../scripts/pre-commit-acceptance.mjs";

const SCRIPT = join(ROOT, "scripts/pre-commit-acceptance.mjs");
let tmp;

function commandStrings(paths) {
  return selectChecks(paths).map((check) => formatCommand(check.command));
}

function runScript(...args) {
  return run("node", [SCRIPT, ...args], { cwd: ROOT });
}

describe("pre-commit acceptance command selection", () => {
  it("always checks the staged diff", () => {
    expect(commandStrings(["README.md"])).toContain("git diff --cached --check");
  });

  it("checks skill anatomy for skill and agent instruction changes", () => {
    const commands = commandStrings([
      "agents/.agents/skills/proof/SKILL.md",
      "agents/AGENTS.md",
      "plugin/skills/proof",
    ]);

    expect(commands).toContain("node scripts/validate-skill-anatomy.mjs");
  });

  it("keeps markdown link checks out of pre-commit", () => {
    expect(commandStrings(["README.md"])).not.toContain("uv run refcheck . --no-color");
  });

  it("keeps Vitest suites out of pre-commit", () => {
    const scriptCommands = commandStrings(["scripts/pre-commit-acceptance.mjs"]);
    const packageCommands = commandStrings(["agent-booster-pack-contract-first/extensions/interface-design-gate.js"]);

    expect(scriptCommands).not.toContain("npm test");
    expect(packageCommands).not.toContain("npm --prefix agent-booster-pack-contract-first test");
  });

  it("checks shell scripts with shellcheck and shfmt", () => {
    const commands = commandStrings(["setup.sh", ".githooks/pre-commit"]);

    expect(commands).toContain("shellcheck setup.sh .githooks/pre-commit");
    expect(commands).toContain("shfmt -d setup.sh .githooks/pre-commit");
  });
});

describe("pre-commit acceptance CLI", () => {
  afterEach(() => {
    if (tmp) cleanupTempDir(tmp);
    tmp = undefined;
  });

  it("blocks commits on main or master", () => {
    tmp = makeTempDir();
    run("git", ["init", "-b", "main"], { cwd: tmp });

    const result = runScript("--repo-root", tmp, "--dry-run");

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("refusing to commit directly on main");
  });

  it("reports no staged files on topic branches", () => {
    tmp = makeTempDir();
    mkdirSync(join(tmp, "repo"), { recursive: true });
    run("git", ["init", "-b", "chore/test"], { cwd: tmp });

    const result = runScript("--repo-root", tmp, "--dry-run");

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("No staged files; nothing to validate.");
  });
});
