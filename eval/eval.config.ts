import * as os from "node:os";
import * as path from "node:path";
import type { ExecutionProfile, ProjectEvalConfig } from "do-eval";

const provider = process.env["ABP_EVAL_PROVIDER"] ?? "openai";
const model = process.env["ABP_EVAL_MODEL"] ?? "gpt-5.5";
const judgeModel = process.env["ABP_EVAL_JUDGE_MODEL"] ?? "gpt-5.5";
const reasoningEffort = process.env["ABP_EVAL_REASONING_EFFORT"] ?? "medium";
const codexReasoningArgs = ["-c", `model_reasoning_effort="${reasoningEffort}"`];

const ABP_REPO_ROOT = path.resolve(import.meta.dirname, "..");

const baselineCodexAgent: ExecutionProfile["agent"] = {
  harness: "codex",
  provider,
  model,
  codex: {
    isolateHome: true,
    ignoreUserConfig: true,
    extraArgs: ["--disable", "plugins", ...codexReasoningArgs],
  },
};

const abpCodexAgent: ExecutionProfile["agent"] = {
  harness: "codex",
  provider,
  model,
  codex: {
    isolateHome: true,
    pluginMarketplaces: [ABP_REPO_ROOT],
    extraArgs: ["-c", 'plugins."abp@abp".enabled=true', ...codexReasoningArgs],
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
        reasoningEffort,
        layers: [],
      },
    },
    codexWithAbpSkills: {
      id: "codexWithAbpSkills",
      label: "Codex + ABP skills",
      agent: abpCodexAgent,
      setup: {
        layers: [
          {
            id: "abp-skills",
            kind: "skill-library",
            runtime: "codex",
            source: "../agents/.agents/skills",
            capabilities: skillLayerCapabilities,
          },
        ],
      },
      factors: {
        harness: "codex",
        provider,
        model,
        reasoningEffort,
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
      requireJudge: true,
      requiredDeterministicScores: {
        baseline_isolation: 100,
        abp_activation: 100,
      },
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
    largeProject: {
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
    model: judgeModel,
    thinking: reasoningEffort,
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
