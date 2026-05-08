SHELL := /bin/bash
.SHELLFLAGS := -euo pipefail -c

.PHONY: test publish-pi publish-pi-dry-run

test:
	uv run pytest
	uv run ruff format --check .
	uv run ruff check .
	uv run python scripts/validate_skill_anatomy.py
	uv run refcheck . --no-color
	cd agent-booster-pack-contract-first && npm test
	cd agent-booster-pack-proof && npm test
	cd agent-booster-pack-whiteboard && npm test
	cd eval && npm test
	cd eval && npm run typecheck

publish-pi:
	scripts/publish-pi-packages.sh

publish-pi-dry-run:
	scripts/publish-pi-packages.sh --dry-run
