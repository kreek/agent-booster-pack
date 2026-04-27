"""Behavior tests for the skill anatomy validator CLI."""

from __future__ import annotations

import json
import shutil
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

## Tripwires

| Trigger | Do this instead | False alarm |
|---|---|---|
| "Should work" | Run the check. | Research notes that do not claim completion. |
"""

BAD_SKILL = """---
name: bad
description: Bad test skill
---

# Bad

Per Rich Hickey, prefer values over places.

## Overview

Stuff.

## Common Rationalizations

| Excuse | Reality |
|---|---|
| "Should work" | It might not. |

## Red Flags

- "Probably fine"
"""

BAD_TRIPWIRES_SKILL = """---
name: bad-tripwires
description: Bad tripwire table
---

# Bad Tripwires

## When to Use

- trigger

## When NOT to Use

- other

## Verification

- [ ] check

## Tripwires

| Trigger | Action |
|---|---|
| "Should work" | Run the check. |
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


def make_codex_plugin_package(
    root: Path,
    *,
    include_marketplace: bool = True,
    include_manifest: bool = True,
    marketplace_source_path: str = "./plugin",
    include_policy: bool = True,
    include_category: bool = True,
    manifest_skills_path: str = "./skills/",
) -> None:
    """Create Codex plugin metadata fixtures under a repository root."""
    if include_marketplace:
        plugin_entry: dict[str, object] = {
            "name": "abp",
            "source": {
                "source": "local",
                "path": marketplace_source_path,
            },
        }
        if include_policy:
            plugin_entry["policy"] = {
                "installation": "AVAILABLE",
                "authentication": "ON_INSTALL",
            }
        if include_category:
            plugin_entry["category"] = "Coding"

        marketplace = {
            "name": "abp",
            "interface": {
                "displayName": "Agent Booster Pack",
            },
            "plugins": [plugin_entry],
        }
        marketplace_path = root / ".agents" / "plugins" / "marketplace.json"
        marketplace_path.parent.mkdir(parents=True, exist_ok=True)
        marketplace_path.write_text(json.dumps(marketplace), encoding="utf-8")

    if include_manifest:
        manifest = {
            "name": "abp",
            "version": "2.0.0",
            "skills": manifest_skills_path,
            "interface": {
                "displayName": "Agent Booster Pack",
                "category": "Coding",
                "capabilities": ["Read", "Write"],
                "defaultPrompt": [
                    "Use ABP workflow for this engineering task.",
                ],
            },
        }
        manifest_path = root / "plugin" / ".codex-plugin" / "plugin.json"
        manifest_path.parent.mkdir(parents=True, exist_ok=True)
        manifest_path.write_text(json.dumps(manifest), encoding="utf-8")

        claude_marketplace = {
            "name": "abp",
            "metadata": {
                "version": "2.0.0",
            },
            "plugins": [
                {
                    "name": "abp",
                    "version": "2.0.0",
                    "source": "./plugin",
                }
            ],
        }
        claude_marketplace_path = root / ".claude-plugin" / "marketplace.json"
        claude_marketplace_path.parent.mkdir(parents=True, exist_ok=True)
        claude_marketplace_path.write_text(
            json.dumps(claude_marketplace), encoding="utf-8"
        )


def describe_validate_skill_anatomy_cli():
    def it_runs_its_self_test_successfully():
        result = run_script("--self-test")

        assert result.returncode == 0
        assert result.stdout.strip() == "self-test ok"

    def it_passes_when_skill_anatomy_and_plugin_mirror_are_valid(tmp_path: Path):
        skills_dir = tmp_path / "agents" / ".agents" / "skills"
        make_skill(skills_dir, "good")
        plugin_skills = tmp_path / "plugin" / "skills"
        plugin_skills.mkdir(parents=True)
        shutil.copytree(skills_dir / "good", plugin_skills / "good")
        make_codex_plugin_package(tmp_path)

        result = run_script(skills_dir)

        assert result.returncode == 0
        assert "all skills conform to the anatomy" in result.stdout
        assert "plugin/ skill mirror in sync with source" in result.stdout
        assert "codex plugin package valid" in result.stdout
        assert (plugin_skills / "good" / "SKILL.md").read_text(encoding="utf-8") == (
            skills_dir / "good" / "SKILL.md"
        ).read_text(encoding="utf-8")

    def it_reports_skill_anatomy_findings(tmp_path: Path):
        skills_dir = tmp_path / "agents" / ".agents" / "skills"
        make_skill(skills_dir, "bad", BAD_SKILL)

        result = run_script(skills_dir)

        assert result.returncode == 1
        assert "bad/SKILL.md" in result.stdout
        assert "missing section: ## When to Use" in result.stdout
        assert "missing section: ## Verification" in result.stdout
        assert "inline 'per <expert>' attribution found" in result.stdout
        assert "obsolete section: ## Common Rationalizations" in result.stdout
        assert "obsolete section: ## Red Flags" in result.stdout
        assert "obsolete table header" in result.stdout
        assert "1 skill(s) failed anatomy validation" in result.stdout

    def it_requires_tripwire_tables_to_use_the_standard_columns(tmp_path: Path):
        skills_dir = tmp_path / "agents" / ".agents" / "skills"
        make_skill(skills_dir, "bad-tripwires", BAD_TRIPWIRES_SKILL)

        result = run_script(skills_dir)

        assert result.returncode == 1
        assert "bad-tripwires/SKILL.md" in result.stdout
        assert "Tripwires table must use" in result.stdout

    def it_reports_plugin_drift_when_a_skill_mirror_is_missing(tmp_path: Path):
        skills_dir = tmp_path / "agents" / ".agents" / "skills"
        make_skill(skills_dir, "good")
        (tmp_path / "plugin" / "skills").mkdir(parents=True)
        make_codex_plugin_package(tmp_path)

        result = run_script(skills_dir)

        assert result.returncode == 1
        assert "all skills conform to the anatomy" in result.stdout
        assert "plugin drift:" in result.stdout
        assert "plugin/skills/good missing" in result.stdout
        assert "1 plugin mirror difference(s) found" in result.stdout

    def it_reports_missing_codex_marketplace_when_plugin_exists(tmp_path: Path):
        skills_dir = tmp_path / "agents" / ".agents" / "skills"
        make_skill(skills_dir, "good")
        plugin_skills = tmp_path / "plugin" / "skills"
        plugin_skills.mkdir(parents=True)
        shutil.copytree(skills_dir / "good", plugin_skills / "good")
        make_codex_plugin_package(tmp_path, include_marketplace=False)

        result = run_script(skills_dir)

        assert result.returncode == 1
        assert "codex plugin:" in result.stdout
        assert "missing" in result.stdout
        assert ".agents/plugins/marketplace.json" in result.stdout

    def it_reports_wrong_codex_marketplace_source_path(tmp_path: Path):
        skills_dir = tmp_path / "agents" / ".agents" / "skills"
        make_skill(skills_dir, "good")
        plugin_skills = tmp_path / "plugin" / "skills"
        plugin_skills.mkdir(parents=True)
        shutil.copytree(skills_dir / "good", plugin_skills / "good")
        make_codex_plugin_package(tmp_path, marketplace_source_path="./plugins/abp")

        result = run_script(skills_dir)

        assert result.returncode == 1
        assert "abp.source.path must be './plugin'" in result.stdout

    def it_reports_missing_codex_marketplace_policy_and_category(tmp_path: Path):
        skills_dir = tmp_path / "agents" / ".agents" / "skills"
        make_skill(skills_dir, "good")
        plugin_skills = tmp_path / "plugin" / "skills"
        plugin_skills.mkdir(parents=True)
        shutil.copytree(skills_dir / "good", plugin_skills / "good")
        make_codex_plugin_package(
            tmp_path,
            include_policy=False,
            include_category=False,
        )

        result = run_script(skills_dir)

        assert result.returncode == 1
        assert "abp.policy must be an object" in result.stdout
        assert "abp.category must be 'Coding'" in result.stdout

    def it_reports_wrong_codex_manifest_skills_path(tmp_path: Path):
        skills_dir = tmp_path / "agents" / ".agents" / "skills"
        make_skill(skills_dir, "good")
        plugin_skills = tmp_path / "plugin" / "skills"
        plugin_skills.mkdir(parents=True)
        shutil.copytree(skills_dir / "good", plugin_skills / "good")
        make_codex_plugin_package(tmp_path, manifest_skills_path="./not-skills/")

        result = run_script(skills_dir)

        assert result.returncode == 1
        assert "skills must be './skills/'" in result.stdout

    def it_rejects_paths_that_are_not_skill_directories(tmp_path: Path):
        missing_dir = tmp_path / "missing"

        result = run_script(missing_dir)

        assert result.returncode == 2
        assert f"not a directory: {missing_dir}" in result.stderr
