import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { cleanupTempDir, makeTempDir, ROOT, run, shellQuote, writeExecutable } from "./helpers.mjs";

const SCRIPT = join(ROOT, "scripts/publish-pi-packages.sh");
const VERSIONS = {
  "agent-booster-pack-skills": "5.1.0",
  "agent-booster-pack-contract-first": "1.0.0",
  "agent-booster-pack-proof": "2.0.0",
  "agent-booster-pack-technical-design": "1.0.0",
  "agent-booster-pack": "5.1.0",
};

let tmp;

function writePackage(root, packageDir, version) {
  const path = join(root, packageDir);
  mkdirSync(path, { recursive: true });
  writeFileSync(join(path, "package.json"), JSON.stringify({ name: packageDir, version }), "utf8");
}

function makeRepo({ dirty = false, exactTag = true } = {}) {
  const root = join(tmp, "repo");
  mkdirSync(root);
  for (const [packageDir, version] of Object.entries(VERSIONS)) {
    writePackage(root, packageDir, version);
  }

  const binDir = join(tmp, "bin");
  mkdirSync(binDir);
  const log = join(tmp, "commands.log");
  const publishedPath = shellQuote(join(tmp, "published.txt"));
  const logPath = shellQuote(log);
  const rootPath = shellQuote(root);
  const dirtyCommand = dirty ? "printf 'dirty\\n'" : ":";
  const pointsAtCommand = exactTag ? "printf 'v5.1.0\\n'" : ":";

  writeExecutable(
    join(binDir, "git"),
    `#!/usr/bin/env bash
set -euo pipefail
printf 'git %s\\n' "$*" >> ${logPath}
case "$*" in
  'rev-parse --show-toplevel') printf '%s\\n' ${rootPath} ;;
  'status --porcelain') ${dirtyCommand} ;;
  'tag --points-at HEAD') ${pointsAtCommand} ;;
  'describe --tags --match v[0-9]*.[0-9]*.[0-9]* --abbrev=0') printf 'v5.1.0\\n' ;;
  *) exit 0 ;;
esac
`,
  );
  writeExecutable(
    join(binDir, "npm"),
    `#!/usr/bin/env bash
set -euo pipefail
printf 'npm %s\\n' "$*" >> ${logPath}
case "$1" in
  whoami) printf 'tester\\n' ;;
  view)
    case "$2" in
      agent-booster-pack-contract-first@1.0.0|agent-booster-pack-proof@2.0.0)
        printf '%s\\n' "\${2##*@}" ;;
      *) grep -Fxq "$2" ${publishedPath} 2>/dev/null && printf '%s\\n' "\${2##*@}" || exit 1 ;;
    esac ;;
  publish)
    node -e 'const fs = require("fs"); const pkg = JSON.parse(fs.readFileSync(process.argv[1] + "/package.json", "utf8")); console.log(pkg.name + "@" + pkg.version);' "$2" >> ${publishedPath}
    printf 'published %s\\n' "$2" ;;
  *) exit 0 ;;
esac
`,
  );
  return root;
}

function runScript(root, ...args) {
  return run("bash", [SCRIPT, ...args], {
    cwd: root,
    env: { ...process.env, PATH: `${join(tmp, "bin")}:${process.env.PATH}` },
  });
}

function commandLog() {
  return readFileSync(join(tmp, "commands.log"), "utf8");
}

describe("Pi package npm publish script", () => {
  afterEach(() => {
    if (tmp) cleanupTempDir(tmp);
    tmp = undefined;
  });

  it("publishes missing Pi packages in dependency order", () => {
    tmp = makeTempDir();
    const root = makeRepo();

    const result = runScript(root);

    expect(result.status).toBe(0);
    const publishLines = commandLog()
      .split(/\r?\n/)
      .filter((line) => line.startsWith("npm publish"));
    expect(publishLines).toEqual([
      "npm publish ./agent-booster-pack-skills --access public",
      "npm publish ./agent-booster-pack-technical-design --access public",
      "npm publish ./agent-booster-pack --access public",
    ]);
    expect(publishLines.join("\n")).not.toContain("agent-booster-pack-contract-first");
    expect(publishLines.join("\n")).not.toContain("agent-booster-pack-proof");
  });

  it("dry-run reports missing packages without publishing", () => {
    tmp = makeTempDir();
    const root = makeRepo();

    const result = runScript(root, "--dry-run");

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("would publish agent-booster-pack-skills@5.1.0");
    expect(result.stdout).toContain("would publish agent-booster-pack-technical-design@1.0.0");
    expect(result.stdout).toContain("would publish agent-booster-pack@5.1.0");
    expect(commandLog()).not.toContain("npm publish");
  });

  it("waits until each published version is visible", () => {
    tmp = makeTempDir();
    const root = makeRepo();

    const result = runScript(root);

    expect(result.status).toBe(0);
    const lines = commandLog().split(/\r?\n/);
    const skillsPublish = lines.indexOf("npm publish ./agent-booster-pack-skills --access public");
    const skillsConfirm = lines.indexOf("npm view agent-booster-pack-skills@5.1.0 version", skillsPublish + 1);
    const technicalDesignPublish = lines.indexOf("npm publish ./agent-booster-pack-technical-design --access public");
    const technicalDesignConfirm = lines.indexOf(
      "npm view agent-booster-pack-technical-design@1.0.0 version",
      technicalDesignPublish + 1,
    );
    const metaPublish = lines.indexOf("npm publish ./agent-booster-pack --access public");
    expect(skillsPublish).toBeLessThan(skillsConfirm);
    expect(skillsConfirm).toBeLessThan(technicalDesignPublish);
    expect(technicalDesignPublish).toBeLessThan(technicalDesignConfirm);
    expect(technicalDesignConfirm).toBeLessThan(metaPublish);
  });

  it("allows clean commits after the release tag", () => {
    tmp = makeTempDir();
    const root = makeRepo({ exactTag: false });

    const result = runScript(root);

    expect(result.status).toBe(0);
    expect(commandLog()).toContain("npm publish ./agent-booster-pack-skills --access public");
  });

  it("refuses dirty working trees before npm publish", () => {
    tmp = makeTempDir();
    const root = makeRepo({ dirty: true });

    const result = runScript(root);

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("working tree is not clean");
    expect(commandLog()).not.toContain("npm publish");
  });
});
