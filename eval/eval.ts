import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import type {
  AgentSnapshot,
  EvalReport,
  ExecutionProfile,
  JudgeResult,
  ProfileSetupLayer,
  ProfileSuiteReport,
} from "pi-do-eval";
import config from "./eval.config.js";
import {
  captureEnvironment,
  createProfileBenchReport,
  createSuiteReport,
  defaultVerify,
  generateRunId,
  printAggregatedSummary,
  printBenchComparison,
  printSummary,
  runEval,
  runJudge,
  scoreSession,
  updateBenchIndex,
  updateRunIndex,
  updateSuiteIndex,
  writeBenchReport,
  writeReport,
  writeSuiteReport,
} from "./framework.js";
import maturityPlugin from "./plugins/engineering-maturity.js";
import type { ExperimentConfig, ModelConfig, SuiteEntry } from "./types.js";

const TRIALS_DIR = path.join(import.meta.dirname, "trials");
const RUNS_DIR = resolveRunsDir();

function resolveRunsDir(): string {
  // Trial workdirs must live outside the agent-booster-pack repo so codex's
  // ancestor walk can't auto-discover the repo's AGENTS.md and skill library
  // and thereby leak ABP doctrine into the baseline profile.
  const override = process.env["ABP_EVAL_RUNS_DIR"];
  const target = override
    ? path.resolve(override)
    : path.join(os.homedir(), ".cache", "agent-booster-pack", "eval", "runs");
  fs.mkdirSync(target, { recursive: true });
  return target;
}

interface RunTrialOptions {
  profile: ExecutionProfile;
  variant?: string;
  suite?: string;
  suiteRunId?: string;
  epoch?: number;
  totalEpochs?: number;
  judge?: boolean;
}

function safeName(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "run";
}

function hasFlag(name: string): boolean {
  return process.argv.includes(`--${name}`);
}

function getFlag(name: string): string | undefined {
  const idx = process.argv.indexOf(`--${name}`);
  return idx >= 0 ? process.argv[idx + 1] : undefined;
}

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}

function getProfile(profileId: string): ExecutionProfile {
  const profile = config.profiles[profileId];
  if (!profile) {
    fail(`Unknown profile "${profileId}". Available: ${Object.keys(config.profiles).join(", ")}`);
  }
  return profile;
}

function getSuiteEntries(suiteName: string): SuiteEntry[] {
  const entries = config.suites[suiteName];
  if (!entries) {
    fail(`Unknown suite "${suiteName}". Available: ${Object.keys(config.suites).join(", ")}`);
  }
  return entries;
}

function getExperiment(experimentName: string): ExperimentConfig {
  const experiment = config.experiments[experimentName];
  if (!experiment) {
    fail(`Unknown experiment "${experimentName}". Available: ${Object.keys(config.experiments).join(", ")}`);
  }
  return experiment;
}

function resolveBenchmarkExperimentName(suiteName: string): string {
  const exact = config.experiments[suiteName];
  if (exact?.suite === suiteName) return suiteName;

  const matches = Object.entries(config.experiments).filter(([, experiment]) => experiment.suite === suiteName);
  if (matches.length === 1) return matches[0]?.[0] ?? suiteName;

  const available = Object.keys(config.suites).join(", ");
  fail(
    matches.length === 0
      ? `Unknown suite "${suiteName}". Available: ${available}`
      : `Suite "${suiteName}" has multiple experiments; add an experiment named "${suiteName}" to make bench launch unambiguous`,
  );
}

function assertSupportedVariant(trialName: string, variant: string): void {
  if (variant !== "default") {
    fail(`Trial "${trialName}" only supports variant "default"; received "${variant}"`);
  }
}

function profileWorkerSnapshot(profile: ExecutionProfile): ModelConfig {
  const provider = profile.agent.provider ?? profile.factors.provider;
  const model = profile.agent.model ?? profile.factors.model;
  return {
    ...(typeof provider === "string" ? { provider } : {}),
    ...(typeof model === "string" ? { model } : {}),
    ...(profile.agent.thinking ? { thinking: profile.agent.thinking } : {}),
  };
}

function resolveLayerSource(layer: ProfileSetupLayer): string {
  if (!layer.source) throw new Error(`Layer "${layer.id}" is missing a source path`);
  const source = path.isAbsolute(layer.source) ? layer.source : path.resolve(import.meta.dirname, layer.source);
  if (!fs.existsSync(source)) throw new Error(`Layer "${layer.id}" source does not exist: ${source}`);
  return source;
}

function defaultLayerTarget(layer: ProfileSetupLayer): string {
  if (layer.kind === "skill-library") return path.join(".codex", "skills");
  throw new Error(`Layer "${layer.id}" requires target because kind "${layer.kind}" has no default`);
}

function resolveLayerTarget(workDir: string, layer: ProfileSetupLayer): string {
  const target = layer.target ?? defaultLayerTarget(layer);
  const resolved = path.resolve(workDir, target);
  const relative = path.relative(workDir, resolved);
  if (relative === "" || relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`Layer "${layer.id}" target escapes workDir: ${target}`);
  }
  return resolved;
}

function copyLayer(source: string, target: string): void {
  const stat = fs.statSync(source);
  if (stat.isDirectory()) {
    fs.mkdirSync(target, { recursive: true });
    fs.cpSync(source, target, { recursive: true, force: true });
    return;
  }
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
}

function prepareProfileWorkDir(profile: ExecutionProfile, workDir: string): void {
  for (const layer of profile.setup?.layers ?? []) {
    const mode = layer.mode ?? "copy";
    if (mode !== "copy") {
      throw new Error(`Layer "${layer.id}" uses unsupported setup mode in this eval suite: ${mode}`);
    }
    const source = resolveLayerSource(layer);
    const target = resolveLayerTarget(workDir, layer);
    copyLayer(source, target);
    console.log(`  Layer: ${layer.id} -> ${path.relative(workDir, target)} (${mode})`);
  }
}

function trialPrompt(trialName: string): string {
  const taskPath = path.join(TRIALS_DIR, trialName, "task.md");
  const task = fs.readFileSync(taskPath, "utf-8");
  return [
    task.trim(),
    "",
    "Work in the provided repository. Do not add external dependencies.",
  ].join("\n");
}

async function runTrial(trialName: string, opts: RunTrialOptions): Promise<{ report: EvalReport; runDir: string }> {
  const variant = opts.variant ?? "default";
  assertSupportedVariant(trialName, variant);
  const runId = generateRunId();
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const runName = [timestamp, runId].join("-");
  const runDir = path.join(RUNS_DIR, runName);
  const workDir = path.join(runDir, "workdir");
  const trialDir = path.join(TRIALS_DIR, trialName);
  fs.mkdirSync(workDir, { recursive: true });

  const worker = profileWorkerSnapshot(opts.profile);
  const agentSnapshot: AgentSnapshot = {
    worker,
    ...(opts.judge && config.judge ? { judge: config.judge } : {}),
    ...(config.timeouts ? { timeouts: config.timeouts } : {}),
    ...(config.budgets ? { budgets: config.budgets } : {}),
    ...(opts.totalEpochs ? { epochs: opts.totalEpochs } : {}),
  };

  console.log(`Running ${trialName} with ${opts.profile.label}`);
  console.log(`  Work dir: ${workDir}`);

  const result = await runEval({
    trialDir,
    workDir,
    prompt: trialPrompt(trialName),
    extensionPath: maturityPlugin.extensionPath,
    plugin: maturityPlugin,
    timeoutMs: config.timeouts?.workerMs,
    inactivityMs: config.timeouts?.inactivityMs,
    provider: worker.provider,
    model: worker.model,
    thinking: worker.thinking,
    agent: opts.profile.agent,
    prepareWorkDir: (preparedWorkDir: string) => prepareProfileWorkDir(opts.profile, preparedWorkDir),
    live: {
      runDir,
      runsDir: RUNS_DIR,
      meta: {
        runId,
        trial: trialName,
        variant,
        agentSnapshot,
        ...(opts.suite ? { suite: opts.suite, suiteRunId: opts.suiteRunId } : {}),
        ...(opts.epoch ? { epoch: opts.epoch, totalEpochs: opts.totalEpochs } : {}),
      },
    },
  });

  if (result.stderr) fs.writeFileSync(path.join(runDir, "stderr.txt"), result.stderr);
  fs.writeFileSync(path.join(runDir, "session.jsonl"), result.session.rawLines.join("\n"));

  const verify = maturityPlugin.verify?.(workDir) ?? defaultVerify();
  console.log(`  Verify: ${verify.passed ? "PASS" : "FAIL"}`);

  let judgeResult: JudgeResult | undefined;
  let judgeFailure: string | undefined;
  if (opts.judge) {
    console.log("  Judge: evaluating...");
    const judgeOutcome = await runJudge({
      workDir,
      prompt: maturityPlugin.buildJudgePrompt(fs.readFileSync(path.join(TRIALS_DIR, trialName, "task.md"), "utf-8"), workDir),
      timeoutMs: config.timeouts?.judgeMs,
      provider: config.judge?.provider,
      model: config.judge?.model,
      thinking: config.judge?.thinking,
    });
    if (judgeOutcome.ok) {
      judgeResult = judgeOutcome.result;
    } else {
      judgeFailure = judgeOutcome.reason;
      console.log(`  Judge: failed (${judgeFailure}), using deterministic scores only`);
    }
    // Always persist the raw judge output so that empty-findings or
    // unexpected-score outcomes can be diagnosed without re-running the judge.
    if (judgeOutcome.stdout) {
      fs.writeFileSync(path.join(runDir, "judge.stdout.txt"), judgeOutcome.stdout);
    }
  }

  const scores = scoreSession({
    session: result.session,
    verify,
    plugin: maturityPlugin,
    judgeResult,
    budgets: config.budgets,
  });
  const pluginResult = maturityPlugin.scoreSession(result.session, verify);
  const findings = [
    ...scores.issues,
    ...pluginResult.findings,
    ...(verify.passed ? [] : ["Verification failed"]),
    ...(result.status === "completed" ? [] : [`Session ended with status: ${result.status}`]),
    ...(judgeResult?.findings ?? []),
    ...(judgeFailure ? [`Judge failed: ${judgeFailure}`] : []),
  ];

  const workerModel = result.session.modelInfo
    ? `${result.session.modelInfo.provider}/${result.session.modelInfo.model}`
    : opts.profile.id;
  const report: EvalReport = {
    meta: {
      runId,
      trial: trialName,
      variant,
      workerModel,
      ...(judgeResult && config.judge?.model ? { judgeModel: config.judge.model } : {}),
      startedAt: new Date(result.session.startTime).toISOString(),
      durationMs: result.session.endTime - result.session.startTime,
      status: result.status,
      verifyPassed: verify.passed,
      agentSnapshot,
      environment: captureEnvironment(),
      ...(opts.suite ? { suite: opts.suite, suiteRunId: opts.suiteRunId } : {}),
      ...(opts.epoch ? { epoch: opts.epoch, totalEpochs: opts.totalEpochs } : {}),
    },
    scores,
    ...(judgeResult ? { judgeResult } : {}),
    session: { ...result.session, rawLines: [] },
    findings,
  };

  writeReport(report, runDir);
  updateRunIndex(RUNS_DIR);
  printSummary(report);
  return { report, runDir: path.basename(runDir) };
}

async function runSuiteForProfile(
  suiteName: string,
  profile: ExecutionProfile,
  options: { suiteRunId: string; label: string; epochs?: number; judge?: boolean },
): Promise<ProfileSuiteReport> {
  const entries = getSuiteEntries(suiteName);
  const globalEpochs = options.epochs ?? config.epochs ?? 1;
  const allResults: Array<{ report: EvalReport; runDir: string }> = [];
  let maxEpochs = 1;

  console.log(`\n=== ${options.label}: ${profile.label} ===\n`);
  for (const entry of entries) {
    assertSupportedVariant(entry.trial, entry.variant);
    const epochs = entry.epochs ?? globalEpochs;
    maxEpochs = Math.max(maxEpochs, epochs);
    for (let epoch = 1; epoch <= epochs; epoch++) {
      allResults.push(
        await runTrial(entry.trial, {
          profile,
          variant: entry.variant,
          suite: suiteName,
          suiteRunId: options.suiteRunId,
          ...(epochs > 1 ? { epoch, totalEpochs: epochs } : {}),
          ...(options.judge !== undefined ? { judge: options.judge } : {}),
        }),
      );
    }
  }

  const suiteReport = createSuiteReport(
    suiteName,
    options.suiteRunId,
    allResults,
    new Date().toISOString(),
    maxEpochs > 1 ? maxEpochs : undefined,
    profile.id,
  );
  writeSuiteReport(suiteReport, RUNS_DIR);
  updateSuiteIndex(RUNS_DIR);
  if (suiteReport.aggregated) {
    console.log(`\n--- Aggregated Results [${profile.id}] ---`);
    for (const entry of suiteReport.aggregated) printAggregatedSummary(entry);
  }

  return { profile, report: suiteReport };
}

async function runExperiment(experimentName: string): Promise<void> {
  const experiment = getExperiment(experimentName);
  if (new Set(experiment.profiles).size !== experiment.profiles.length) {
    fail(`Experiment "${experimentName}" contains duplicate profile ids`);
  }
  if (!experiment.profiles.includes(experiment.baseline)) {
    fail(`Experiment "${experimentName}" baseline must be one of its profiles`);
  }

  const benchRunId = `bench-${Date.now()}-${safeName(experimentName)}`;
  const benchStartedAt = new Date().toISOString();
  const profileReports: ProfileSuiteReport[] = [];

  for (const profileId of experiment.profiles) {
    const profile = getProfile(profileId);
    const suiteRunId = `suite-${Date.now()}-${safeName(experimentName)}-${safeName(profile.id)}`;
    profileReports.push(
      await runSuiteForProfile(experiment.suite, profile, {
        suiteRunId,
        label: `Experiment ${experimentName}`,
        ...(experiment.epochs !== undefined ? { epochs: experiment.epochs } : {}),
        judge: !hasFlag("no-judge"),
      }),
    );
  }

  const benchReport = createProfileBenchReport(
    experiment.suite,
    benchRunId,
    profileReports,
    benchStartedAt,
    new Date().toISOString(),
    experiment.baseline,
  );
  printBenchComparison(benchReport);
  writeBenchReport(benchReport, RUNS_DIR);
  updateBenchIndex(RUNS_DIR);
}

function listConfig(): void {
  console.log("Profiles:");
  for (const profile of Object.values(config.profiles)) {
    console.log(`  ${profile.id}: ${profile.label} (${profile.factors.layers.length} layers)`);
  }
  console.log("\nSuites:");
  for (const [name, entries] of Object.entries(config.suites)) {
    console.log(`  ${name}: ${entries.map((entry) => entry.trial).join(", ")}`);
  }
  console.log("\nExperiments:");
  for (const [name, experiment] of Object.entries(config.experiments)) {
    console.log(`  ${name}: ${experiment.suite} [${experiment.profiles.join(", ")}], baseline=${experiment.baseline}`);
  }
}

async function runSuiteCommand(suiteName: string, profileId: string): Promise<void> {
  const profile = getProfile(profileId);
  const suiteRunId = `suite-${Date.now()}-${safeName(suiteName)}-${safeName(profile.id)}`;
  await runSuiteForProfile(suiteName, profile, {
    suiteRunId,
    label: `Suite ${suiteName}`,
    judge: !hasFlag("no-judge"),
  });
}

const command = process.argv[2] ?? "list";

if (command === "list") {
  listConfig();
} else if (command === "run") {
  const trial = getFlag("trial");
  const suite = process.argv[3] && !process.argv[3].startsWith("--") ? process.argv[3] : undefined;
  const profileId = getFlag("profile") ?? "codexWithAbpSkills";
  if (trial) {
    await runTrial(trial, {
      profile: getProfile(profileId),
      variant: getFlag("variant") ?? "default",
      judge: !hasFlag("no-judge"),
    });
  } else if (suite) {
    await runSuiteCommand(suite, profileId);
  } else {
    fail("Usage: npm run eval -- run <suite> [--profile <profile>] [--judge]");
  }
} else if (command === "bench") {
  const suite = process.argv[3] && !process.argv[3].startsWith("--") ? process.argv[3] : "allSkills";
  await runExperiment(resolveBenchmarkExperimentName(suite));
} else if (command === "experiment") {
  await runExperiment(process.argv[3] && !process.argv[3].startsWith("--") ? process.argv[3] : "codex-abp");
} else {
  console.log("Usage:");
  console.log("  npm run list");
  console.log("  npm run eval -- run <suite> [--profile <profile>] [--no-judge]");
  console.log("  npm run eval -- run --trial <trial> [--variant default] [--profile <profile>] [--no-judge]");
  console.log("  npm run eval -- bench <suite> [--no-judge]");
  console.log("  npm run experiment -- [--no-judge]");
  process.exit(1);
}
