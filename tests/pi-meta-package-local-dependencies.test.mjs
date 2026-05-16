import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { readJson, ROOT } from "./helpers.mjs";

const META_PACKAGE = join(ROOT, "agent-booster-pack");
const SIBLING_PACKAGES = [
  "agent-booster-pack-skills",
  "agent-booster-pack-contract-first",
  "agent-booster-pack-proof",
  "agent-booster-pack-specify",
];

function readPackage(packageDir) {
  return readJson(join(packageDir, "package.json"));
}

describe("Pi meta-package local dependencies", () => {
  it("makes the repo root installable from GitHub for Pi during active ABP development", () => {
    const pkg = readPackage(ROOT);

    expect(pkg.private).toBe(true);
    expect(pkg.name).toBe("agent-booster-pack-github");
    expect(pkg.scripts.prepare).toBe("npm run build:pi-github");
    for (const name of SIBLING_PACKAGES) {
      expect(pkg.scripts["build:pi-github"]).toContain(`npm --prefix ${name} run build`);
    }
    expect(pkg.pi.extensions).toEqual([
      "./agent-booster-pack-contract-first/extensions",
      "./agent-booster-pack-proof/src/index.ts",
      "./agent-booster-pack-specify/extensions",
      "./agent-booster-pack/extensions",
    ]);
    expect(pkg.pi.skills).toEqual([
      "./agent-booster-pack-skills/skills",
      "./agent-booster-pack-contract-first/skills/contract-first",
      "./agent-booster-pack-proof/skills/proof",
      "./agent-booster-pack-specify/skills/specify",
    ]);
    expect(pkg.files).toContain("agent-booster-pack-proof/src");
    expect(pkg.files).toContain("agent-booster-pack-skills/skills");
    expect(pkg.files).not.toContain("agent-booster-pack");
    expect(pkg.files.some((path) => path.includes("node_modules"))).toBe(false);
  });

  it("depends on local sibling directories", () => {
    const pkg = readPackage(META_PACKAGE);

    expect(pkg.dependencies).toEqual(Object.fromEntries(SIBLING_PACKAGES.map((name) => [name, `file:../${name}`])));
  });

  it("bundles every local sibling dependency", () => {
    const pkg = readPackage(META_PACKAGE);

    expect([...pkg.bundledDependencies].sort()).toEqual([...SIBLING_PACKAGES].sort());
  });

  it("prepack builds and copies local siblings", () => {
    const scripts = readPackage(META_PACKAGE).scripts;

    for (const name of SIBLING_PACKAGES) {
      expect(scripts["build:siblings"]).toContain(`npm --prefix ../${name} run build`);
    }
    expect(scripts.prepack).toContain("npm run build:siblings");
    expect(scripts.prepack).toContain("npm install --install-links");
    expect(scripts.prepack).toContain("npm run sync:bundled-packages");
    expect(scripts["sync:bundled-packages"]).toBe("node scripts/sync-bundled-packages.mjs");
  });

  it("loads only non-overlapping sibling skill paths", () => {
    const pkg = readPackage(META_PACKAGE);

    expect(pkg.pi.skills).toEqual([
      "./node_modules/agent-booster-pack-skills/skills",
      "./node_modules/agent-booster-pack-contract-first/skills/contract-first",
      "./node_modules/agent-booster-pack-proof/skills/proof",
      "./node_modules/agent-booster-pack-specify/skills/specify",
    ]);
  });

  it("has a bundled package sync script", () => {
    const text = readFileSync(join(META_PACKAGE, "scripts/sync-bundled-packages.mjs"), "utf8");

    for (const name of SIBLING_PACKAGES) {
      expect(text).toContain(name);
    }
    expect(text).toContain('"package.json"');
    expect(text).toContain("packageJson.files");
    expect(text).toContain("node_modules");
  });
});
