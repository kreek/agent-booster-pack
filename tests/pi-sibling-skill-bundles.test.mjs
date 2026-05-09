import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

import { ROOT } from "./helpers.mjs";

const CANONICAL_SKILLS = join(ROOT, "agents/.agents/skills");
const SIBLING_PACKAGES = [
  "agent-booster-pack-skills",
  "agent-booster-pack-proof",
  "agent-booster-pack-contract-first",
  "agent-booster-pack-technical-design",
];

function bundledSkillDirs() {
  const found = [];
  for (const packageName of SIBLING_PACKAGES) {
    const skillsRoot = join(ROOT, packageName, "skills");
    if (!existsSync(skillsRoot) || !statSync(skillsRoot).isDirectory()) continue;
    for (const name of readdirSync(skillsRoot).sort()) {
      const entry = join(skillsRoot, name);
      if (statSync(entry).isDirectory()) found.push(entry);
    }
  }
  return found;
}

function walkRelativeFiles(root, prefix = "") {
  const files = [];
  for (const name of readdirSync(join(root, prefix)).sort()) {
    const rel = prefix ? join(prefix, name) : name;
    const path = join(root, rel);
    if (statSync(path).isDirectory()) files.push(...walkRelativeFiles(root, rel));
    else files.push(rel);
  }
  return files;
}

function diffReport(left, right) {
  const diffs = [];
  const leftFiles = new Set(walkRelativeFiles(left));
  const rightFiles = new Set(existsSync(right) ? walkRelativeFiles(right) : []);

  for (const file of leftFiles) {
    if (!rightFiles.has(file)) diffs.push(`only in bundled copy: ${file}`);
    else if (!readFileSync(join(left, file)).equals(readFileSync(join(right, file)))) {
      diffs.push(`content differs: ${file}`);
    }
  }
  for (const file of rightFiles) {
    if (!leftFiles.has(file)) diffs.push(`only in canonical: ${file}`);
  }
  return diffs;
}

describe("Pi sibling skill bundles", () => {
  it("keeps every bundled skill byte-identical to the canonical source", () => {
    const bundled = bundledSkillDirs();
    if (bundled.length === 0) return;

    const problems = [];
    for (const bundledDir of bundled) {
      const canonicalDir = join(CANONICAL_SKILLS, bundledDir.split(/[\\/]/).at(-1));
      if (!existsSync(canonicalDir) || !statSync(canonicalDir).isDirectory()) {
        problems.push(
          `${relative(ROOT, bundledDir)}: bundled skill has no canonical source at ${relative(ROOT, canonicalDir)}`,
        );
        continue;
      }

      for (const detail of diffReport(bundledDir, canonicalDir)) {
        problems.push(`${relative(ROOT, bundledDir)}: ${detail}`);
      }
    }

    expect(problems).toEqual([]);
  });
});
