#!/usr/bin/env python3
"""Validate Agent Booster Pack skill files and plugin symlink drift."""

from __future__ import annotations

import argparse
import re
import shutil
import sys
import tempfile
from dataclasses import dataclass
from pathlib import Path


REQUIRED_SECTIONS = (
    "When to Use",
    "When NOT to Use",
    "Verification",
)

NAME_RE = re.compile(r"^name:\s+[a-z][a-z0-9-]*\s*$", re.MULTILINE)
DESCRIPTION_RE = re.compile(r"^description:", re.MULTILINE)
ATTRIBUTION_RE = re.compile(r"\b[Pp]er\s+(?:[A-Z][a-z]+\s+)?[A-Z][a-z]+\b")
TRIPWIRE_HEADER_RE = re.compile(
    r"^\|\s*Trigger\s*\|\s*Do this instead\s*\|\s*False alarm\s*\|\s*$",
    re.MULTILINE,
)


@dataclass(frozen=True)
class SkillFinding:
    """Validation findings for a single SKILL.md file."""

    path: Path
    problems: tuple[str, ...]


def default_skills_dir() -> Path:
    """Return the default canonical skills directory."""
    return Path(__file__).resolve().parent.parent / "agents" / ".agents" / "skills"


def section_re(name: str) -> re.Pattern[str]:
    """Build a section-heading matcher for a required heading."""
    return re.compile(rf"^##+\s+{re.escape(name)}\s*$", re.MULTILINE)


def body_without_reference_sections(body: str) -> str:
    """Remove lines under References or Canon before attribution checks."""
    kept: list[str] = []
    in_reference_section = False

    for line in body.splitlines():
        if re.match(r"^##+ (References|Canon)\s*$", line):
            in_reference_section = True
            continue
        if not in_reference_section:
            kept.append(line)

    return "\n".join(kept)


def validate_skill_file(path: Path) -> SkillFinding | None:
    """Validate one SKILL.md file and return findings when it fails."""
    body = path.read_text(encoding="utf-8")
    head = "\n".join(body.splitlines()[:30])
    problems: list[str] = []

    if not NAME_RE.search(head):
        problems.append("frontmatter missing name or not kebab-case")
    if not DESCRIPTION_RE.search(head):
        problems.append("frontmatter missing description")

    for heading in REQUIRED_SECTIONS:
        if not section_re(heading).search(body):
            problems.append(f"missing section: ## {heading}")

    if section_re("Common Rationalizations").search(body):
        problems.append(
            "obsolete section: ## Common Rationalizations -- use ## Tripwires"
        )
    if section_re("Red Flags").search(body):
        problems.append("obsolete section: ## Red Flags -- fold into ## Tripwires")
    if re.search(r"^\|\s*Excuse\s*\|\s*Reality\s*\|", body, re.MULTILINE):
        problems.append(
            "obsolete table header: use Trigger | Do this instead | False alarm"
        )
    if section_re("Tripwires").search(body) and not TRIPWIRE_HEADER_RE.search(body):
        problems.append(
            "Tripwires table must use: Trigger | Do this instead | False alarm"
        )

    attribution_lines = [
        line
        for line in body_without_reference_sections(body).splitlines()
        if not line.startswith(">") and ATTRIBUTION_RE.search(line)
    ]
    if attribution_lines:
        problems.append("inline 'per <expert>' attribution found -- move to References")

    if not problems:
        return None

    return SkillFinding(path=path, problems=tuple(problems))


def validate_skills(skills_dir: Path) -> list[SkillFinding]:
    """Validate all SKILL.md files under a skills directory."""
    findings: list[SkillFinding] = []
    for skill_file in sorted(skills_dir.glob("*/SKILL.md")):
        finding = validate_skill_file(skill_file)
        if finding is not None:
            findings.append(finding)
    return findings


def print_skill_findings(skills_dir: Path, findings: list[SkillFinding]) -> None:
    """Print skill anatomy findings in the historical script format."""
    for finding in findings:
        rel = finding.path.relative_to(skills_dir)
        print(rel)
        for problem in finding.problems:
            print(f"  - {problem}")

    if findings:
        print()
        print(f"{len(findings)} skill(s) failed anatomy validation")
    else:
        print("all skills conform to the anatomy")


def plugin_skills_dir(skills_dir: Path) -> Path:
    """Return the plugin skills directory for a canonical skills directory."""
    return skills_dir.parent.parent.parent / "plugin" / "skills"


def validate_plugin_drift(skills_dir: Path) -> int:
    """Check that plugin/skills symlinks resolve to canonical skill directories."""
    plugin_dir = plugin_skills_dir(skills_dir)
    if not plugin_dir.is_dir():
        return 0

    drift = 0
    for skill_dir in sorted(path for path in skills_dir.iterdir() if path.is_dir()):
        link = plugin_dir / skill_dir.name
        if not link.is_symlink():
            print(
                f"plugin drift: {link} missing -- "
                "run scripts/generate_plugin_symlinks.py"
            )
            drift += 1
            continue

        try:
            resolved = link.resolve(strict=True)
        except FileNotFoundError:
            resolved = link.resolve(strict=False)

        expected = skill_dir.resolve()
        if resolved != expected:
            print(f"plugin drift: {link} resolves to {resolved} (expected {expected})")
            drift += 1

    if drift == 0:
        print("plugin/ symlinks in sync with source")
    else:
        print()
        print(f"{drift} plugin symlink(s) drifted from source")

    return drift


def write_fixture(path: Path, text: str) -> None:
    """Create a fixture SKILL.md file."""
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")


def run_self_test() -> int:
    """Run validator self-tests against temporary good and bad skill fixtures."""
    tmp = Path(tempfile.mkdtemp())
    try:
        write_fixture(
            tmp / "good" / "SKILL.md",
            """---
name: good
description: Ok
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
""",
        )
        write_fixture(
            tmp / "bad" / "SKILL.md",
            """---
name: bad
description: Not good
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
""",
        )

        findings = validate_skills(tmp)
        rendered = "\n".join(
            [str(finding.path.relative_to(tmp)) for finding in findings]
            + [problem for finding in findings for problem in finding.problems]
        )
        for expected in (
            "bad/SKILL.md",
            "When to Use",
            "Verification",
            "per <expert>",
            "Common Rationalizations",
            "Red Flags",
            "Trigger | Do this instead | False alarm",
        ):
            if expected not in rendered:
                print(
                    f"self-test failed: missing {expected!r} in output",
                    file=sys.stderr,
                )
                print(rendered, file=sys.stderr)
                return 1

        good_path = Path("good/SKILL.md")
        if any(finding.path.relative_to(tmp) == good_path for finding in findings):
            print("self-test failed: good skill flagged", file=sys.stderr)
            print(rendered, file=sys.stderr)
            return 1

        print("self-test ok")
        return 0
    finally:
        shutil.rmtree(tmp)


def parse_args(argv: list[str]) -> argparse.Namespace:
    """Parse command-line arguments."""
    parser = argparse.ArgumentParser(
        description="Validate SKILL.md frontmatter, required sections, and plugin drift."
    )
    parser.add_argument(
        "skills_dir",
        nargs="?",
        type=Path,
        default=default_skills_dir(),
        help="skills directory; defaults to agents/.agents/skills",
    )
    parser.add_argument(
        "--self-test",
        action="store_true",
        help="run validator self-tests instead of validating the repository",
    )
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    """Run the skill anatomy validator."""
    args = parse_args(sys.argv[1:] if argv is None else argv)

    if args.self_test:
        return run_self_test()

    skills_dir = args.skills_dir
    if not skills_dir.is_dir():
        print(f"not a directory: {skills_dir}", file=sys.stderr)
        return 2

    findings = validate_skills(skills_dir)
    print_skill_findings(skills_dir, findings)
    drift = validate_plugin_drift(skills_dir)

    return 1 if findings or drift else 0


if __name__ == "__main__":
    raise SystemExit(main())
