import {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readlinkSync,
  statSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { cleanupTempDir, makeTempDir, ROOT, run, writeExecutable } from "./helpers.mjs";

const SETUP = join(ROOT, "setup.sh");
let tmp;

function runSetup(home, args = [], { path } = {}) {
  return run("/bin/bash", [SETUP, ...args], {
    cwd: ROOT,
    env: {
      ...process.env,
      HOME: home,
      PATH: path ?? `${join(home, "bin")}:/usr/bin:/bin`,
    },
  });
}

function runSetupInteractively(home, answers, { path } = {}) {
  const script = `
set timeout 5
spawn -noecho /bin/bash ${SETUP}
send ${JSON.stringify(answers.replaceAll("\n", "\r"))}
expect eof
catch wait result
exit [lindex $result 3]
`;
  return run("expect", ["-c", script], {
    cwd: ROOT,
    env: {
      ...process.env,
      HOME: home,
      PATH: path ?? `${join(home, "bin")}:/usr/bin:/bin`,
    },
  });
}

function createFakeStow(home) {
  const binDir = join(home, "bin");
  mkdirSync(binDir, { recursive: true });
  writeExecutable(
    join(binDir, "stow"),
    `#!/bin/sh
set -eu
target=
while [ "$#" -gt 0 ]; do
  case "$1" in
    --target=*) target=\${1#--target=} ;;
    --target) shift; target=$1 ;;
  esac
  shift || true
done
if [ -z "$target" ]; then
  echo "missing --target" >&2
  exit 2
fi
mkdir -p "$target/.agents/skills/testing"
printf '%s\\n' '---' 'name: testing' '---' > "$target/.agents/skills/testing/SKILL.md"
echo "LINK: .agents => test fixture"
`,
  );
}

describe("setup.sh preflight", () => {
  afterEach(() => {
    if (tmp) cleanupTempDir(tmp);
    tmp = undefined;
  });

  it("explains missing stow without touching files", () => {
    tmp = makeTempDir();
    const personal = join(tmp, "AGENTS.md");
    writeFileSync(personal, "# Personal\n\nDo not touch.\n", "utf8");
    const before = readFileSync(personal, "utf8");
    const beforeMtime = statSync(personal).mtimeNs;

    const result = runSetup(tmp, [], { path: "/usr/bin:/bin" });

    expect(result.status).toBe(1);
    expect(readFileSync(personal, "utf8")).toBe(before);
    expect(statSync(personal).mtimeNs).toBe(beforeMtime);
    expect(result.stderr).not.toContain("uv run");
    expect(result.stderr).toContain("GNU Stow is required");
    expect(result.stderr).toContain("brew install stow");
    expect(existsSync(join(tmp, ".agents"))).toBe(false);
  });

  it("requires confirmation before running stow or touching files", () => {
    tmp = makeTempDir();
    createFakeStow(tmp);

    const result = runSetup(tmp);

    expect(result.status).toBe(1);
    expect(result.stdout).toContain("ABP setup will:");
    expect(result.stdout).toContain("run GNU Stow");
    expect(result.stdout).toContain("Setup cancelled.");
    expect(existsSync(join(tmp, ".agents"))).toBe(false);
    expect(existsSync(join(tmp, ".claude/skills"))).toBe(false);
    expect(existsSync(join(tmp, ".codex/skills"))).toBe(false);
  });
});

describe("setup.sh confirmation", () => {
  afterEach(() => {
    if (tmp) cleanupTempDir(tmp);
    tmp = undefined;
  });

  it("links skills after interactive confirmation", () => {
    tmp = makeTempDir();
    createFakeStow(tmp);
    mkdirSync(join(tmp, ".codex"), { recursive: true });

    const result = runSetupInteractively(tmp, "y\n");

    expect(result.status).toBe(0);
    expect(existsSync(join(tmp, ".agents/skills/testing/SKILL.md"))).toBe(true);
    expect(lstatSync(join(tmp, ".claude/skills")).isSymbolicLink()).toBe(true);
    expect(lstatSync(join(tmp, ".codex/skills/testing")).isSymbolicLink()).toBe(true);
  });

  it("does not replace conflicting symlinks without interactive confirmation", () => {
    tmp = makeTempDir();
    createFakeStow(tmp);
    const other = join(tmp, "other-skills/testing");
    mkdirSync(other, { recursive: true });
    const targetDir = join(tmp, ".codex/skills");
    mkdirSync(targetDir, { recursive: true });
    const conflict = join(targetDir, "testing");
    symlinkSync(other, conflict);

    const result = runSetupInteractively(tmp, "y\nn\nn\n");

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("is a symlink to");
    expect(readlinkSync(conflict)).toBe(other);
  });

  it("does not move real directories without interactive confirmation", () => {
    tmp = makeTempDir();
    createFakeStow(tmp);
    const target = join(tmp, ".codex/skills/testing");
    mkdirSync(target, { recursive: true });
    const marker = join(target, "local.md");
    writeFileSync(marker, "personal skill\n", "utf8");

    const result = runSetupInteractively(tmp, "y\nn\nn\n");

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("exists as a real directory");
    expect(readFileSync(marker, "utf8")).toBe("personal skill\n");
  });
});
