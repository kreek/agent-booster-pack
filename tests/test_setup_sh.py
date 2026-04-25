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
import subprocess
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SETUP = ROOT / "setup.sh"


def run_setup(home: Path) -> subprocess.CompletedProcess[str]:
    env = os.environ.copy()
    env["HOME"] = str(home)
    return subprocess.run(
        ["bash", str(SETUP)],
        cwd=ROOT,
        env=env,
        capture_output=True,
        text=True,
        check=False,
    )


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
        assert "Run 'stow agents'" in result.stderr

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
