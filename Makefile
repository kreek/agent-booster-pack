SHELL := /bin/bash
.SHELLFLAGS := -euo pipefail -c

.PHONY: test publish-pi publish-pi-dry-run

test:
	npm test
	node scripts/validate-skill-anatomy.mjs
	uv run refcheck . --no-color
	cd agent-booster-pack && npm test
	cd agent-booster-pack-contract-first && npm test
	cd agent-booster-pack-proof && npm test
	cd agent-booster-pack-whiteboard && npm test
	cd eval && npm test
	cd eval && npm run typecheck

publish-pi:
	scripts/publish-pi-packages.sh

publish-pi-dry-run:
	scripts/publish-pi-packages.sh --dry-run
