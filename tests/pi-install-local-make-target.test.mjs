import { existsSync, lstatSync, mkdirSync, readFileSync, symlinkSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { cleanupTempDir, makeTempDir, ROOT, run, writeExecutable } from "./helpers.mjs";

let tmp;

function makeFakeBin(home) {
  const bin = join(home, "bin");
  mkdirSync(bin, { recursive: true });
  writeExecutable(
    join(bin, "npm"),
    `#!/bin/sh
set -eu
printf '%s\n' "$*" >> "$HOME/npm.log"
if [ "$1" = "--prefix" ] && [ "$3" = "run" ] && [ "$4" = "prepack" ]; then
  exit 0
fi
if [ "$1" = "run" ] && [ "$2" = "prepack" ]; then
  exit 0
fi
if [ "$1" = "pack" ]; then
  dest=""
  while [ "$#" -gt 0 ]; do
    if [ "$1" = "--pack-destination" ]; then
      shift
      dest="$1"
    fi
    shift || true
  done
  mkdir -p "$dest"
  case "$(pwd)" in
    */agent-booster-pack/agent-booster-pack)
      package_name="agent-booster-pack"
      package_version="9.1.1"
      ;;
    *)
      package_name="agent-booster-pack-repo"
      package_version="0.0.0"
      ;;
  esac
  printf '%s-%s.tgz\n' "$package_name" "$package_version"
  printf 'packed\n' > "$dest/$package_name-$package_version.tgz"
  exit 0
fi
echo "unexpected npm args: $*" >&2
exit 2
`,
  );
  writeExecutable(
    join(bin, "pi"),
    `#!/bin/sh
set -eu
printf '%s\n' "$*" >> "$HOME/pi.log"
case "$2" in
  *.tgz) test -f "$2" ;;
  *) echo "pi install must receive packed tarball, got: $2" >&2; exit 3 ;;
esac
`,
  );
  return bin;
}

describe("pi-install-local make target", () => {
  afterEach(() => {
    if (tmp) cleanupTempDir(tmp);
    tmp = undefined;
  });

  it("installs a locally packed meta-package and prunes conflicting user skill symlinks", () => {
    tmp = makeTempDir();
    const bin = makeFakeBin(tmp);
    const skills = join(tmp, ".agents/skills");
    mkdirSync(join(tmp, "dev/code-review"), { recursive: true });
    mkdirSync(join(tmp, "dev/unrelated"), { recursive: true });
    mkdirSync(skills, { recursive: true });
    symlinkSync(join(tmp, "dev/code-review"), join(skills, "code-review"));
    symlinkSync(join(tmp, "dev/unrelated"), join(skills, "unrelated"));

    const result = run("make", ["pi-install-local"], {
      cwd: ROOT,
      env: { ...process.env, HOME: tmp, PATH: `${bin}:/usr/bin:/bin` },
    });

    expect(result.status).toBe(0);
    const npmLog = readFileSync(join(tmp, "npm.log"), "utf8");
    expect(npmLog).toContain("run prepack");
    expect(npmLog).toContain("pack --ignore-scripts --pack-destination ");
    expect(readFileSync(join(tmp, "pi.log"), "utf8")).toMatch(/^install .*agent-booster-pack-9\.1\.1\.tgz/m);
    expect(existsSync(join(skills, "code-review"))).toBe(false);
    expect(lstatSync(join(skills, "unrelated")).isSymbolicLink()).toBe(true);
  });
});
