"""Behavior tests for the ABP pre-commit acceptance gate."""

from __future__ import annotations

import subprocess
import sys
import importlib.util
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "scripts" / "pre_commit_acceptance.py"
SPEC = importlib.util.spec_from_file_location("pre_commit_acceptance", SCRIPT)
assert SPEC is not None
gate = importlib.util.module_from_spec(SPEC)
assert SPEC.loader is not None
sys.modules[SPEC.name] = gate
SPEC.loader.exec_module(gate)


def command_strings(paths: list[Path]) -> list[str]:
    """Return selected commands as readable strings."""
    return [gate.format_command(check.command) for check in gate.select_checks(paths)]


def run_script(*args: str | Path) -> subprocess.CompletedProcess[str]:
    """Run the pre-commit gate through its command-line boundary."""
    return subprocess.run(
        [sys.executable, str(SCRIPT), *(str(arg) for arg in args)],
        cwd=ROOT,
        capture_output=True,
        text=True,
        check=False,
    )


def describe_pre_commit_acceptance_command_selection():
    def it_always_checks_the_staged_diff():
        commands = command_strings([Path("README.md")])

        assert "git diff --cached --check" in commands

    def it_checks_skill_anatomy_for_skill_and_agent_instruction_changes():
        commands = command_strings(
            [
                Path("agents/.agents/skills/proof/SKILL.md"),
                Path("agents/AGENTS.md"),
                Path("plugin/skills/proof"),
            ]
        )

        assert "uv run python scripts/validate_skill_anatomy.py" in commands

    def it_checks_markdown_links_for_markdown_changes():
        commands = command_strings([Path("README.md")])

        assert "uv run refcheck . --no-color" in commands

    def it_checks_python_tests_formatting_and_lint_for_python_changes():
        commands = command_strings([Path("scripts/pre_commit_acceptance.py")])

        assert "uv run pytest" in commands
        assert "uv run ruff format --check ." in commands
        assert "uv run ruff check ." in commands

    def it_checks_shell_scripts_with_shellcheck_and_shfmt():
        commands = command_strings([Path("setup.sh"), Path(".githooks/pre-commit")])

        assert "shellcheck setup.sh .githooks/pre-commit" in commands
        assert "shfmt -d setup.sh .githooks/pre-commit" in commands


def describe_pre_commit_acceptance_cli():
    def it_blocks_commits_on_main_or_master(tmp_path: Path):
        subprocess.run(["git", "init", "-b", "main"], cwd=tmp_path, check=True)

        result = run_script("--repo-root", tmp_path, "--dry-run")

        assert result.returncode == 1
        assert "refusing to commit directly on main" in result.stderr

    def it_reports_no_staged_files_on_topic_branches(tmp_path: Path):
        subprocess.run(["git", "init", "-b", "chore/test"], cwd=tmp_path, check=True)

        result = run_script("--repo-root", tmp_path, "--dry-run")

        assert result.returncode == 0
        assert "No staged files; nothing to validate." in result.stdout
