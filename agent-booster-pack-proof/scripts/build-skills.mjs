#!/usr/bin/env node
// Copies the canonical proof skill into ./skills before npm pack/publish.

import { cpSync, mkdirSync, rmSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const pkgRoot = resolve(here, "..");
const repoRoot = resolve(pkgRoot, "..");
const src = join(repoRoot, "agents", ".agents", "skills", "proof");
const dest = join(pkgRoot, "skills");

const srcStat = statSync(src, { throwIfNoEntry: false });
if (!srcStat || !srcStat.isDirectory()) {
  console.error(`canonical proof skill source not found: ${src}`);
  console.error("run from a checkout of agent-booster-pack");
  process.exit(1);
}

rmSync(dest, { recursive: true, force: true });
mkdirSync(dest, { recursive: true });
cpSync(src, join(dest, "proof"), { recursive: true });
console.log(`built ${dest} (proof skill)`);
