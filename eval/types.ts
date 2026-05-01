import type { BudgetConfig, ExecutionProfile } from "pi-do-eval";

export interface SuiteEntry {
  trial: string;
  variant: "default";
  skills: string[];
  priority?: "core" | "supporting";
  epochs?: number;
}

export interface ExperimentConfig {
  suite: string;
  profiles: string[];
  baseline: string;
  epochs?: number;
}

export interface ModelConfig {
  provider?: string;
  model?: string;
  thinking?: string;
}

export interface EvalConfig {
  profiles: Record<string, ExecutionProfile>;
  suites: Record<string, SuiteEntry[]>;
  experiments: Record<string, ExperimentConfig>;
  epochs?: number;
  judge?: ModelConfig;
  timeouts?: {
    workerMs?: number;
    inactivityMs?: number;
    judgeMs?: number;
  };
  budgets?: BudgetConfig;
  defaultLaunchType?: "suite" | "trial" | "bench";
}
