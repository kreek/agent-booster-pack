SHELL := /bin/bash
.SHELLFLAGS := -euo pipefail -c

.PHONY: test pi-install-local pi-uninstall-local publish-pi publish-pi-dry-run

ABP_PI_LOCAL_PACKAGE := $(abspath agent-booster-pack)

test:
	npm test
	node scripts/validate-skill-anatomy.mjs
	uv run refcheck . --no-color
	cd agent-booster-pack && npm test
	cd agent-booster-pack-contract-first && npm test
	cd agent-booster-pack-proof && npm test
	node --test plugin/test/self-review.test.mjs
	cd agent-booster-pack-specify && npm test
	cd eval && npm test
	cd eval && npm run typecheck

pi-install-local:
	scripts/pi-install-local.sh

pi-uninstall-local:
	pi remove "$(ABP_PI_LOCAL_PACKAGE)"

publish-pi:
	scripts/publish-pi-packages.sh

publish-pi-dry-run:
	scripts/publish-pi-packages.sh --dry-run
