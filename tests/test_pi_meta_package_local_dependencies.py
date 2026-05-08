"""Regression tests for the Pi meta-package bundling local siblings."""

from __future__ import annotations

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
META_PACKAGE = ROOT / "agent-booster-pack"
SIBLING_PACKAGES = [
    "agent-booster-pack-skills",
    "agent-booster-pack-contract-first",
    "agent-booster-pack-proof",
    "agent-booster-pack-whiteboard",
]


def read_package(package_dir: Path) -> dict[str, object]:
    return json.loads((package_dir / "package.json").read_text(encoding="utf-8"))


def test_pi_meta_package_depends_on_local_sibling_directories():
    package = read_package(META_PACKAGE)
    dependencies = package["dependencies"]

    assert dependencies == {name: f"file:../{name}" for name in SIBLING_PACKAGES}


def test_pi_meta_package_bundles_every_local_sibling_dependency():
    package = read_package(META_PACKAGE)

    assert sorted(package["bundledDependencies"]) == sorted(SIBLING_PACKAGES)


def test_pi_meta_package_prepack_builds_and_copies_local_siblings():
    package = read_package(META_PACKAGE)
    scripts = package["scripts"]

    for name in SIBLING_PACKAGES:
        assert f"npm --prefix ../{name} run build" in scripts["build:siblings"]

    assert "npm run build:siblings" in scripts["prepack"]
    assert "npm install --install-links" in scripts["prepack"]
    assert "npm run sync:bundled-skills" in scripts["prepack"]
    assert scripts["sync:bundled-skills"] == "node scripts/sync-bundled-skills.mjs"


def test_pi_meta_package_has_bundled_skill_sync_script():
    script = META_PACKAGE / "scripts" / "sync-bundled-skills.mjs"

    assert script.is_file()
    text = script.read_text(encoding="utf-8")
    for name in SIBLING_PACKAGES:
        assert name in text
