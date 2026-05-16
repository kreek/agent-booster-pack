import { cpSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { cleanupTempDir, makeTempDir, ROOT, run } from "./helpers.mjs";

const SCRIPT = join(ROOT, "scripts/validate-skill-anatomy.mjs");

const GOOD_SKILL = `---
name: good
description: Good test skill
---

# Good

## When to Use

- trigger
- one change per commit

## When NOT to Use

- other

## Verification

- [ ] check

## Workflow

1. Do the first relevant action.
2. Run the smallest check that proves the claim.
3. Report the evidence and any blocker.
4. Keep changes scoped to the request.

## Tripwires

- Run the check before making a completion claim.
- Mark research notes as non-completion claims.
`;

const BAD_SKILL = `---
name: bad
description: Bad test skill
---

# Bad

Per Rich Hickey, prefer values over places.

## Overview

Stuff.

## Common Rationalizations

| Excuse | Reality |
|---|---|
| "Should work" | It might not. |

## Red Flags

- "Probably fine"
`;

const LONG_TRIPWIRES_SKILL = `---
name: long-tripwires
description: Long tripwire table
---

# Long Tripwires

## When to Use

- trigger

## When NOT to Use

- other

## Verification

- [ ] check

## Tripwires

- Use the skill when the shortcut appears.
- Keep the corrective action positive.
- Move rare exceptions to references.
- Keep this list shorter than the main guidance.
- Omit this section when no row pays for its tokens.
`;

let tmp;

function runScript(...args) {
  return run("node", [SCRIPT, ...args], { cwd: ROOT });
}

function makeSkill(skillsDir, name, body = GOOD_SKILL) {
  const skill = join(skillsDir, name);
  mkdirSync(skill, { recursive: true });
  writeFileSync(join(skill, "SKILL.md"), body, "utf8");
  return skill;
}

function makeCodexPluginPackage(
  root,
  {
    includeMarketplace = true,
    includeManifest = true,
    includeHooks = true,
    marketplaceSourcePath = "./plugin",
    includePolicy = true,
    includeCategory = true,
    manifestSkillsPath = "./skills/",
    manifestHooksPath = "./hooks.json",
    hookCommand = "node ${PLUGIN_ROOT}/scripts/self-review.mjs",
    codexVersion = "2.0.0",
    claudeMarketplaceVersion = "2.0.0",
    claudeEntryVersion = "2.0.0",
    claudeManifestVersion = "2.0.0",
  } = {},
) {
  if (includeMarketplace) {
    const entry = {
      name: "abp",
      source: { source: "local", path: marketplaceSourcePath },
    };
    if (includePolicy) entry.policy = { installation: "AVAILABLE", authentication: "ON_INSTALL" };
    if (includeCategory) entry.category = "Coding";
    const marketplace = {
      name: "abp",
      interface: { displayName: "Agent Booster Pack" },
      plugins: [entry],
    };
    const marketplacePath = join(root, ".agents/plugins/marketplace.json");
    mkdirSync(join(root, ".agents/plugins"), { recursive: true });
    writeFileSync(marketplacePath, JSON.stringify(marketplace), "utf8");
  }

  if (includeManifest) {
    const manifest = {
      name: "abp",
      version: codexVersion,
      skills: manifestSkillsPath,
      hooks: manifestHooksPath,
      interface: {
        displayName: "Agent Booster Pack",
        category: "Coding",
        capabilities: ["Read", "Write"],
        defaultPrompt: ["Use ABP workflow for this engineering task."],
      },
    };
    mkdirSync(join(root, "plugin/.codex-plugin"), { recursive: true });
    writeFileSync(join(root, "plugin/.codex-plugin/plugin.json"), JSON.stringify(manifest), "utf8");
    if (includeHooks) {
      const hooks = {
        hooks: {
          Stop: [
            {
              hooks: [{ type: "command", command: hookCommand, timeout: 5 }],
            },
          ],
        },
      };
      writeFileSync(join(root, "plugin/.codex-plugin/hooks.json"), JSON.stringify(hooks), "utf8");
    }

    const claudeMarketplace = {
      name: "abp",
      metadata: { version: claudeMarketplaceVersion },
      plugins: [{ name: "abp", version: claudeEntryVersion, source: "./plugin" }],
    };
    mkdirSync(join(root, ".claude-plugin"), { recursive: true });
    writeFileSync(join(root, ".claude-plugin/marketplace.json"), JSON.stringify(claudeMarketplace), "utf8");

    const claudeManifest = {
      name: "abp",
      version: claudeManifestVersion,
      hooks: {
        Stop: [
          {
            matcher: "*",
            hooks: [
              {
                type: "command",
                command: "node ${CLAUDE_PLUGIN_ROOT}/scripts/self-review.mjs",
                timeout: 5,
              },
            ],
          },
        ],
      },
    };
    mkdirSync(join(root, "plugin/.claude-plugin"), { recursive: true });
    writeFileSync(join(root, "plugin/.claude-plugin/plugin.json"), JSON.stringify(claudeManifest), "utf8");
  }
}

describe("validate-skill-anatomy CLI", () => {
  afterEach(() => {
    if (tmp) cleanupTempDir(tmp);
    tmp = undefined;
  });

  it("runs its self-test successfully", () => {
    const result = runScript("--self-test");

    expect(result.status).toBe(0);
    expect(result.stdout.trim()).toBe("self-test ok");
  });

  it("passes when skill anatomy and plugin mirror are valid", () => {
    tmp = makeTempDir();
    const skillsDir = join(tmp, "agents/.agents/skills");
    makeSkill(skillsDir, "good");
    mkdirSync(join(tmp, "plugin/skills"), { recursive: true });
    cpSync(join(skillsDir, "good"), join(tmp, "plugin/skills/good"), { recursive: true });
    makeCodexPluginPackage(tmp);

    const result = runScript(skillsDir);

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("all skills conform to the anatomy");
    expect(result.stdout).toContain("plugin/ skill mirror in sync with source");
    expect(result.stdout).toContain("codex plugin package valid");
    expect(readFileSync(join(tmp, "plugin/skills/good/SKILL.md"), "utf8")).toBe(
      readFileSync(join(skillsDir, "good/SKILL.md"), "utf8"),
    );
  });

  it("reports skill anatomy findings", () => {
    tmp = makeTempDir();
    const skillsDir = join(tmp, "agents/.agents/skills");
    makeSkill(skillsDir, "bad", BAD_SKILL);

    const result = runScript(skillsDir);

    expect(result.status).toBe(1);
    expect(result.stdout).toContain("bad/SKILL.md");
    expect(result.stdout).toContain("missing section: ## When to Use");
    expect(result.stdout).toContain("missing section: ## Verification");
    expect(result.stdout).toContain("inline 'per <expert>' attribution found");
    expect(result.stdout).toContain("obsolete section: ## Common Rationalizations");
    expect(result.stdout).toContain("obsolete section: ## Red Flags");
    expect(result.stdout).toContain("obsolete table header");
    expect(result.stdout).toContain("1 skill(s) failed anatomy validation");
  });

  it("rejects tripwires as the longest section", () => {
    tmp = makeTempDir();
    const skillsDir = join(tmp, "agents/.agents/skills");
    makeSkill(skillsDir, "long-tripwires", LONG_TRIPWIRES_SKILL);

    const result = runScript(skillsDir);

    expect(result.status).toBe(1);
    expect(result.stdout).toContain("long-tripwires/SKILL.md");
    expect(result.stdout).toContain("Tripwires must not be the longest section");
  });

  it("reports plugin drift when a skill mirror is missing", () => {
    tmp = makeTempDir();
    const skillsDir = join(tmp, "agents/.agents/skills");
    makeSkill(skillsDir, "good");
    mkdirSync(join(tmp, "plugin/skills"), { recursive: true });
    makeCodexPluginPackage(tmp);

    const result = runScript(skillsDir);

    expect(result.status).toBe(1);
    expect(result.stdout).toContain("all skills conform to the anatomy");
    expect(result.stdout).toContain("plugin drift:");
    expect(result.stdout).toContain("plugin/skills/good missing");
    expect(result.stdout).toContain("1 plugin mirror difference(s) found");
  });

  it("reports missing Codex marketplace when plugin exists", () => {
    tmp = makeTempDir();
    const skillsDir = join(tmp, "agents/.agents/skills");
    makeSkill(skillsDir, "good");
    mkdirSync(join(tmp, "plugin/skills"), { recursive: true });
    cpSync(join(skillsDir, "good"), join(tmp, "plugin/skills/good"), { recursive: true });
    makeCodexPluginPackage(tmp, { includeMarketplace: false });

    const result = runScript(skillsDir);

    expect(result.status).toBe(1);
    expect(result.stdout).toContain("codex plugin:");
    expect(result.stdout).toContain("missing");
    expect(result.stdout).toContain(".agents/plugins/marketplace.json");
  });

  it("reports invalid Codex marketplace and manifest fields", () => {
    tmp = makeTempDir();
    const skillsDir = join(tmp, "agents/.agents/skills");
    makeSkill(skillsDir, "good");
    mkdirSync(join(tmp, "plugin/skills"), { recursive: true });
    cpSync(join(skillsDir, "good"), join(tmp, "plugin/skills/good"), { recursive: true });
    makeCodexPluginPackage(tmp, {
      marketplaceSourcePath: "./wrong",
      includePolicy: false,
      includeCategory: false,
      manifestSkillsPath: "./wrong/",
      manifestHooksPath: "./wrong-hooks.json",
    });

    const result = runScript(skillsDir);

    expect(result.status).toBe(1);
    expect(result.stdout).toContain("abp.source.path must be './plugin'");
    expect(result.stdout).toContain("abp.policy must be an object");
    expect(result.stdout).toContain("abp.category must be 'Coding'");
    expect(result.stdout).toContain("skills must be './skills/'");
    expect(result.stdout).toContain("hooks must be './hooks.json'");
  });

  it("reports missing Codex self-review Stop hook", () => {
    tmp = makeTempDir();
    const skillsDir = join(tmp, "agents/.agents/skills");
    makeSkill(skillsDir, "good");
    mkdirSync(join(tmp, "plugin/skills"), { recursive: true });
    cpSync(join(skillsDir, "good"), join(tmp, "plugin/skills/good"), { recursive: true });
    makeCodexPluginPackage(tmp, { hookCommand: "node ./scripts/other.mjs" });

    const result = runScript(skillsDir);

    expect(result.status).toBe(1);
    expect(result.stdout).toContain("plugin/.codex-plugin/hooks.json");
    expect(result.stdout).toContain("must register the ABP self-review Stop hook");
  });

  it("reports plugin version drift across Claude and Codex manifests", () => {
    tmp = makeTempDir();
    const skillsDir = join(tmp, "agents/.agents/skills");
    makeSkill(skillsDir, "good");
    mkdirSync(join(tmp, "plugin/skills"), { recursive: true });
    cpSync(join(skillsDir, "good"), join(tmp, "plugin/skills/good"), { recursive: true });
    makeCodexPluginPackage(tmp, {
      codexVersion: "2.0.0",
      claudeMarketplaceVersion: "2.1.0",
      claudeEntryVersion: "2.2.0",
      claudeManifestVersion: "2.3.0",
    });

    const result = runScript(skillsDir);

    expect(result.status).toBe(1);
    expect(result.stdout).toContain("version must match");
    expect(result.stdout).toContain("abp.version must match metadata.version");
    expect(result.stdout).toContain("plugin/.codex-plugin/plugin.json");
    expect(result.stdout).toContain("plugin/.claude-plugin/plugin.json");
  });
});
