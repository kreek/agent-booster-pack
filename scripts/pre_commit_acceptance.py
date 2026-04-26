#!/usr/bin/env python3
"""Run deterministic ABP pre-commit acceptance checks."""

from __future__ import annotations

import argparse
import shutil
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path


PROTECTED_BRANCHES = {"main", "master"}


@dataclass(frozen=True)
class Check:
    """A command selected by staged-file scope."""

    reason: str
    command: tuple[str, ...]
    required_tools: tuple[str, ...] = ()


def repo_root_from_script() -> Path:
    """Return the repository root inferred from this script's location."""
    return Path(__file__).resolve().parent.parent


def run_git(root: Path, *args: str) -> subprocess.CompletedProcess[str]:
    """Run a git command in root and capture text output."""
    return subprocess.run(
        ["git", *args],
        cwd=root,
        capture_output=True,
        text=True,
        check=False,
    )


def current_branch(root: Path) -> str:
    """Return the current branch name, or an empty string for detached HEAD."""
    result = run_git(root, "branch", "--show-current")
    return result.stdout.strip() if result.returncode == 0 else ""


def staged_paths(root: Path) -> list[Path]:
    """Return paths staged for commit, relative to root."""
    result = run_git(root, "diff", "--cached", "--name-only", "--diff-filter=ACMRD")
    if result.returncode != 0:
        raise RuntimeError(result.stderr.strip() or "could not inspect staged files")
    return [Path(line) for line in result.stdout.splitlines() if line.strip()]


def path_matches(path: Path, *prefixes: str) -> bool:
    """Return whether path sits under any repository-relative prefix."""
    text = path.as_posix()
    return any(text == prefix or text.startswith(f"{prefix}/") for prefix in prefixes)


def has_any(paths: list[Path], predicate) -> bool:
    """Return whether any staged path matches predicate."""
    return any(predicate(path) for path in paths)


def shell_paths(paths: list[Path]) -> list[str]:
    """Return staged shell script paths."""
    return [
        path.as_posix()
        for path in paths
        if path.suffix == ".sh" or path_matches(path, ".githooks")
    ]


def select_checks(paths: list[Path]) -> list[Check]:
    """Select validation commands from staged-file scope."""
    checks = [
        Check(
            "staged diff has no whitespace errors",
            ("git", "diff", "--cached", "--check"),
        )
    ]

    if has_any(
        paths,
        lambda path: path_matches(
            path,
            "agents/.agents/skills",
            "agents/AGENTS.md",
            "plugin/skills",
        ),
    ):
        checks.append(
            Check(
                "skill anatomy and plugin links stay in sync",
                ("uv", "run", "python", "scripts/validate_skill_anatomy.py"),
                ("uv",),
            )
        )

    if has_any(paths, lambda path: path.suffix == ".md" or path.name == "AGENTS.md"):
        checks.append(
            Check(
                "local markdown links and anchors resolve",
                ("uv", "run", "refcheck", ".", "--no-color"),
                ("uv",),
            )
        )

    if has_any(
        paths,
        lambda path: (
            path.suffix == ".py"
            or path_matches(path, "scripts", "tests")
            or path.name == "pyproject.toml"
        ),
    ):
        checks.extend(
            [
                Check(
                    "python behavior tests pass",
                    ("uv", "run", "pytest"),
                    ("uv",),
                ),
                Check(
                    "python formatting is stable",
                    ("uv", "run", "ruff", "format", "--check", "."),
                    ("uv",),
                ),
                Check(
                    "python lint is clean",
                    ("uv", "run", "ruff", "check", "."),
                    ("uv",),
                ),
            ]
        )

    staged_shell = shell_paths(paths)
    if staged_shell:
        checks.extend(
            [
                Check(
                    "shell scripts pass shellcheck",
                    ("shellcheck", *staged_shell),
                    ("shellcheck",),
                ),
                Check(
                    "shell scripts are shfmt-formatted",
                    ("shfmt", "-d", *staged_shell),
                    ("shfmt",),
                ),
            ]
        )

    return checks


def format_command(command: tuple[str, ...]) -> str:
    """Return a readable command string."""
    return " ".join(command)


def missing_tools(check: Check) -> list[str]:
    """Return required tools missing from PATH."""
    return [tool for tool in check.required_tools if shutil.which(tool) is None]


def run_checks(root: Path, checks: list[Check], dry_run: bool) -> int:
    """Run selected checks and return a process-style exit code."""
    failures = 0
    for check in checks:
        command = format_command(check.command)
        print(f"==> {command}")
        print(f"    {check.reason}")

        missing = missing_tools(check)
        if missing:
            print(
                f"ERROR: missing required tool(s): {', '.join(missing)}",
                file=sys.stderr,
            )
            failures += 1
            continue

        if dry_run:
            continue

        result = subprocess.run(check.command, cwd=root, check=False)
        if result.returncode != 0:
            print(
                f"ERROR: command failed with exit code {result.returncode}",
                file=sys.stderr,
            )
            failures += 1

    return 1 if failures else 0


def parse_args(argv: list[str]) -> argparse.Namespace:
    """Parse command-line arguments."""
    parser = argparse.ArgumentParser(
        description="Run ABP pre-commit acceptance checks for staged files."
    )
    parser.add_argument(
        "--repo-root",
        type=Path,
        default=repo_root_from_script(),
        help="repository root; defaults to this script's parent repo",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="print selected checks without running them",
    )
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    """Run the acceptance gate."""
    args = parse_args(sys.argv[1:] if argv is None else argv)
    root = args.repo_root.resolve()

    branch = current_branch(root)
    if branch in PROTECTED_BRANCHES:
        print(
            f"ERROR: refusing to commit directly on {branch}; create a topic branch.",
            file=sys.stderr,
        )
        return 1

    try:
        paths = staged_paths(root)
    except RuntimeError as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 2

    if not paths:
        print("No staged files; nothing to validate.")
        return 0

    print("ABP pre-commit acceptance checks")
    print(f"Branch: {branch or '(detached HEAD)'}")
    print("Staged files:")
    for path in paths:
        print(f"  - {path.as_posix()}")

    return run_checks(root, select_checks(paths), args.dry_run)


if __name__ == "__main__":
    raise SystemExit(main())
