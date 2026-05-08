#!/usr/bin/env node
// Ensure the meta-package bundles generated sibling skill mirrors from the
// local checkout. npm file dependencies copy package files, but these generated
// skills directories are gitignored and need an explicit sync before pack.

import { cpSync, existsSync, rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const siblingPackages = [
  "agent-booster-pack-skills",
  "agent-booster-pack-contract-first",
  "agent-booster-pack-proof",
  "agent-booster-pack-whiteboard",
];

const here = dirname(fileURLToPath(import.meta.url));
const packageRoot = resolve(here, "..");
const repoRoot = resolve(packageRoot, "..");

for (const packageName of siblingPackages) {
  const source = join(repoRoot, packageName, "skills");
  const destination = join(packageRoot, "node_modules", packageName, "skills");

  if (!existsSync(source)) {
    console.error(`missing generated skills for ${packageName}: ${source}`);
    console.error("run npm run build:siblings before syncing bundled skills");
    process.exit(1);
  }

  rmSync(destination, { recursive: true, force: true });
  cpSync(source, destination, { recursive: true });
  console.log(`synced ${packageName}/skills`);
}
