import { mkdirSync, readFileSync, symlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { cleanupTempDir, makeTempDir, ROOT, run } from "./helpers.mjs";

const SCRIPT = join(ROOT, "scripts/generate-plugin-symlinks.mjs");
let tmp;

function makeSkill(root, name) {
  const skill = join(root, "agents/.agents/skills", name);
  mkdirSync(skill, { recursive: true });
  writeFileSync(join(skill, "SKILL.md"), `# ${name}\n`, "utf8");
  return skill;
}

function runScript(...args) {
  return run("node", [SCRIPT, ...args], { cwd: ROOT });
}

describe("generate-plugin-symlinks CLI", () => {
  afterEach(() => {
    if (tmp) cleanupTempDir(tmp);
    tmp = undefined;
  });

  it("creates real plugin copies for skills", () => {
    tmp = makeTempDir();
    makeSkill(tmp, "code-review");

    const result = runScript(tmp);

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("plugin skill mirror in sync");
    const copy = join(tmp, "plugin/skills/code-review");
    expect(readFileSync(join(copy, "SKILL.md"), "utf8")).toBe(
      readFileSync(join(tmp, "agents/.agents/skills/code-review/SKILL.md"), "utf8"),
    );
  });

  it("removes stale generated entries without removing real files", () => {
    tmp = makeTempDir();
    makeSkill(tmp, "code-review");
    const pluginSkills = join(tmp, "plugin/skills");
    mkdirSync(pluginSkills, { recursive: true });
    symlinkSync("../../agents/.agents/skills/old", join(pluginSkills, "old"));
    writeFileSync(join(pluginSkills, "local-note"), "keep me\n", "utf8");

    const result = runScript(tmp);

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("removed stale plugin entry: plugin/skills/old");
    expect(result.stderr).toContain("plugin/skills/local-note is not a generated directory");
    expect(readFileSync(join(pluginSkills, "local-note"), "utf8")).toBe("keep me\n");
  });

  it("refuses to overwrite real plugin entries", () => {
    tmp = makeTempDir();
    makeSkill(tmp, "code-review");
    const pluginSkills = join(tmp, "plugin/skills");
    mkdirSync(pluginSkills, { recursive: true });
    const conflict = join(pluginSkills, "code-review");
    writeFileSync(conflict, "not a symlink\n", "utf8");

    const result = runScript(tmp);

    expect(result.status).toBe(1);
    expect(readFileSync(conflict, "utf8")).toBe("not a symlink\n");
    expect(result.stderr).toContain("plugin/skills/code-review exists as a real file/dir");
  });

  it("prunes legacy command symlinks without recreating commands", () => {
    tmp = makeTempDir();
    makeSkill(tmp, "code-review");
    const pluginCommands = join(tmp, "plugin/commands");
    mkdirSync(pluginCommands, { recursive: true });
    symlinkSync("../../agents/.agents/commands/commit.md", join(pluginCommands, "commit.md"));

    const result = runScript(tmp);

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("removed stale plugin entry: plugin/commands/commit.md");
  });

  it("rejects paths that are not repo roots", () => {
    tmp = makeTempDir();

    const result = runScript(tmp);

    expect(result.status).toBe(2);
    expect(result.stderr).toContain("not a repo root");
  });
});
