import type { EvalConfig } from "./types.js";

const provider = process.env["ABP_EVAL_PROVIDER"] ?? "openai";
const model = process.env["ABP_EVAL_MODEL"] ?? "gpt-5.4";

const sharedCodexAgent: EvalConfig["profiles"][string]["agent"] = {
  harness: "codex",
  provider,
  model,
  codex: {
    isolateHome: true,
  },
};

const proofFirstBugfix = {
  trial: "proof-first-bugfix",
  priority: "core",
  skills: ["workflow", "proof", "data-first", "refactoring"],
} satisfies EvalConfig["suites"][string][number];

const securityBoundaryFix = {
  trial: "security-boundary-fix",
  priority: "core",
  skills: ["workflow", "proof", "security"],
} satisfies EvalConfig["suites"][string][number];

const designDecisionRecord = {
  trial: "design-decision-record",
  priority: "core",
  skills: ["workflow", "whiteboarding", "architecture", "documentation"],
} satisfies EvalConfig["suites"][string][number];

const debuggingRegression = {
  trial: "debugging-regression",
  priority: "core",
  skills: ["workflow", "debugging", "code-review", "proof"],
} satisfies EvalConfig["suites"][string][number];

const apiErrorContract = {
  trial: "api-error-contract",
  skills: ["api", "error-handling", "security", "documentation"],
} satisfies EvalConfig["suites"][string][number];

const databaseReleaseSafety = {
  trial: "database-release-safety",
  skills: ["database", "release", "data-first"],
} satisfies EvalConfig["suites"][string][number];

const observableAsyncWorker = {
  trial: "observable-async-worker",
  skills: ["observability", "async-systems", "performance"],
} satisfies EvalConfig["suites"][string][number];

const accessibleUiState = {
  trial: "accessible-ui-state",
  skills: ["ui-design", "accessibility"],
} satisfies EvalConfig["suites"][string][number];

const scaffoldRepoWorkflow = {
  trial: "scaffold-repo-workflow",
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
      agent: sharedCodexAgent,
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
      agent: sharedCodexAgent,
      factors: {
        harness: "codex",
        provider,
        model,
        layers: [
          {
            id: "agent-booster-pack-skills",
            kind: "skill-library",
            runtime: "codex",
            capabilities: skillLayerCapabilities,
          },
        ],
      },
      setup: {
        layers: [
          {
            id: "agent-booster-pack-skills",
            kind: "skill-library",
            runtime: "codex",
            source: "../agents/.agents/skills",
            mode: "copy",
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
    "codex-abp-smoke": {
      suite: "smoke",
      profiles: ["codexBaseline", "codexWithAbpSkills"],
      baseline: "codexBaseline",
    },
    "codex-abp-core": {
      suite: "core",
      profiles: ["codexBaseline", "codexWithAbpSkills"],
      baseline: "codexBaseline",
    },
    "codex-abp-all": {
      suite: "allSkills",
      profiles: ["codexBaseline", "codexWithAbpSkills"],
      baseline: "codexBaseline",
    },
    "codex-abp": {
      suite: "allSkills",
      profiles: ["codexBaseline", "codexWithAbpSkills"],
      baseline: "codexBaseline",
    },
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
};

export default config;
