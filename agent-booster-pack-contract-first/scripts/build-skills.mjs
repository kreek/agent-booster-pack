#!/usr/bin/env node
// Copies the contract-first skill into ./skills before npm pack/publish so
// users who install this sibling alone get the matching doctrine. The
// meta-package agent-booster-pack loads this exact skill path to avoid
// double-loading shared workflow or whiteboarding skills.

import { cpSync, mkdirSync, readdirSync, rmSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SKILLS = ["contract-first"];

const here = dirname(fileURLToPath(import.meta.url));
const pkgRoot = resolve(here, "..");
const repoRoot = resolve(pkgRoot, "..");
const src = join(repoRoot, "agents", ".agents", "skills");
const dest = join(pkgRoot, "skills");

const srcStat = statSync(src, { throwIfNoEntry: false });
if (!srcStat || !srcStat.isDirectory()) {
  console.error(`canonical skills source not found: ${src}`);
  console.error("run from a checkout of agent-booster-pack");
  process.exit(1);
}

const available = new Set(
  readdirSync(src).filter((entry) => statSync(join(src, entry)).isDirectory()),
);
const missing = SKILLS.filter((name) => !available.has(name));
if (missing.length > 0) {
  console.error(`canonical source is missing required skills: ${missing.join(", ")}`);
  process.exit(1);
}

rmSync(dest, { recursive: true, force: true });
mkdirSync(dest, { recursive: true });

for (const name of SKILLS) {
  cpSync(join(src, name), join(dest, name), { recursive: true });
  console.log(`copied ${name}`);
}

console.log(`built ${dest} (${SKILLS.length} skill${SKILLS.length === 1 ? "" : "s"})`);
