import * as path from "node:path";
import type { EvalConfig } from "./types.js";

const provider = process.env["ABP_EVAL_PROVIDER"] ?? "openai";
const model = process.env["ABP_EVAL_MODEL"] ?? "gpt-5.4";

const ABP_REPO_ROOT = path.resolve(import.meta.dirname, "..");

const baselineCodexAgent: EvalConfig["profiles"][string]["agent"] = {
  harness: "codex",
  provider,
  model,
  codex: {
    isolateHome: true,
  },
};

const abpCodexAgent: EvalConfig["profiles"][string]["agent"] = {
  harness: "codex",
  provider,
  model,
  codex: {
    isolateHome: true,
    pluginMarketplaces: [ABP_REPO_ROOT],
    extraArgs: ["-c", 'plugins."abp@abp".enabled=true'],
  },
};

const proofFirstBugfix = {
  trial: "proof-first-bugfix",
  variant: "default",
  priority: "core",
  skills: ["workflow", "proof", "data-first", "refactoring"],
} satisfies EvalConfig["suites"][string][number];

const securityBoundaryFix = {
  trial: "security-boundary-fix",
  variant: "default",
  priority: "core",
  skills: ["workflow", "proof", "security"],
} satisfies EvalConfig["suites"][string][number];

const designDecisionRecord = {
  trial: "design-decision-record",
  variant: "default",
  priority: "core",
  skills: ["workflow", "whiteboarding", "architecture", "documentation"],
} satisfies EvalConfig["suites"][string][number];

const debuggingRegression = {
  trial: "debugging-regression",
  variant: "default",
  priority: "core",
  skills: ["workflow", "debugging", "code-review", "proof"],
} satisfies EvalConfig["suites"][string][number];

const apiErrorContract = {
  trial: "api-error-contract",
  variant: "default",
  skills: ["api", "error-handling", "security", "documentation"],
} satisfies EvalConfig["suites"][string][number];

const databaseReleaseSafety = {
  trial: "database-release-safety",
  variant: "default",
  skills: ["database", "release", "data-first"],
} satisfies EvalConfig["suites"][string][number];

const observableAsyncWorker = {
  trial: "observable-async-worker",
  variant: "default",
  skills: ["observability", "async-systems", "performance"],
} satisfies EvalConfig["suites"][string][number];

const accessibleUiState = {
  trial: "accessible-ui-state",
  variant: "default",
  skills: ["ui-design", "accessibility"],
} satisfies EvalConfig["suites"][string][number];

const scaffoldRepoWorkflow = {
  trial: "scaffold-repo-workflow",
  variant: "default",
  skills: ["scaffolding", "git-workflow", "documentation", "proof"],
} satisfies EvalConfig["suites"][string][number];

const core = [proofFirstBugfix, securityBoundaryFix, designDecisionRecord, debuggingRegression];
const allSkills = [
  ...core,
  apiErrorContract,
  databaseReleaseSafety,
  observableAsyncWorker,
  accessibleUiState,
  scaffoldRepoWorkflow,
];
const skillLayerCapabilities = Array.from(new Set(allSkills.flatMap((entry) => entry.skills))).sort();

const config: EvalConfig = {
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
  suites: {
    smoke: [proofFirstBugfix],
    core,
    allSkills,
    engineeringMaturity: allSkills,
  },
  experiments: {
    smoke: {
      suite: "smoke",
      profiles: ["codexBaseline", "codexWithAbpSkills"],
      baseline: "codexBaseline",
    },
    core: {
      suite: "core",
      profiles: ["codexBaseline", "codexWithAbpSkills"],
      baseline: "codexBaseline",
      epochs: 3,
    },
    allSkills: {
      suite: "allSkills",
      profiles: ["codexBaseline", "codexWithAbpSkills"],
      baseline: "codexBaseline",
      epochs: 3,
    },
    engineeringMaturity: {
      suite: "engineeringMaturity",
      profiles: ["codexBaseline", "codexWithAbpSkills"],
      baseline: "codexBaseline",
      epochs: 3,
    },
    "codex-abp-smoke": {
      suite: "smoke",
      profiles: ["codexBaseline", "codexWithAbpSkills"],
      baseline: "codexBaseline",
    },
    "codex-abp-core": {
      suite: "core",
      profiles: ["codexBaseline", "codexWithAbpSkills"],
      baseline: "codexBaseline",
      epochs: 3,
    },
    "codex-abp-all": {
      suite: "allSkills",
      profiles: ["codexBaseline", "codexWithAbpSkills"],
      baseline: "codexBaseline",
      epochs: 3,
    },
    "codex-abp": {
      suite: "allSkills",
      profiles: ["codexBaseline", "codexWithAbpSkills"],
      baseline: "codexBaseline",
      epochs: 3,
    },
  },
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
