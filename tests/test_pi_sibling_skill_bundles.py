"""Behavior tests for the Pi sibling skill bundle invariant.

Each Pi sibling extension package may bundle a subset of skills under its own
`skills/` directory so that installing the sibling alone delivers the matching
doctrine. The bundled copies must stay byte-identical to the canonical source
at `agents/.agents/skills/`. Drift would mean a user installing a sibling sees
different doctrine than a user installing the meta package — defeating the
"identical content makes co-existence safe" invariant the meta install relies
on.

The bundled `skills/` directories are built at npm-pack time (and gitignored),
so a fresh checkout has nothing to compare. These tests pass vacuously in that
state. Once a sibling has been built (`npm run build`), every bundled skill is
checked against canonical and any drift fails the test.
"""

from __future__ import annotations

import filecmp
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
CANONICAL_SKILLS = ROOT / "agents" / ".agents" / "skills"
SIBLING_PACKAGES = [
    "agent-booster-pack-skills",
    "agent-booster-pack-proof",
    "agent-booster-pack-contract-first",
    "agent-booster-pack-whiteboard",
]


def bundled_skill_dirs() -> list[Path]:
    """Return every <sibling>/skills/<skill> dir that currently exists."""
    found: list[Path] = []
    for package in SIBLING_PACKAGES:
        skills_root = ROOT / package / "skills"
        if not skills_root.is_dir():
            continue
        for entry in sorted(skills_root.iterdir()):
            if entry.is_dir():
                found.append(entry)
    return found


def diff_report(left: Path, right: Path) -> list[str]:
    """Walk two skill directories and return a list of byte-diff descriptions."""
    cmp = filecmp.dircmp(left, right)
    diffs: list[str] = []

    for name in cmp.left_only:
        diffs.append(f"only in bundled copy: {name}")
    for name in cmp.right_only:
        diffs.append(f"only in canonical: {name}")
    for name in cmp.diff_files:
        diffs.append(f"content differs: {name}")
    for name in cmp.funny_files:
        diffs.append(f"could not compare: {name}")

    for sub in cmp.common_dirs:
        diffs.extend(
            f"{sub}/{detail}" for detail in diff_report(left / sub, right / sub)
        )

    return diffs


def describe_pi_sibling_skill_bundles():
    def it_keeps_every_bundled_skill_byte_identical_to_the_canonical_source():
        bundled = bundled_skill_dirs()
        if not bundled:
            return

        problems: list[str] = []
        for bundled_dir in bundled:
            canonical_dir = CANONICAL_SKILLS / bundled_dir.name
            if not canonical_dir.is_dir():
                problems.append(
                    f"{bundled_dir.relative_to(ROOT)}: bundled skill has no "
                    f"canonical source at {canonical_dir.relative_to(ROOT)}"
                )
                continue

            differences = diff_report(bundled_dir, canonical_dir)
            for detail in differences:
                problems.append(f"{bundled_dir.relative_to(ROOT)}: {detail}")

        assert not problems, (
            "bundled Pi sibling skills drifted from canonical source:\n  "
            + "\n  ".join(problems)
            + "\nrebuild with `npm run build` in the affected sibling, or "
            "update the canonical source if the change was intentional."
        )
