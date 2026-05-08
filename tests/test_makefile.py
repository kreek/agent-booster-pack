"""Behavior tests for the root task interface."""

from __future__ import annotations

from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
MAKEFILE = ROOT / "Makefile"


def read_makefile() -> str:
    return MAKEFILE.read_text(encoding="utf-8")


def recipe_body(text: str, recipe: str) -> str:
    lines = text.splitlines()
    start = lines.index(f"{recipe}:") + 1
    body: list[str] = []
    for line in lines[start:]:
        if line and not line.startswith("\t"):
            break
        body.append(line)
    return "\n".join(body)


def test_test_recipe_runs_repo_and_package_checks():
    body = recipe_body(read_makefile(), "test")

    assert "uv run pytest" in body
    assert "uv run ruff format --check ." in body
    assert "uv run ruff check ." in body
    assert "uv run python scripts/validate_skill_anatomy.py" in body
    assert "uv run refcheck . --no-color" in body
    assert "cd agent-booster-pack-contract-first && npm test" in body
    assert "cd agent-booster-pack-proof && npm test" in body
    assert "cd agent-booster-pack-whiteboard && npm test" in body
    assert "cd eval && npm test" in body
    assert "cd eval && npm run typecheck" in body


def test_publish_recipes_use_the_pi_package_publish_script():
    text = read_makefile()

    assert "publish-pi:" in text
    assert "scripts/publish-pi-packages.sh" in recipe_body(text, "publish-pi")
    assert "publish-pi-dry-run:" in text
    assert "scripts/publish-pi-packages.sh --dry-run" in recipe_body(
        text, "publish-pi-dry-run"
    )
