"""Repository script inventory checks."""

from __future__ import annotations

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def test_stale_release_script_was_removed():
    assert not (ROOT / "scripts" / "release.sh").exists()
    assert not (ROOT / "RELEASE-v5.md").exists()


def test_orphaned_proof_eval_package_was_removed():
    assert not (ROOT / "agent-booster-pack-proof" / "eval").exists()


def read_package(package_dir: str) -> dict:
    return json.loads((ROOT / package_dir / "package.json").read_text())


def test_runtime_pi_packages_ship_their_matching_skills():
    expected = {
        "agent-booster-pack-proof": "./skills",
        "agent-booster-pack-contract-first": "./skills",
        "agent-booster-pack-whiteboard": "./skills",
    }

    for package_dir, skill_path in expected.items():
        package = read_package(package_dir)
        assert skill_path in package["pi"]["skills"]
        assert "skills" in package["files"]


def test_meta_package_loads_runtime_and_general_skill_paths_without_duplicates():
    package = read_package("agent-booster-pack")

    assert package["pi"]["skills"] == [
        "./node_modules/agent-booster-pack-skills/skills",
        "./node_modules/agent-booster-pack-contract-first/skills",
        "./node_modules/agent-booster-pack-proof/skills",
        "./node_modules/agent-booster-pack-whiteboard/skills",
    ]
