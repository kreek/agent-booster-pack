import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { describe, expect, it } from "vitest";
import config from "../eval.config.js";
import maturityPlugin from "../plugins/engineering-maturity.js";

const evalDir = path.resolve(import.meta.dirname, "..");
const expectedReadmeSkills = [
  "workflow",
  "proof",
  "whiteboarding",
  "data-first",
  "architecture",
  "code-review",
  "debugging",
  "refactoring",
  "error-handling",
  "security",
  "database",
  "release",
  "observability",
  "async-systems",
  "performance",
  "api",
  "documentation",
  "ui-design",
  "accessibility",
  "git-workflow",
  "scaffolding",
] as const;
const checkedFixtureExtensions = new Set([".html", ".js", ".json", ".md", ".sql", ".txt", ".ts"]);

function getSuite(name: string) {
  const suite = config.suites[name];
  if (!suite) throw new Error(`Expected suite ${name}`);
  return suite;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function collectCheckedFiles(root: string, current = root, files: string[] = []): string[] {
  for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
    const fullPath = path.join(current, entry.name);
    if (entry.isDirectory()) {
      collectCheckedFiles(root, fullPath, files);
    } else if (entry.isFile() && checkedFixtureExtensions.has(path.extname(entry.name))) {
      files.push(fullPath);
    }
  }
  return files;
}

function expectNeutralFixtureContent(filePath: string): void {
  const content = fs.readFileSync(filePath, "utf-8");
  for (const skill of expectedReadmeSkills) {
    expect(content, filePath).not.toMatch(new RegExp(`\\b${escapeRegExp(skill)}\\b`, "i"));
  }
  expect(content, filePath).not.toMatch(/\b(ABP|Agent Booster Pack|skills?)\b/i);
}

describe("ABP eval config", () => {
  it("defines a baseline Codex profile and a Codex profile with the ABP plugin", () => {
    const baseline = config.profiles["codexBaseline"];
    const withAbp = config.profiles["codexWithAbpSkills"];
    if (!baseline || !withAbp) throw new Error("Expected Codex profiles");

    expect(baseline.agent.harness).toBe("codex");
    expect(baseline.factors.layers).toEqual([]);
    expect(baseline.agent.codex?.pluginMarketplaces ?? []).toEqual([]);

    expect(withAbp.agent.harness).toBe("codex");
    expect(withAbp.factors.layers).toEqual([
      expect.objectContaining({
        id: "abp",
        kind: "plugin",
        runtime: "codex",
      }),
    ]);
    const marketplaceSource = withAbp.agent.codex?.pluginMarketplaces?.[0];
    expect(marketplaceSource, "ABP profile must register the local repo as a codex plugin marketplace").toBeDefined();
    expect(fs.existsSync(path.resolve(marketplaceSource ?? ""))).toBe(true);
    expect(fs.existsSync(path.join(marketplaceSource ?? "", "plugin", ".codex-plugin", "plugin.json"))).toBe(true);
    expect(withAbp.agent.codex?.extraArgs).toEqual(
      expect.arrayContaining(["-c", expect.stringContaining('plugins."abp@abp".enabled=true')]),
    );
  });

  it("makes the Codex ABP experiment compare against an explicit baseline", () => {
    const experiment = config.experiments["codex-abp"];
    if (!experiment) throw new Error("Expected codex-abp experiment");
    expect(experiment.baseline).toBe("codexBaseline");
    expect(experiment.profiles).toEqual(["codexBaseline", "codexWithAbpSkills"]);
    expect(config.suites[experiment.suite]?.map((entry) => entry.trial)).toEqual(
      getSuite("allSkills").map((entry) => entry.trial),
    );
  });

  it("defines lightweight, core, and all-skills suites", () => {
    expect(Object.keys(config.suites).sort()).toEqual(["allSkills", "core", "engineeringMaturity", "smoke"]);
    expect(Object.keys(config.experiments).sort()).toEqual([
      "allSkills",
      "codex-abp",
      "codex-abp-all",
      "codex-abp-core",
      "codex-abp-smoke",
      "core",
      "engineeringMaturity",
      "smoke",
    ]);

    const smoke = getSuite("smoke");
    const core = getSuite("core");
    const allSkills = getSuite("allSkills");

    expect(smoke.length).toBeLessThan(core.length);
    expect(core.length).toBeLessThan(allSkills.length);
    expect(core.every((entry) => entry.priority === "core")).toBe(true);
    expect(new Set(core.map((entry) => entry.trial))).toEqual(
      new Set(["proof-first-bugfix", "security-boundary-fix", "design-decision-record", "debugging-regression"]),
    );
    expect(getSuite("engineeringMaturity")).toEqual(allSkills);
    for (const entry of allSkills) {
      expect(entry.variant).toBe("default");
    }
  });

  it("uses the standard pi-do-eval launcher contract for suite entries and trial discovery", () => {
    for (const [suiteName, entries] of Object.entries(config.suites)) {
      expect(entries.length, suiteName).toBeGreaterThan(0);
      for (const entry of entries) {
        expect(entry).toEqual(
          expect.objectContaining({
            trial: expect.any(String),
            variant: "default",
          }),
        );
        expect(fs.existsSync(path.join(evalDir, "trials", entry.trial, "config.ts"))).toBe(true);
      }
    }

    const evalSource = fs.readFileSync(path.join(evalDir, "eval.ts"), "utf-8");
    expect(evalSource).toContain('command === "bench"');
    expect(evalSource).toContain("resolveBenchmarkExperimentName");
  });

  it("covers every README skill without putting skill names in trial prompts or starter files", () => {
    const allSkills = getSuite("allSkills");
    const coveredSkills = new Set(allSkills.flatMap((entry) => entry.skills));
    for (const skill of expectedReadmeSkills) {
      expect(coveredSkills.has(skill), `missing suite coverage for ${skill}`).toBe(true);
    }
    expect(allSkills.filter((entry) => entry.skills.includes("workflow")).length).toBeGreaterThanOrEqual(4);
    expect(allSkills.filter((entry) => entry.skills.includes("proof")).length).toBeGreaterThanOrEqual(4);

    for (const entry of allSkills) {
      const taskPath = path.join(evalDir, "trials", entry.trial, "task.md");
      expectNeutralFixtureContent(taskPath);
      expectNeutralFixtureContent(path.join(evalDir, "trials", entry.trial, "config.ts"));
      for (const fixturePath of collectCheckedFiles(path.join(evalDir, "trials", entry.trial, "scaffold"))) {
        expectNeutralFixtureContent(fixturePath);
      }
    }
  });

  it("ships trial scaffolds that start with passing visible tests and failing hidden checks", () => {
    for (const { trial } of getSuite("allSkills")) {
      const scaffold = path.join(evalDir, "trials", trial, "scaffold");
      expect(fs.existsSync(path.join(evalDir, "trials", trial, "task.md"))).toBe(true);
      expect(fs.existsSync(path.join(scaffold, "package.json"))).toBe(true);
      expect(fs.existsSync(path.join(scaffold, "test")) || fs.existsSync(path.join(scaffold, "public"))).toBe(true);

      const workDir = fs.mkdtempSync(path.join(os.tmpdir(), `abp-eval-${trial}-`));
      try {
        fs.cpSync(scaffold, workDir, { recursive: true });
        const verify = maturityPlugin.verify?.(workDir);
        expect(verify?.passed).toBe(false);
        expect(verify?.metrics["visiblePassed"]).toBe(1);
        expect(verify?.metrics["hiddenPassed"]).toBe(0);
      } finally {
        fs.rmSync(workDir, { recursive: true, force: true });
      }
    }
  });

  it("keeps per-trial work directory names opaque to the agent", () => {
    const evalSource = fs.readFileSync(path.join(evalDir, "eval.ts"), "utf-8");
    const runNameExpression = evalSource.match(/const runName = (?<expression>.+);/)?.groups?.["expression"];
    expect(runNameExpression).toBeDefined();
    expect(runNameExpression).not.toContain("trialName");
    expect(runNameExpression).not.toContain("profile");
    expect(runNameExpression).not.toContain("suite");
  });

  it("classifies test and source writes for deterministic proof scoring", () => {
    expect(maturityPlugin.classifyFile?.("test/cart.test.js")).toBe("test");
    expect(maturityPlugin.classifyFile?.("src/cart.js")).toBe("source");
    expect(maturityPlugin.classifyFile?.("README.md")).toBe("documentation");
  });
});
