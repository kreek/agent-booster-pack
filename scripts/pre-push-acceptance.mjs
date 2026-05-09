#!/usr/bin/env node
// Run repo-wide ABP acceptance checks before sharing commits.

import { existsSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { Check, runChecks } from "./pre-commit-acceptance.mjs";

export function repoRootFromScript() {
  return resolve(dirname(fileURLToPath(import.meta.url)), "..");
}

export function selectChecks() {
  return [new Check("repo acceptance suite passes", ["make", "test"], ["make"])];
}

function parseArgs(argv) {
  let repoRoot = repoRootFromScript();
  let dryRun = false;
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "-h" || arg === "--help") {
      console.log(`Usage: node scripts/pre-push-acceptance.mjs [--repo-root PATH] [--dry-run]

Run ABP pre-push acceptance checks.`);
      return { help: true };
    } else if (arg === "--dry-run") {
      dryRun = true;
    } else if (arg === "--repo-root") {
      repoRoot = argv[index + 1];
      index += 1;
    } else {
      console.error(`ERROR: unknown option: ${arg}`);
      return { error: true };
    }
  }
  return { repoRoot: resolve(repoRoot), dryRun };
}

export function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  if (args.help) return 0;
  if (args.error) return 2;

  const root = args.repoRoot;
  if (!existsSync(root) || !statSync(root).isDirectory()) {
    console.error(`ERROR: repo root is not a directory: ${root}`);
    return 2;
  }

  console.log("ABP pre-push acceptance checks");
  return runChecks(root, selectChecks(), args.dryRun);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exitCode = main();
}
