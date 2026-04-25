"""Behavior tests for the skill anatomy validator CLI."""

from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "scripts" / "validate_skill_anatomy.py"

GOOD_SKILL = """---
name: good
description: Good test skill
---

# Good

## When to Use

- trigger
- one change per commit

## When NOT to Use

- other

## Verification

- [ ] check
"""

BAD_SKILL = """---
name: bad
description: Bad test skill
---

# Bad

Per Rich Hickey, prefer values over places.

## Overview

Stuff.
"""


def run_script(*args: str | Path) -> subprocess.CompletedProcess[str]:
    """Run the validator through its command-line boundary."""
    return subprocess.run(
        [sys.executable, str(SCRIPT), *(str(arg) for arg in args)],
        cwd=ROOT,
        capture_output=True,
        text=True,
        check=False,
    )


def make_skill(skills_dir: Path, name: str, body: str = GOOD_SKILL) -> Path:
    """Create a skill fixture under a temporary skills directory."""
    skill = skills_dir / name
    skill.mkdir(parents=True)
    (skill / "SKILL.md").write_text(body, encoding="utf-8")
    return skill


def describe_validate_skill_anatomy_cli():
    def it_runs_its_self_test_successfully():
        result = run_script("--self-test")

        assert result.returncode == 0
        assert result.stdout.strip() == "self-test ok"

    def it_passes_when_skill_anatomy_and_plugin_links_are_valid(tmp_path: Path):
        skills_dir = tmp_path / "agents" / ".agents" / "skills"
        make_skill(skills_dir, "good")
        plugin_skills = tmp_path / "plugin" / "skills"
        plugin_skills.mkdir(parents=True)
        link = plugin_skills / "good"
        link.symlink_to("../../agents/.agents/skills/good")

        result = run_script(skills_dir)

        assert result.returncode == 0
        assert "all skills conform to the anatomy" in result.stdout
        assert "plugin/ symlinks in sync with source" in result.stdout
        assert link.resolve() == (skills_dir / "good").resolve()
        assert os.readlink(link) == "../../agents/.agents/skills/good"

    def it_reports_skill_anatomy_findings(tmp_path: Path):
        skills_dir = tmp_path / "agents" / ".agents" / "skills"
        make_skill(skills_dir, "bad", BAD_SKILL)

        result = run_script(skills_dir)

        assert result.returncode == 1
        assert "bad/SKILL.md" in result.stdout
        assert "missing section: ## When to Use" in result.stdout
        assert "missing section: ## Verification" in result.stdout
        assert "inline 'per <expert>' attribution found" in result.stdout
        assert "1 skill(s) failed anatomy validation" in result.stdout

    def it_reports_plugin_drift_when_a_skill_link_is_missing(tmp_path: Path):
        skills_dir = tmp_path / "agents" / ".agents" / "skills"
        make_skill(skills_dir, "good")
        (tmp_path / "plugin" / "skills").mkdir(parents=True)

        result = run_script(skills_dir)

        assert result.returncode == 1
        assert "all skills conform to the anatomy" in result.stdout
        assert "plugin drift:" in result.stdout
        assert "plugin/skills/good missing" in result.stdout
        assert "1 plugin symlink(s) drifted from source" in result.stdout

    def it_rejects_paths_that_are_not_skill_directories(tmp_path: Path):
        missing_dir = tmp_path / "missing"

        result = run_script(missing_dir)

        assert result.returncode == 2
        assert f"not a directory: {missing_dir}" in result.stderr
