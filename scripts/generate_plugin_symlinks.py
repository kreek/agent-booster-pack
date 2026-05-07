#!/usr/bin/env python3
"""Sync plugin skill copies from canonical agent skills.

Writes the Claude Code / Codex plugin mirror at `plugin/skills/` from the
canonical source at `agents/.agents/skills/`. The Pi skills package builds
its own mirror at npm-pack time via
`agent-booster-pack-skills/scripts/build-skills.mjs`, so it is not
generated here.
"""

from __future__ import annotations

import argparse
import shutil
import sys
from pathlib import Path


def repo_root_from_script() -> Path:
    """Return the repository root inferred from this script's location."""
    return Path(__file__).resolve().parent.parent


def display(path: Path, root: Path) -> str:
    """Return a repository-relative path for human-readable output."""
    try:
        return str(path.relative_to(root))
    except ValueError:
        return str(path)


def prune_dest(dest: Path, src: Path, root: Path) -> None:
    """Remove stale generated entries from dest when source no longer exists."""
    if not dest.exists():
        return

    for entry in sorted(dest.iterdir()):
        if not (entry.exists() or entry.is_symlink()):
            continue

        if (src / entry.name).exists():
            continue

        if entry.is_symlink() or entry.is_dir():
            if entry.is_dir() and not entry.is_symlink():
                shutil.rmtree(entry)
            else:
                entry.unlink()
            print(f"removed stale plugin entry: {display(entry, root)}")
            continue

        print(
            f"WARNING: {display(entry, root)} is not a generated directory; "
            "leaving in place",
            file=sys.stderr,
        )


def sync_each(src: Path, dest: Path, root: Path) -> int:
    """Create real plugin skill directories from each canonical source entry."""
    for entry in sorted(src.iterdir()):
        if not entry.exists():
            continue

        target = dest / entry.name

        if target.is_symlink():
            target.unlink()
        elif target.exists() and target.is_dir():
            shutil.rmtree(target)
        elif target.exists():
            print(
                f"ERROR: {display(target, root)} exists as a real file/dir; "
                "remove it first",
                file=sys.stderr,
            )
            return 1

        shutil.copytree(entry, target, symlinks=True)
        print(f"copied {display(entry, root)} -> {display(target, root)}")

    return 0


def sync_plugin_symlinks(root: Path) -> int:
    """Synchronize plugin skill copies with source directories."""
    root = root.resolve()
    skills_src = root / "agents" / ".agents" / "skills"
    skills_dest = root / "plugin" / "skills"
    legacy_commands_src = root / "agents" / ".agents" / "commands"
    legacy_commands_dest = root / "plugin" / "commands"

    if not skills_src.is_dir():
        print(f"not a repo root (no agents/.agents/skills): {root}", file=sys.stderr)
        return 2

    skills_dest.mkdir(parents=True, exist_ok=True)

    prune_dest(skills_dest, skills_src, root)
    prune_dest(legacy_commands_dest, legacy_commands_src, root)

    result = sync_each(skills_src, skills_dest, root)
    if result != 0:
        return result

    print("plugin skill mirror in sync")
    return 0


def parse_args(argv: list[str]) -> argparse.Namespace:
    """Parse command-line arguments."""
    parser = argparse.ArgumentParser(description="Sync plugin/skills copies.")
    parser.add_argument(
        "repo_root",
        nargs="?",
        type=Path,
        default=repo_root_from_script(),
        help="repository root; defaults to this script's parent repo",
    )
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    """Run the plugin skill mirror synchronization command."""
    args = parse_args(sys.argv[1:] if argv is None else argv)
    return sync_plugin_symlinks(args.repo_root)


if __name__ == "__main__":
    raise SystemExit(main())
