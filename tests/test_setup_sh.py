"""Behavior tests for the conflict-detection branch of setup.sh.

The script's main job (fanning out per-agent symlinks) needs a real
stowed install to test end-to-end and is exercised manually. These
tests focus on the narrower, safety-critical promise: when a personal
``~/AGENTS.md`` is what made stow abort, ``setup.sh`` recognises the
state, prints actionable instructions, and exits non-zero without
touching the user's file.
"""

from __future__ import annotations

import os
import pty
import select
import subprocess
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SETUP = ROOT / "setup.sh"


def run_setup(
    home: Path,
    *args: str,
) -> subprocess.CompletedProcess[str]:
    env = os.environ.copy()
    env["HOME"] = str(home)
    # Keep maintainer-only uv plugin sync out of setup.sh tests; the
    # script's home-directory link behavior is what these tests cover.
    env["PATH"] = "/usr/bin:/bin"
    return subprocess.run(
        ["bash", str(SETUP), *args],
        cwd=ROOT,
        env=env,
        capture_output=True,
        text=True,
        check=False,
    )


def run_setup_interactively(
    home: Path,
    answers: str,
) -> subprocess.CompletedProcess[str]:
    env = os.environ.copy()
    env["HOME"] = str(home)
    env["PATH"] = "/usr/bin:/bin"

    master, slave = pty.openpty()
    process = subprocess.Popen(
        ["bash", str(SETUP)],
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
        args=["bash", str(SETUP)],
        returncode=return_code,
        stdout=output.decode("utf-8", errors="replace"),
        stderr="",
    )


def create_stowed_skills(home: Path) -> None:
    skill = home / ".agents" / "skills" / "testing"
    skill.mkdir(parents=True)
    (skill / "SKILL.md").write_text("---\nname: testing\n---\n", encoding="utf-8")


def describe_setup_sh_preflight():
    def it_explains_the_AGENTS_md_conflict_when_stow_has_aborted(tmp_path: Path):
        # Simulate the "stow aborted because ~/AGENTS.md exists" state:
        # a real personal AGENTS.md, no ~/.agents/skills directory.
        personal = tmp_path / "AGENTS.md"
        personal.write_text("# Personal\n\nDo not touch.\n", encoding="utf-8")
        before = personal.read_text(encoding="utf-8")
        before_mtime = personal.stat().st_mtime_ns

        result = run_setup(tmp_path)

        assert result.returncode == 1
        # File the user owns is left untouched.
        assert personal.read_text(encoding="utf-8") == before
        assert personal.stat().st_mtime_ns == before_mtime
        # Stderr explains the manual end-user path without requiring Python tooling.
        assert "personal ~/AGENTS.md" in result.stderr
        assert "System-wide AGENTS.md + skills" in result.stderr
        assert "Skills only" in result.stderr
        assert "Merge the ABP guidance from agents/AGENTS.md" in result.stderr
        assert "uv run" not in result.stderr
        assert "stow --target" in result.stderr

    def it_falls_back_to_the_generic_hint_without_a_personal_AGENTS_md(
        tmp_path: Path,
    ):
        # No ~/AGENTS.md, no ~/.agents/skills — a fresh shell that
        # forgot the stow step. Generic message is fine here.
        result = run_setup(tmp_path)

        assert result.returncode == 1
        assert "personal ~/AGENTS.md" not in result.stderr
        assert "System-wide AGENTS.md + skills" in result.stderr
        assert "Skills only" in result.stderr

    def it_treats_a_symlinked_AGENTS_md_as_already_installed(tmp_path: Path):
        # A symlinked ~/AGENTS.md is the stow install path, not a
        # personal file. Even if .agents/skills is missing for some
        # reason, the conflict branch must not fire (it would be a
        # false alarm).
        link_target = tmp_path / "real.md"
        link_target.write_text("# from stow\n", encoding="utf-8")
        symlink = tmp_path / "AGENTS.md"
        symlink.symlink_to(link_target)

        result = run_setup(tmp_path)

        assert result.returncode == 1
        # We do not mention the personal-file workflow when the file
        # is a symlink, even though .agents/skills is missing.
        assert "personal ~/AGENTS.md" not in result.stderr


def describe_setup_sh_confirmation():
    def it_requires_confirmation_before_touching_links_in_noninteractive_runs(
        tmp_path: Path,
    ):
        create_stowed_skills(tmp_path)
        (tmp_path / ".codex").mkdir()

        result = run_setup(tmp_path)

        assert result.returncode == 1
        assert "ABP setup will:" in result.stdout
        assert "Setup cancelled." in result.stdout
        assert not (tmp_path / ".claude" / "skills").exists()
        assert not (tmp_path / ".codex" / "skills").exists()

    def it_links_skills_after_interactive_confirmation(tmp_path: Path):
        create_stowed_skills(tmp_path)
        (tmp_path / ".codex").mkdir()

        result = run_setup_interactively(tmp_path, "y\nn\n")

        assert result.returncode == 0
        assert (tmp_path / ".claude" / "skills").is_symlink()
        assert (tmp_path / ".codex" / "skills" / "testing").is_symlink()

    def it_does_not_replace_conflicting_symlinks_without_interactive_confirmation(
        tmp_path: Path,
    ):
        create_stowed_skills(tmp_path)
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
        create_stowed_skills(tmp_path)
        target = tmp_path / ".codex" / "skills" / "testing"
        target.mkdir(parents=True)
        marker = target / "local.md"
        marker.write_text("personal skill\n", encoding="utf-8")

        result = run_setup_interactively(tmp_path, "y\nn\nn\n")

        assert result.returncode == 0
        assert "exists as a real directory" in result.stdout
        assert marker.read_text(encoding="utf-8") == "personal skill\n"
