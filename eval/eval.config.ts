import * as os from "node:os";
import * as path from "node:path";
import type { ExecutionProfile, ProjectEvalConfig } from "do-eval";

const provider = process.env["ABP_EVAL_PROVIDER"] ?? "openai";
const model = process.env["ABP_EVAL_MODEL"] ?? "gpt-5.4";

const ABP_REPO_ROOT = path.resolve(import.meta.dirname, "..");

const baselineCodexAgent: ExecutionProfile["agent"] = {
  harness: "codex",
  provider,
  model,
  codex: {
    isolateHome: true,
    ignoreUserConfig: true,
    extraArgs: ["--disable", "plugins"],
  },
};

const abpCodexAgent: ExecutionProfile["agent"] = {
  harness: "codex",
  provider,
  model,
  codex: {
    isolateHome: true,
    pluginMarketplaces: [ABP_REPO_ROOT],
    extraArgs: ["-c", 'plugins."abp@abp".enabled=true'],
  },
};

const skillLayerCapabilities = [
  "accessibility",
  "api",
  "architecture",
  "async-systems",
  "code-review",
  "data-first",
  "database",
  "debugging",
  "documentation",
  "error-handling",
  "git-workflow",
  "observability",
  "performance",
  "proof",
  "refactoring",
  "release",
  "scaffolding",
  "security",
  "ui-design",
  "whiteboarding",
  "workflow",
];

const config: ProjectEvalConfig = {
  profiles: {
    codexBaseline: {
      id: "codexBaseline",
      label: "Codex baseline",
      agent: baselineCodexAgent,
      factors: {
        harness: "codex",
        provider,
        model,
        layers: [],
      },
    },
    codexWithAbpSkills: {
      id: "codexWithAbpSkills",
      label: "Codex + ABP skills",
      agent: abpCodexAgent,
      factors: {
        harness: "codex",
        provider,
        model,
        layers: [
          {
            id: "abp",
            kind: "plugin",
            runtime: "codex",
            capabilities: skillLayerCapabilities,
          },
        ],
      },
    },
  },
  benches: {
    smoke: {
      profiles: ["codexBaseline", "codexWithAbpSkills"],
      baseline: "codexBaseline",
      reuseBaseline: true,
    },
    core: {
      profiles: ["codexBaseline", "codexWithAbpSkills"],
      baseline: "codexBaseline",
      epochs: 3,
      reuseBaseline: true,
    },
    allSkills: {
      profiles: ["codexBaseline", "codexWithAbpSkills"],
      baseline: "codexBaseline",
      epochs: 1,
      reuseBaseline: true,
    },
    routing: {
      profiles: ["codexBaseline", "codexWithAbpSkills"],
      baseline: "codexBaseline",
      epochs: 3,
      reuseBaseline: true,
    },
    engineeringMaturity: {
      profiles: ["codexBaseline", "codexWithAbpSkills"],
      baseline: "codexBaseline",
      epochs: 1,
      reuseBaseline: true,
    },
  },
  defaultProfile: "codexWithAbpSkills",
  defaultPlugin: "engineering-maturity",
  runsDir: process.env["ABP_EVAL_RUNS_DIR"] ?? path.join(os.homedir(), ".cache", "agent-booster-pack", "eval", "runs"),
  judge: {
    provider: "openai-codex",
    model: "gpt-5.4",
  },
  timeouts: {
    workerMs: 15 * 60 * 1000,
    inactivityMs: 2 * 60 * 1000,
    judgeMs: 2 * 60 * 1000,
  },
  budgets: {
    maxDurationMs: 15 * 60 * 1000,
    maxToolCalls: 200,
    maxBlockedCalls: 0,
  },
  defaultLaunchType: "bench",
};

export default config;
