#!/usr/bin/env node
// Copies the canonical skill set into ./skills before npm pack/publish.
// Runs as the `prepack` lifecycle hook so the published tarball contains the
// skills, but the working tree never commits a duplicate of the canonical
// source at agents/.agents/skills/.

import { cpSync, mkdirSync, readdirSync, rmSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const pkgRoot = resolve(here, "..");
const repoRoot = resolve(pkgRoot, "..");
const src = join(repoRoot, "agents", ".agents", "skills");
const dest = join(pkgRoot, "skills");
const runtimeOwnedSkills = new Set(["contract-first", "proof", "specify"]);

const srcStat = statSync(src, { throwIfNoEntry: false });
if (!srcStat || !srcStat.isDirectory()) {
  console.error(`canonical skills source not found: ${src}`);
  console.error("run from a checkout of agent-booster-pack");
  process.exit(1);
}

rmSync(dest, { recursive: true, force: true });
mkdirSync(dest, { recursive: true });

let count = 0;
for (const entry of readdirSync(src).sort()) {
  const from = join(src, entry);
  if (!statSync(from).isDirectory()) continue;
  if (runtimeOwnedSkills.has(entry)) continue;
  cpSync(from, join(dest, entry), { recursive: true });
  console.log(`copied ${entry}`);
  count += 1;
}

console.log(`built ${dest} (${count} skills)`);
