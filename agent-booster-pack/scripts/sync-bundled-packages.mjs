#!/usr/bin/env node
// Ensure the meta-package bundles package files from the local checkout.
// npm file dependencies can leave stale package copies in node_modules when
// local package versions move independently, so prepack refreshes the exact
// files each sibling package would publish.

import { cpSync, existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const siblingPackages = [
  "agent-booster-pack-skills",
  "agent-booster-pack-contract-first",
  "agent-booster-pack-proof",
  "agent-booster-pack-technical-design",
];

const here = dirname(fileURLToPath(import.meta.url));
const packageRoot = resolve(here, "..");
const repoRoot = resolve(packageRoot, "..");

for (const packageName of siblingPackages) {
  const sourceRoot = join(repoRoot, packageName);
  const destinationRoot = join(packageRoot, "node_modules", packageName);
  const packageJsonPath = join(sourceRoot, "package.json");

  if (!existsSync(packageJsonPath)) {
    console.error(`missing package.json for ${packageName}: ${packageJsonPath}`);
    process.exit(1);
  }

  const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
  const files = ["package.json", ...(packageJson.files ?? [])];

  rmSync(destinationRoot, { recursive: true, force: true });
  mkdirSync(destinationRoot, { recursive: true });

  for (const file of files) {
    const source = join(sourceRoot, file);
    const destination = join(destinationRoot, file);

    if (!existsSync(source)) {
      console.error(`missing package file for ${packageName}: ${source}`);
      console.error("run npm run build:siblings before syncing bundled packages");
      process.exit(1);
    }

    cpSync(source, destination, { recursive: true });
  }

  if (!existsSync(join(destinationRoot, "skills"))) {
    console.error(`missing generated skills for ${packageName}: ${join(destinationRoot, "skills")}`);
    console.error("run npm run build:siblings before syncing bundled packages");
    process.exit(1);
  }

  console.log(`synced ${packageName}`);
}
