"""Behavior tests for setup.sh."""

from __future__ import annotations

import os
import pty
import select
import shutil
import subprocess
from pathlib import Path
from typing import Optional


ROOT = Path(__file__).resolve().parents[1]
SETUP = ROOT / "setup.sh"


def run_setup(
    home: Path,
    *args: str,
    path: Optional[str] = None,
) -> subprocess.CompletedProcess[str]:
    env = os.environ.copy()
    env["HOME"] = str(home)
    # Keep maintainer-only uv plugin sync out of setup.sh tests; the
    # script's home-directory link behavior is what these tests cover.
    env["PATH"] = path or f"{home / 'bin'}:/usr/bin:/bin"
    return subprocess.run(
        ["/bin/bash", str(SETUP), *args],
        cwd=ROOT,
        env=env,
        capture_output=True,
        text=True,
        check=False,
    )


def run_setup_interactively(
    home: Path,
    answers: str,
    path: Optional[str] = None,
) -> subprocess.CompletedProcess[str]:
    env = os.environ.copy()
    env["HOME"] = str(home)
    env["PATH"] = path or f"{home / 'bin'}:/usr/bin:/bin"

    master, slave = pty.openpty()
    process = subprocess.Popen(
        ["/bin/bash", str(SETUP)],
        cwd=ROOT,
        env=env,
        stdin=slave,
        stdout=slave,
        stderr=slave,
        close_fds=True,
    )
    os.close(slave)
    os.write(master, answers.encode("utf-8"))

    output = bytearray()
    while True:
        ready, _, _ = select.select([master], [], [], 0.1)
        if ready:
            try:
                chunk = os.read(master, 4096)
            except OSError:
                break
            if not chunk:
                break
            output.extend(chunk)
        if process.poll() is not None:
            while True:
                ready, _, _ = select.select([master], [], [], 0)
                if not ready:
                    break
                try:
                    chunk = os.read(master, 4096)
                except OSError:
                    break
                if not chunk:
                    break
                output.extend(chunk)
            break

    return_code = process.wait(timeout=5)
    os.close(master)
    return subprocess.CompletedProcess(
        args=["/bin/bash", str(SETUP)],
        returncode=return_code,
        stdout=output.decode("utf-8", errors="replace"),
        stderr="",
    )


def create_fake_stow(home: Path) -> None:
    bin_dir = home / "bin"
    bin_dir.mkdir()
    stow = bin_dir / "stow"
    stow.write_text(
        """#!/bin/sh
set -eu
target=
while [ "$#" -gt 0 ]; do
  case "$1" in
    --target=*) target=${1#--target=} ;;
    --target) shift; target=$1 ;;
  esac
  shift || true
done
if [ -z "$target" ]; then
  echo "missing --target" >&2
  exit 2
fi
mkdir -p "$target/.agents/skills/testing" "$target/.agents/commands"
printf '%s\\n' '---' 'name: testing' '---' > "$target/.agents/skills/testing/SKILL.md"
echo "LINK: .agents => test fixture"
""",
        encoding="utf-8",
    )
    stow.chmod(0o755)


def create_minimal_path_without_stow(home: Path) -> Path:
    bin_dir = home / "empty-bin"
    bin_dir.mkdir()
    for command in ("cat", "dirname"):
        source = shutil.which(command)
        assert source is not None
        (bin_dir / command).symlink_to(source)
    return bin_dir


def describe_setup_sh_preflight():
    def it_explains_missing_stow_without_touching_files(tmp_path: Path):
        personal = tmp_path / "AGENTS.md"
        personal.write_text("# Personal\n\nDo not touch.\n", encoding="utf-8")
        before = personal.read_text(encoding="utf-8")
        before_mtime = personal.stat().st_mtime_ns
        empty_bin = create_minimal_path_without_stow(tmp_path)

        result = run_setup(tmp_path, path=str(empty_bin))

        assert result.returncode == 1
        assert personal.read_text(encoding="utf-8") == before
        assert personal.stat().st_mtime_ns == before_mtime
        assert "uv run" not in result.stderr
        assert "GNU Stow is required" in result.stderr
        assert "brew install stow" in result.stderr
        assert not (tmp_path / ".agents").exists()

    def it_requires_confirmation_before_running_stow_or_touching_files(
        tmp_path: Path,
    ):
        create_fake_stow(tmp_path)

        result = run_setup(tmp_path)

        assert result.returncode == 1
        assert "ABP setup will:" in result.stdout
        assert "run GNU Stow" in result.stdout
        assert "Setup cancelled." in result.stdout
        assert not (tmp_path / ".agents").exists()
        assert not (tmp_path / ".claude" / "skills").exists()
        assert not (tmp_path / ".codex" / "skills").exists()


def describe_setup_sh_confirmation():
    def it_links_skills_after_interactive_confirmation(tmp_path: Path):
        create_fake_stow(tmp_path)
        (tmp_path / ".codex").mkdir()

        result = run_setup_interactively(tmp_path, "y\n")

        assert result.returncode == 0
        assert (tmp_path / ".agents" / "skills" / "testing" / "SKILL.md").exists()
        assert (tmp_path / ".claude" / "skills").is_symlink()
        assert (tmp_path / ".codex" / "skills" / "testing").is_symlink()

    def it_does_not_replace_conflicting_symlinks_without_interactive_confirmation(
        tmp_path: Path,
    ):
        create_fake_stow(tmp_path)
        other = tmp_path / "other-skills" / "testing"
        other.mkdir(parents=True)
        target_dir = tmp_path / ".codex" / "skills"
        target_dir.mkdir(parents=True)
        conflict = target_dir / "testing"
        conflict.symlink_to(other)

        result = run_setup_interactively(tmp_path, "y\nn\nn\n")

        assert result.returncode == 0
        assert "is a symlink to" in result.stdout
        assert conflict.readlink() == other

    def it_does_not_move_real_directories_without_interactive_confirmation(
        tmp_path: Path,
    ):
        create_fake_stow(tmp_path)
        target = tmp_path / ".codex" / "skills" / "testing"
        target.mkdir(parents=True)
        marker = target / "local.md"
        marker.write_text("personal skill\n", encoding="utf-8")

        result = run_setup_interactively(tmp_path, "y\nn\nn\n")

        assert result.returncode == 0
        assert "exists as a real directory" in result.stdout
        assert marker.read_text(encoding="utf-8") == "personal skill\n"
