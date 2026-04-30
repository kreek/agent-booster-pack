import * as path from "node:path";
import { pathToFileURL } from "node:url";
import type * as PiDoEval from "pi-do-eval";

const defaultFrameworkPath = "../../pi-extensions/pi-do-eval/src/lib/eval/index.ts";
const configuredFrameworkPath = process.env["PI_DO_EVAL_SOURCE"] ?? defaultFrameworkPath;
const frameworkUrl = configuredFrameworkPath.startsWith("file:")
  ? configuredFrameworkPath
  : pathToFileURL(path.resolve(import.meta.dirname, configuredFrameworkPath)).href;
const framework = (await import(frameworkUrl)) as typeof PiDoEval;

export const captureEnvironment = framework.captureEnvironment;
export const createProfileBenchReport = framework.createProfileBenchReport;
export const createSuiteReport = framework.createSuiteReport;
export const defaultVerify = framework.defaultVerify;
export const generateRunId = framework.generateRunId;
export const printAggregatedSummary = framework.printAggregatedSummary;
export const printBenchComparison = framework.printBenchComparison;
export const printSummary = framework.printSummary;
export const runEval = framework.runEval;
export const runJudge = framework.runJudge;
export const scoreSession = framework.scoreSession;
export const updateBenchIndex = framework.updateBenchIndex;
export const updateRunIndex = framework.updateRunIndex;
export const updateSuiteIndex = framework.updateSuiteIndex;
export const writeBenchReport = framework.writeBenchReport;
export const writeReport = framework.writeReport;
export const writeSuiteReport = framework.writeSuiteReport;
