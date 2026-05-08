"""Behavior tests for the Pi package npm publish script."""

from __future__ import annotations

import json
import os
import shlex
import subprocess
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "scripts" / "publish-pi-packages.sh"

PACKAGE_DIRS = [
    "agent-booster-pack-skills",
    "agent-booster-pack-contract-first",
    "agent-booster-pack-proof",
    "agent-booster-pack-whiteboard",
    "agent-booster-pack",
]


def write_package(root: Path, package_dir: str, version: str) -> None:
    path = root / package_dir
    path.mkdir(parents=True)
    (path / "package.json").write_text(
        json.dumps({"name": package_dir, "version": version}), encoding="utf-8"
    )


def write_stub(path: Path, content: str) -> None:
    path.write_text(content, encoding="utf-8")
    path.chmod(0o755)


def make_repo(tmp_path: Path, *, dirty: bool = False, exact_tag: bool = True) -> Path:
    root = tmp_path / "repo"
    root.mkdir()
    versions = {
        "agent-booster-pack-skills": "5.1.0",
        "agent-booster-pack-contract-first": "1.0.0",
        "agent-booster-pack-proof": "2.0.0",
        "agent-booster-pack-whiteboard": "1.0.0",
        "agent-booster-pack": "5.1.0",
    }
    for package_dir, version in versions.items():
        write_package(root, package_dir, version)

    bin_dir = tmp_path / "bin"
    bin_dir.mkdir()
    log = tmp_path / "commands.log"
    published_path = shlex.quote(str(tmp_path / "published.txt"))
    log_path = shlex.quote(str(log))
    root_path = shlex.quote(str(root))
    dirty_command = "printf 'dirty\\n'" if dirty else ":"
    points_at_command = "printf 'v5.1.0\\n'" if exact_tag else ":"

    write_stub(
        bin_dir / "git",
        f"""#!/usr/bin/env bash
set -euo pipefail
printf 'git %s\\n' "$*" >> {log_path}
case "$*" in
  'rev-parse --show-toplevel') printf '%s\\n' {root_path} ;;
  'status --porcelain') {dirty_command} ;;
  'tag --points-at HEAD') {points_at_command} ;;
  'describe --tags --match v[0-9]*.[0-9]*.[0-9]* --abbrev=0') printf 'v5.1.0\\n' ;;
  *) exit 0 ;;
esac
""",
    )
    write_stub(
        bin_dir / "npm",
        f"""#!/usr/bin/env bash
set -euo pipefail
printf 'npm %s\\n' "$*" >> {log_path}
case "$1" in
  whoami) printf 'tester\\n' ;;
  view)
    case "$2" in
      agent-booster-pack-contract-first@1.0.0|agent-booster-pack-proof@2.0.0)
        printf '%s\\n' "${{2##*@}}" ;;
      *) grep -Fxq "$2" {published_path} 2>/dev/null && printf '%s\\n' "${{2##*@}}" || exit 1 ;;
    esac ;;
  publish)
    node -e 'const fs = require("fs"); const pkg = JSON.parse(fs.readFileSync(process.argv[1] + "/package.json", "utf8")); console.log(pkg.name + "@" + pkg.version);' "$2" >> {published_path}
    printf 'published %s\\n' "$2" ;;
  *) exit 0 ;;
esac
""",
    )
    return root


def run_script(
    tmp_path: Path, root: Path, *args: str
) -> subprocess.CompletedProcess[str]:
    env = os.environ.copy()
    env["PATH"] = f"{tmp_path / 'bin'}:{env['PATH']}"
    return subprocess.run(
        ["bash", str(SCRIPT), *args],
        cwd=root,
        env=env,
        capture_output=True,
        text=True,
        check=False,
    )


def command_log(tmp_path: Path) -> str:
    return (tmp_path / "commands.log").read_text(encoding="utf-8")


def test_no_args_publishes_missing_pi_packages_in_dependency_order(tmp_path: Path):
    root = make_repo(tmp_path)

    result = run_script(tmp_path, root)

    assert result.returncode == 0, result.stderr
    log = command_log(tmp_path)
    publish_lines = [
        line for line in log.splitlines() if line.startswith("npm publish")
    ]
    assert publish_lines == [
        "npm publish ./agent-booster-pack-skills --access public",
        "npm publish ./agent-booster-pack-whiteboard --access public",
        "npm publish ./agent-booster-pack --access public",
    ]
    assert "agent-booster-pack-contract-first" not in "\n".join(publish_lines)
    assert "agent-booster-pack-proof" not in "\n".join(publish_lines)


def test_dry_run_reports_missing_packages_without_publishing(tmp_path: Path):
    root = make_repo(tmp_path)

    result = run_script(tmp_path, root, "--dry-run")

    assert result.returncode == 0, result.stderr
    assert "would publish agent-booster-pack-skills@5.1.0" in result.stdout
    assert "would publish agent-booster-pack-whiteboard@1.0.0" in result.stdout
    assert "would publish agent-booster-pack@5.1.0" in result.stdout
    assert "npm publish" not in command_log(tmp_path)


def test_publish_waits_until_each_published_version_is_visible(tmp_path: Path):
    root = make_repo(tmp_path)

    result = run_script(tmp_path, root)

    assert result.returncode == 0, result.stderr
    lines = command_log(tmp_path).splitlines()
    skills_publish = lines.index("npm publish ./agent-booster-pack-skills --access public")
    skills_confirm = lines.index(
        "npm view agent-booster-pack-skills@5.1.0 version", skills_publish + 1
    )
    whiteboard_publish = lines.index(
        "npm publish ./agent-booster-pack-whiteboard --access public"
    )
    whiteboard_confirm = lines.index(
        "npm view agent-booster-pack-whiteboard@1.0.0 version", whiteboard_publish + 1
    )
    meta_publish = lines.index("npm publish ./agent-booster-pack --access public")
    assert skills_publish < skills_confirm < whiteboard_publish
    assert whiteboard_publish < whiteboard_confirm < meta_publish


def test_publish_allows_clean_commits_after_the_release_tag(tmp_path: Path):
    root = make_repo(tmp_path, exact_tag=False)

    result = run_script(tmp_path, root)

    assert result.returncode == 0, result.stderr
    assert "npm publish ./agent-booster-pack-skills --access public" in command_log(
        tmp_path
    )


def test_publish_refuses_dirty_working_tree_before_npm_publish(tmp_path: Path):
    root = make_repo(tmp_path, dirty=True)

    result = run_script(tmp_path, root)

    assert result.returncode != 0
    assert "working tree is not clean" in result.stderr
    assert "npm publish" not in command_log(tmp_path)
