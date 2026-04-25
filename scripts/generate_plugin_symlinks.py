#!/usr/bin/env python3
"""Sync plugin symlinks from canonical agent skills and commands."""

from __future__ import annotations

import argparse
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
    """Remove stale symlinks from dest when the matching source no longer exists."""
    if not dest.exists():
        return

    for entry in sorted(dest.iterdir()):
        if not (entry.exists() or entry.is_symlink()):
            continue

        if (src / entry.name).exists():
            continue

        if entry.is_symlink():
            entry.unlink()
            print(f"removed stale link: {display(entry, root)}")
        else:
            print(
                f"WARNING: {display(entry, root)} is not a symlink; leaving in place",
                file=sys.stderr,
            )


def link_each(src: Path, dest: Path, rel_prefix: str, root: Path) -> int:
    """Create relative symlinks in dest for each source entry."""
    for entry in sorted(src.iterdir()):
        if not entry.exists():
            continue

        target = dest / entry.name
        expected = f"{rel_prefix}/{entry.name}"

        if target.is_symlink():
            current = target.readlink()
            if str(current) == expected:
                continue
            target.unlink()
        elif target.exists():
            print(
                f"ERROR: {display(target, root)} exists as a real file/dir; "
                "remove it first",
                file=sys.stderr,
            )
            return 1

        target.symlink_to(expected)
        print(f"linked {display(target, root)} -> {expected}")

    return 0


def sync_plugin_symlinks(root: Path) -> int:
    """Synchronize plugin skill and command symlinks with source directories."""
    root = root.resolve()
    skills_src = root / "agents" / ".agents" / "skills"
    commands_src = root / "agents" / ".agents" / "commands"
    skills_dest = root / "plugin" / "skills"
    commands_dest = root / "plugin" / "commands"

    if not skills_src.is_dir():
        print(f"not a repo root (no agents/.agents/skills): {root}", file=sys.stderr)
        return 2

    skills_dest.mkdir(parents=True, exist_ok=True)
    commands_dest.mkdir(parents=True, exist_ok=True)

    prune_dest(skills_dest, skills_src, root)
    prune_dest(commands_dest, commands_src, root)

    result = link_each(skills_src, skills_dest, "../../agents/.agents/skills", root)
    if result != 0:
        return result

    if commands_src.is_dir():
        result = link_each(
            commands_src, commands_dest, "../../agents/.agents/commands", root
        )
        if result != 0:
            return result

    print("plugin symlinks in sync")
    return 0


def parse_args(argv: list[str]) -> argparse.Namespace:
    """Parse command-line arguments."""
    parser = argparse.ArgumentParser(
        description="Sync plugin/skills and plugin/commands symlinks."
    )
    parser.add_argument(
        "repo_root",
        nargs="?",
        type=Path,
        default=repo_root_from_script(),
        help="repository root; defaults to this script's parent repo",
    )
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    """Run the plugin symlink synchronization command."""
    args = parse_args(sys.argv[1:] if argv is None else argv)
    return sync_plugin_symlinks(args.repo_root)


if __name__ == "__main__":
    raise SystemExit(main())
