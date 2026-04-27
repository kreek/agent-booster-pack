"""Behavior tests for the plugin skill mirror synchronization CLI."""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "scripts" / "generate_plugin_symlinks.py"


def run_script(*args: Path) -> subprocess.CompletedProcess[str]:
    """Run the plugin mirror generator through its command-line boundary."""
    return subprocess.run(
        [sys.executable, str(SCRIPT), *(str(arg) for arg in args)],
        cwd=ROOT,
        capture_output=True,
        text=True,
        check=False,
    )


def make_skill(root: Path, name: str) -> Path:
    """Create a canonical skill directory in a fixture repo."""
    skill = root / "agents" / ".agents" / "skills" / name
    skill.mkdir(parents=True)
    (skill / "SKILL.md").write_text(f"# {name}\n", encoding="utf-8")
    return skill


def describe_generate_plugin_symlinks_cli():
    def it_creates_real_plugin_copies_for_skills(tmp_path: Path):
        make_skill(tmp_path, "code-review")

        result = run_script(tmp_path)

        assert result.returncode == 0
        assert "plugin skill mirror in sync" in result.stdout
        skill_copy = tmp_path / "plugin" / "skills" / "code-review"
        assert skill_copy.is_dir()
        assert not skill_copy.is_symlink()
        assert (skill_copy / "SKILL.md").read_text(encoding="utf-8") == (
            tmp_path / "agents" / ".agents" / "skills" / "code-review" / "SKILL.md"
        ).read_text(encoding="utf-8")

    def it_removes_stale_generated_entries_without_removing_real_files(
        tmp_path: Path,
    ):
        make_skill(tmp_path, "code-review")
        plugin_skills = tmp_path / "plugin" / "skills"
        plugin_skills.mkdir(parents=True)
        stale_link = plugin_skills / "old"
        stale_link.symlink_to("../../agents/.agents/skills/old")
        real_file = plugin_skills / "local-note"
        real_file.write_text("keep me\n", encoding="utf-8")

        result = run_script(tmp_path)

        assert result.returncode == 0
        assert not stale_link.exists()
        assert not stale_link.is_symlink()
        assert real_file.read_text(encoding="utf-8") == "keep me\n"
        assert "removed stale plugin entry: plugin/skills/old" in result.stdout
        assert "plugin/skills/local-note is not a generated directory" in result.stderr

    def it_refuses_to_overwrite_real_plugin_entries(tmp_path: Path):
        make_skill(tmp_path, "code-review")
        plugin_skills = tmp_path / "plugin" / "skills"
        plugin_skills.mkdir(parents=True)
        conflict = plugin_skills / "code-review"
        conflict.write_text("not a symlink\n", encoding="utf-8")

        result = run_script(tmp_path)

        assert result.returncode == 1
        assert conflict.read_text(encoding="utf-8") == "not a symlink\n"
        assert "plugin/skills/code-review exists as a real file/dir" in result.stderr

    def it_prunes_legacy_command_symlinks_without_recreating_commands(
        tmp_path: Path,
    ):
        make_skill(tmp_path, "code-review")
        plugin_commands = tmp_path / "plugin" / "commands"
        plugin_commands.mkdir(parents=True)
        legacy_link = plugin_commands / "commit.md"
        legacy_link.symlink_to("../../agents/.agents/commands/commit.md")

        result = run_script(tmp_path)

        assert result.returncode == 0
        assert not legacy_link.exists()
        assert not legacy_link.is_symlink()
        assert "removed stale plugin entry: plugin/commands/commit.md" in result.stdout

    def it_rejects_paths_that_are_not_repo_roots(tmp_path: Path):
        result = run_script(tmp_path)

        assert result.returncode == 2
        assert "not a repo root" in result.stderr
