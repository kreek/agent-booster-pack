"""Repository script inventory checks."""

from __future__ import annotations

from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def test_stale_release_script_was_removed():
    assert not (ROOT / "scripts" / "release.sh").exists()
    assert not (ROOT / "RELEASE-v5.md").exists()


def test_orphaned_proof_eval_package_was_removed():
    assert not (ROOT / "agent-booster-pack-proof" / "eval").exists()
