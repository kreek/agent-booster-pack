"""Behavior tests for the AGENTS.md sync CLI.

The user's ``~/AGENTS.md`` is sacred — these tests exist to prove the
script never destroys content outside the managed block, never silently
overwrites edits inside the block, and never touches the file when the
stow install owns it (symlink). New behaviors here should add a test;
removing one is a deliberate signal that user-data safety has changed.
"""

from __future__ import annotations

import json
import re
import subprocess
import sys
from pathlib import Path

import pytest


ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "scripts" / "sync_agents_md.py"
MARKETPLACE = ROOT / ".claude-plugin" / "marketplace.json"

BEGIN_RE = re.compile(r"^<!-- ABP:BEGIN v([^ ]+) -->\s*$", re.MULTILINE)
END_RE = re.compile(r"^<!-- ABP:END -->\s*$", re.MULTILINE)


def run_script(target: Path, *flags: str) -> subprocess.CompletedProcess[str]:
    """Run the sync script through its CLI boundary."""
    return subprocess.run(
        [sys.executable, str(SCRIPT), "--target", str(target), *flags],
        cwd=ROOT,
        capture_output=True,
        text=True,
        check=False,
    )


@pytest.fixture()
def pack_version() -> str:
    return json.loads(MARKETPLACE.read_text())["metadata"]["version"]


def block_bounds(text: str) -> tuple[int, int]:
    begin = BEGIN_RE.search(text)
    end = END_RE.search(text)
    assert begin and end, "expected an ABP block in the file"
    return begin.start(), end.end()


def describe_sync_agents_md_cli():
    def it_creates_a_new_file_when_the_target_does_not_exist(
        tmp_path: Path, pack_version: str
    ):
        target = tmp_path / "AGENTS.md"

        result = run_script(target)

        assert result.returncode == 0, result.stderr
        assert target.exists()
        contents = target.read_text(encoding="utf-8")
        assert f"<!-- ABP:BEGIN v{pack_version} -->" in contents
        assert "<!-- ABP:END -->" in contents
        assert f"created {target}" in result.stdout

    def it_appends_the_block_at_the_bottom_when_no_markers_exist(
        tmp_path: Path, pack_version: str
    ):
        target = tmp_path / "AGENTS.md"
        personal = "# My personal AGENTS.md\n\nMy private rules.\n"
        target.write_text(personal, encoding="utf-8")

        result = run_script(target)

        assert result.returncode == 0, result.stderr
        contents = target.read_text(encoding="utf-8")
        # Personal content stays exactly where it was, at the top.
        assert contents.startswith(personal.rstrip())
        # Block sits below, with the canonical ABP doctrine inside.
        start, end = block_bounds(contents)
        assert start > len(personal.rstrip())
        assert "## Agent Booster Pack" in contents[start:end]

    def it_preserves_user_content_above_the_block_on_first_append(tmp_path: Path):
        target = tmp_path / "AGENTS.md"
        personal_lines = (
            "# My personal AGENTS.md",
            "",
            "## House rules",
            "",
            "- Always pair on auth changes.",
            "- Use signed commits.",
        )
        target.write_text("\n".join(personal_lines) + "\n", encoding="utf-8")

        result = run_script(target)

        assert result.returncode == 0, result.stderr
        contents = target.read_text(encoding="utf-8")
        for line in personal_lines:
            assert line in contents, f"lost personal line: {line!r}"

    def it_is_idempotent_when_the_block_already_matches(
        tmp_path: Path, pack_version: str
    ):
        target = tmp_path / "AGENTS.md"
        run_script(target)
        first = target.read_text(encoding="utf-8")
        first_mtime = target.stat().st_mtime_ns

        result = run_script(target)

        assert result.returncode == 0, result.stderr
        assert target.read_text(encoding="utf-8") == first
        # The script should not even rewrite the file when nothing changes.
        assert target.stat().st_mtime_ns == first_mtime
        assert f"already at v{pack_version}" in result.stdout

    def it_refuses_to_overwrite_a_drifted_block_without_force(tmp_path: Path):
        target = tmp_path / "AGENTS.md"
        run_script(target)
        contents = target.read_text(encoding="utf-8")
        # Simulate a user editing a line inside the managed block.
        tampered = contents.replace("Simplicity first", "Simplicity LAST", 1)
        assert tampered != contents, "fixture must mutate inside the block"
        target.write_text(tampered, encoding="utf-8")

        result = run_script(target)

        assert result.returncode == 2
        assert target.read_text(encoding="utf-8") == tampered
        assert "drift detected" in result.stderr
        # The diff should make the difference visible to the user.
        assert "Simplicity LAST" in result.stderr
        assert "Simplicity first" in result.stderr

    def it_preserves_user_content_outside_the_block_during_force_overwrite(
        tmp_path: Path,
    ):
        target = tmp_path / "AGENTS.md"
        run_script(target)
        contents = target.read_text(encoding="utf-8")
        prologue = "# Personal\n\nUntouchable line above.\n\n"
        epilogue = "\n## Workplace footer\n\nUntouchable line below.\n"
        with_outside = prologue + contents.rstrip() + epilogue
        tampered = with_outside.replace("Simplicity first", "Simplicity LAST", 1)
        target.write_text(tampered, encoding="utf-8")

        result = run_script(target, "--force")

        assert result.returncode == 0, result.stderr
        final = target.read_text(encoding="utf-8")
        # Outside-block content survives intact.
        assert final.startswith(prologue)
        assert final.rstrip().endswith(epilogue.rstrip())
        # Inside-block edits are gone (the canonical wins).
        assert "Simplicity LAST" not in final
        assert "Simplicity first" in final

    def it_does_not_touch_a_symlink_target(tmp_path: Path):
        real = tmp_path / "real.md"
        real.write_text("# Real file owned by stow.\n", encoding="utf-8")
        link = tmp_path / "AGENTS.md"
        link.symlink_to(real)

        result = run_script(link)

        assert result.returncode == 3
        # Neither the symlink nor the underlying file was modified.
        assert link.is_symlink()
        assert real.read_text(encoding="utf-8") == "# Real file owned by stow.\n"
        assert "is a symlink" in result.stderr

    def it_makes_no_changes_in_check_mode_when_target_missing(tmp_path: Path):
        target = tmp_path / "AGENTS.md"

        result = run_script(target, "--check")

        assert result.returncode == 1
        assert not target.exists()
        assert "would create" in result.stdout

    def it_makes_no_changes_in_check_mode_when_appending_is_needed(
        tmp_path: Path,
    ):
        target = tmp_path / "AGENTS.md"
        personal = "# Personal\n\nKeep me.\n"
        target.write_text(personal, encoding="utf-8")
        before_mtime = target.stat().st_mtime_ns

        result = run_script(target, "--check")

        assert result.returncode == 1
        assert target.read_text(encoding="utf-8") == personal
        assert target.stat().st_mtime_ns == before_mtime
        assert "would append" in result.stdout

    def it_makes_no_changes_in_check_mode_when_drift_is_present(tmp_path: Path):
        target = tmp_path / "AGENTS.md"
        run_script(target)
        tampered = target.read_text(encoding="utf-8").replace(
            "Simplicity first", "Simplicity LAST", 1
        )
        target.write_text(tampered, encoding="utf-8")

        result = run_script(target, "--check")

        assert result.returncode == 2
        assert target.read_text(encoding="utf-8") == tampered

    @pytest.mark.parametrize(
        ("contents", "message"),
        (
            (
                "# Personal\n\n<!-- ABP:BEGIN v0.0.1 -->\nmanual edit\n",
                "expected exactly one ABP:BEGIN marker and one ABP:END marker",
            ),
            (
                "# Personal\n\n<!-- ABP:END -->\nmanual edit\n",
                "expected exactly one ABP:BEGIN marker and one ABP:END marker",
            ),
            (
                "# Personal\n\n<!-- ABP:END -->\nmanual edit\n"
                "<!-- ABP:BEGIN v0.0.1 -->\n",
                "ABP:END appears before ABP:BEGIN",
            ),
            (
                "# Personal\n\n<!-- ABP:BEGIN v0.0.1 -->\n"
                "<!-- ABP:END -->\n"
                "<!-- ABP:BEGIN v0.0.1 -->\n"
                "<!-- ABP:END -->\n",
                "expected exactly one ABP:BEGIN marker and one ABP:END marker",
            ),
        ),
    )
    def it_refuses_to_write_when_existing_markers_are_malformed(
        tmp_path: Path, contents: str, message: str
    ):
        target = tmp_path / "AGENTS.md"
        target.write_text(contents, encoding="utf-8")
        before_mtime = target.stat().st_mtime_ns

        result = run_script(target)

        assert result.returncode == 2
        assert target.read_text(encoding="utf-8") == contents
        assert target.stat().st_mtime_ns == before_mtime
        assert "malformed ABP block markers" in result.stderr
        assert message in result.stderr

    def it_writes_the_pack_version_into_the_block_marker(
        tmp_path: Path, pack_version: str
    ):
        target = tmp_path / "AGENTS.md"

        run_script(target)

        contents = target.read_text(encoding="utf-8")
        match = BEGIN_RE.search(contents)
        assert match, "expected an ABP:BEGIN marker"
        assert match.group(1) == pack_version

    def it_replaces_only_the_block_when_canonical_content_changes(
        tmp_path: Path, pack_version: str
    ):
        target = tmp_path / "AGENTS.md"
        personal = "# Personal\n\nNotes on top.\n\n"
        target.write_text(personal, encoding="utf-8")
        run_script(target)
        with_block = target.read_text(encoding="utf-8")

        # Simulate the canonical block at an older "v0.0.0" by rewriting
        # the BEGIN marker. The canonical body inside still matches the
        # current pack content, so the script must accept this as a safe
        # version bump (no --force needed).
        downgraded = with_block.replace(
            f"<!-- ABP:BEGIN v{pack_version} -->",
            "<!-- ABP:BEGIN v0.0.0 -->",
            1,
        )
        target.write_text(downgraded, encoding="utf-8")

        result = run_script(target)

        assert result.returncode == 0, result.stderr
        final = target.read_text(encoding="utf-8")
        assert final.startswith(personal)
        assert f"<!-- ABP:BEGIN v{pack_version} -->" in final
        assert "v0.0.0" not in final
        assert f"v0.0.0 → v{pack_version}" in result.stdout
