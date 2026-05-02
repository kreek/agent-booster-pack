declare module "pi-do-eval" {
  export interface BudgetConfig {
    maxInputTokens?: number;
    maxOutputTokens?: number;
    maxTotalTokens?: number;
    maxDurationMs?: number;
    maxToolCalls?: number;
    maxBlockedCalls?: number;
    maxFileWrites?: number;
  }

  export interface AgentRuntimeConfig {
    harness?: string;
    provider?: string;
    model?: string;
    thinking?: string;
    env?: Record<string, string | undefined>;
    args?: string[];
    options?: Record<string, unknown>;
    codex?: {
      home?: string;
      isolateHome?: boolean;
      authHome?: string;
      ignoreUserConfig?: boolean;
      pluginMarketplaces?: string[];
      profile?: string;
      extraArgs?: string[];
      env?: Record<string, string | undefined>;
    };
  }

  export interface ProfileLayer {
    id: string;
    kind: "plugin" | "skill-library" | "mcp" | "hook" | "config" | "rules" | string;
    runtime?: "pi" | "codex" | "claude" | string;
    version?: string;
    capabilities?: string[];
  }

  export interface ProfileSetupLayer extends ProfileLayer {
    source?: string;
    mode?: "copy" | "symlink" | "install" | string;
    target?: string;
  }

  export interface ExecutionProfile {
    id: string;
    label: string;
    agent: AgentRuntimeConfig;
    factors: {
      harness?: string;
      provider?: string;
      model?: string;
      layers: ProfileLayer[];
      [key: string]: unknown;
    };
    setup?: {
      layers?: ProfileSetupLayer[];
    };
  }

  export interface AgentSnapshot {
    worker?: { provider?: string; model?: string; thinking?: string };
    judge?: { provider?: string; model?: string; thinking?: string };
    timeouts?: { workerMs?: number; inactivityMs?: number; judgeMs?: number };
    budgets?: BudgetConfig;
    epochs?: number;
    regressionThreshold?: number;
  }

  export interface ToolCallRecord {
    timestamp: number;
    name: string;
    arguments: Record<string, unknown>;
    resultText: string;
    wasBlocked: boolean;
  }

  export interface FileWriteRecord {
    timestamp: number;
    path: string;
    tool: "write" | "edit";
    labels: string[];
  }

  export interface PluginEvent {
    timestamp: number;
    type: string;
    data: Record<string, unknown>;
  }

  export interface EvalSession {
    toolCalls: ToolCallRecord[];
    fileWrites: FileWriteRecord[];
    pluginEvents: PluginEvent[];
    rawLines: string[];
    startTime: number;
    endTime: number;
    exitCode: number | null;
    tokenUsage: { input: number; output: number };
    modelInfo?: { model: string; provider: string };
    parseWarnings: number;
  }

  export interface VerifyResult {
    passed: boolean;
    output: string;
    metrics: Record<string, number>;
  }

  export interface JudgeResult {
    scores: Record<string, number>;
    reasons: Record<string, string>;
    findings: string[];
  }

  export interface EvalScores {
    deterministic: Record<string, number>;
    judge?: Record<string, number>;
    overall: number;
    issues: string[];
  }

  export type EvalRunStatus = "completed" | "timeout" | "crashed" | "stalled";

  export interface EvalReport {
    meta: {
      runId?: string;
      trial: string;
      variant: string;
      workerModel: string;
      judgeModel?: string;
      startedAt: string;
      durationMs: number;
      status: EvalRunStatus;
      verifyPassed: boolean;
      suite?: string;
      suiteRunId?: string;
      epoch?: number;
      totalEpochs?: number;
      agentSnapshot?: AgentSnapshot;
      environment?: unknown;
    };
    scores: EvalScores;
    judgeResult?: JudgeResult;
    session: EvalSession;
    findings: string[];
  }

  export interface EvalPlugin {
    name: string;
    extensionPath: string;
    parseEvent?(toolName: string, resultText: string, timestamp: number): PluginEvent[];
    classifyFile?(filePath: string): string;
    scoreSession(
      session: EvalSession,
      verify: VerifyResult,
    ): {
      scores: Record<string, number>;
      weights: Record<string, number>;
      findings: string[];
      judge?: {
        includeInOverall?: boolean;
        defaultWeight?: number;
        weights?: Record<string, number>;
      };
    };
    buildJudgePrompt(taskDescription: string, workDir: string): string;
    verify?(workDir: string): VerifyResult;
  }

  export interface SuiteReport {
    suite: string;
    suiteRunId: string;
    workerModel?: string;
    startedAt: string;
    completedAt: string;
    entries: Array<Record<string, unknown>>;
    summary: {
      totalRuns: number;
      completedRuns: number;
      verifyFailureCount: number;
      hardFailureCount: number;
      averageOverall: number;
      epochs?: number;
    };
    epochs?: number;
    aggregated?: Array<Record<string, unknown>>;
  }

  export interface ProfileSuiteReport {
    profile: ExecutionProfile;
    report: SuiteReport;
  }

  export function captureEnvironment(): unknown;
  export function createProfileBenchReport(...args: unknown[]): unknown;
  export function createSuiteReport(...args: unknown[]): SuiteReport;
  export function defaultVerify(): VerifyResult;
  export function generateRunId(): string;
  export function printAggregatedSummary(entry: unknown): void;
  export function printBenchComparison(report: unknown): void;
  export function printSummary(report: EvalReport): void;
  export function runEval(opts: Record<string, unknown>): Promise<{
    session: EvalSession;
    status: EvalRunStatus;
    exitCode: number | null;
    stderr: string;
    workDir: string;
  }>;
  export function runJudge(opts: Record<string, unknown>): Promise<
    | { ok: true; result: JudgeResult; stdout: string }
    | { ok: false; reason: "timeout" | "crash" | "parse_error" | "empty_response"; stdout?: string }
  >;
  export function scoreSession(opts: Record<string, unknown>): EvalScores;
  export function updateBenchIndex(runsDir: string): void;
  export function updateRunIndex(runsDir: string): void;
  export function updateSuiteIndex(runsDir: string): void;
  export function writeBenchReport(report: unknown, runsDir: string): string;
  export function writeReport(report: EvalReport, runDir: string): void;
  export function writeSuiteReport(report: SuiteReport, runsDir: string): string;
}
