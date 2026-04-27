#!/usr/bin/env python3
"""Validate Agent Booster Pack skill files and plugin mirror drift."""

from __future__ import annotations

import argparse
import json
import re
import shutil
import sys
import tempfile
from dataclasses import dataclass
from json import JSONDecodeError
from pathlib import Path
from typing import Any


REQUIRED_SECTIONS = (
    "When to Use",
    "When NOT to Use",
    "Verification",
)
MAX_DESCRIPTION_LENGTH = 200

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


def frontmatter_description(head: str) -> str | None:
    """Return the normalized frontmatter description when present."""
    lines = head.splitlines()
    description: list[str] = []
    in_description = False

    for line in lines:
        if line.startswith("description:"):
            in_description = True
            value = line.split(":", 1)[1].strip()
            if value and value not in {">", ">-", "|", "|-"}:
                description.append(value)
            continue

        if in_description:
            if line.startswith("  "):
                description.append(line.strip())
                continue
            break

    if not in_description:
        return None

    return " ".join(description)


def validate_skill_file(path: Path) -> SkillFinding | None:
    """Validate one SKILL.md file and return findings when it fails."""
    body = path.read_text(encoding="utf-8")
    head = "\n".join(body.splitlines()[:30])
    problems: list[str] = []

    if not NAME_RE.search(head):
        problems.append("frontmatter missing name or not kebab-case")
    description = frontmatter_description(head)
    if description is None:
        problems.append("frontmatter missing description")
    elif len(description) > MAX_DESCRIPTION_LENGTH:
        problems.append(
            "frontmatter description too long "
            f"({len(description)} > {MAX_DESCRIPTION_LENGTH} characters)"
        )

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


def repo_root_for_skills_dir(skills_dir: Path) -> Path:
    """Return the repository root implied by a canonical skills directory."""
    return skills_dir.parent.parent.parent


def validate_plugin_drift(skills_dir: Path) -> int:
    """Check that plugin/skills mirrors canonical skill directories."""
    plugin_dir = plugin_skills_dir(skills_dir)
    if not plugin_dir.is_dir():
        return 0

    drift = 0
    for skill_dir in sorted(path for path in skills_dir.iterdir() if path.is_dir()):
        mirror = plugin_dir / skill_dir.name
        if not mirror.is_dir():
            print(
                f"plugin drift: {mirror} missing -- "
                "run scripts/generate_plugin_symlinks.py"
            )
            drift += 1
            continue

        for source_file in sorted(
            path for path in skill_dir.rglob("*") if path.is_file()
        ):
            relative = source_file.relative_to(skill_dir)
            mirror_file = mirror / relative
            if not mirror_file.is_file():
                print(f"plugin drift: {mirror_file} missing")
                drift += 1
                continue
            if source_file.read_bytes() != mirror_file.read_bytes():
                print(f"plugin drift: {mirror_file} differs from {source_file}")
                drift += 1

        for mirror_file in sorted(path for path in mirror.rglob("*") if path.is_file()):
            relative = mirror_file.relative_to(mirror)
            source_file = skill_dir / relative
            if not source_file.is_file():
                print(f"plugin drift: {mirror_file} has no canonical source")
                drift += 1

    for mirror in sorted(path for path in plugin_dir.iterdir() if path.is_dir()):
        if not (skills_dir / mirror.name).is_dir():
            print(f"plugin drift: {mirror} has no canonical skill")
            drift += 1

    if drift == 0:
        print("plugin/ skill mirror in sync with source")
    else:
        print()
        print(f"{drift} plugin mirror difference(s) found")

    return drift


def read_json_object(path: Path) -> tuple[dict[str, Any] | None, str | None]:
    """Read a JSON object or return a validation problem."""
    if not path.is_file():
        return None, f"missing {path}"

    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except JSONDecodeError as error:
        return None, f"{path} is not valid JSON: {error.msg}"

    if not isinstance(data, dict):
        return None, f"{path} must contain a JSON object"

    return data, None


def first_plugin_entry(marketplace: dict[str, Any]) -> dict[str, Any] | None:
    """Return the ABP plugin entry from a marketplace document."""
    plugins = marketplace.get("plugins")
    if not isinstance(plugins, list):
        return None

    for entry in plugins:
        if isinstance(entry, dict) and entry.get("name") == "abp":
            return entry

    return None


def validate_codex_plugin_package(skills_dir: Path) -> int:
    """Validate Codex plugin manifest and repo marketplace metadata."""
    root = repo_root_for_skills_dir(skills_dir)

    problems: list[str] = []
    marketplace_path = root / ".agents" / "plugins" / "marketplace.json"
    manifest_path = root / "plugin" / ".codex-plugin" / "plugin.json"

    marketplace, problem = read_json_object(marketplace_path)
    if problem is not None:
        problems.append(problem)
    elif marketplace is not None:
        if marketplace.get("name") != "abp":
            problems.append(f"{marketplace_path} name must be 'abp'")
        interface = marketplace.get("interface")
        if not isinstance(interface, dict):
            problems.append(f"{marketplace_path} interface must be an object")
        elif interface.get("displayName") != "Agent Booster Pack":
            problems.append(
                f"{marketplace_path} interface.displayName must be 'Agent Booster Pack'"
            )

        entry = first_plugin_entry(marketplace)
        if entry is None:
            problems.append(f"{marketplace_path} must include an 'abp' plugin entry")
        else:
            source = entry.get("source")
            if not isinstance(source, dict):
                problems.append(f"{marketplace_path} abp.source must be an object")
            else:
                if source.get("source") != "local":
                    problems.append(
                        f"{marketplace_path} abp.source.source must be 'local'"
                    )
                if source.get("path") != "./plugin":
                    problems.append(
                        f"{marketplace_path} abp.source.path must be './plugin'"
                    )

            policy = entry.get("policy")
            if not isinstance(policy, dict):
                problems.append(f"{marketplace_path} abp.policy must be an object")
            else:
                if policy.get("installation") != "AVAILABLE":
                    problems.append(
                        f"{marketplace_path} abp.policy.installation must be "
                        "'AVAILABLE'"
                    )
                if policy.get("authentication") != "ON_INSTALL":
                    problems.append(
                        f"{marketplace_path} abp.policy.authentication must be "
                        "'ON_INSTALL'"
                    )

            if entry.get("category") != "Coding":
                problems.append(f"{marketplace_path} abp.category must be 'Coding'")

    manifest, problem = read_json_object(manifest_path)
    if problem is not None:
        problems.append(problem)
    elif manifest is not None:
        if manifest.get("name") != "abp":
            problems.append(f"{manifest_path} name must be 'abp'")
        if manifest.get("skills") != "./skills/":
            problems.append(f"{manifest_path} skills must be './skills/'")

        interface = manifest.get("interface")
        if not isinstance(interface, dict):
            problems.append(f"{manifest_path} interface must be an object")
        else:
            if interface.get("displayName") != "Agent Booster Pack":
                problems.append(
                    f"{manifest_path} interface.displayName must be "
                    "'Agent Booster Pack'"
                )
            if interface.get("category") != "Coding":
                problems.append(f"{manifest_path} interface.category must be 'Coding'")

            capabilities = interface.get("capabilities")
            if not isinstance(capabilities, list) or not {
                "Read",
                "Write",
            }.issubset(set(capabilities)):
                problems.append(
                    f"{manifest_path} interface.capabilities must include "
                    "'Read' and 'Write'"
                )

            default_prompt = interface.get("defaultPrompt")
            if not isinstance(default_prompt, list) or len(default_prompt) > 3:
                problems.append(
                    f"{manifest_path} interface.defaultPrompt must contain "
                    "at most 3 prompts"
                )

        claude_marketplace, claude_problem = read_json_object(
            root / ".claude-plugin" / "marketplace.json"
        )
        if claude_problem is None and claude_marketplace is not None:
            claude_version = claude_marketplace.get("metadata", {}).get("version")
            if manifest.get("version") != claude_version:
                problems.append(
                    f"{manifest_path} version must match "
                    ".claude-plugin/marketplace.json metadata.version"
                )
            claude_entry = first_plugin_entry(claude_marketplace)
            if claude_entry is None:
                problems.append(
                    ".claude-plugin/marketplace.json must include an 'abp' plugin entry"
                )
            elif claude_entry.get("source") != "./plugin":
                problems.append(
                    ".claude-plugin/marketplace.json abp.source must be './plugin'"
                )

    if problems:
        for problem in problems:
            print(f"codex plugin: {problem}")
        print()
        print(f"{len(problems)} codex plugin package problem(s)")
    else:
        print("codex plugin package valid")

    return len(problems)


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
description: >-
  This description is intentionally much too long for the skill routing surface
  because Codex and other agents load all skill descriptions before deciding
  which full skill body to request, so verbose trigger prose creates avoidable
  context pressure.
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
            "description too long",
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
    codex_plugin_problems = validate_codex_plugin_package(skills_dir)

    return 1 if findings or drift or codex_plugin_problems else 0


if __name__ == "__main__":
    raise SystemExit(main())
