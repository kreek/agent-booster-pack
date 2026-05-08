#!/usr/bin/env bash
# Publish ABP Pi npm packages in dependency order.
#
# Usage:
#   scripts/publish-pi-packages.sh [--dry-run] [--otp OTP]
#
# The package versions come from each package.json. Already-published exact
# versions are skipped so the script can be re-run safely after a partial
# publish. Actual publishing mutates npm registry state; run it only when the
# release commit is clean and tagged.

set -euo pipefail

dry_run=false
otp=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run)
      dry_run=true
      shift
      ;;
    --otp)
      if [[ $# -lt 2 || -z "${2:-}" ]]; then
        echo "error: --otp requires a value" >&2
        exit 64
      fi
      otp="$2"
      shift 2
      ;;
    -h|--help)
      sed -n '2,12p' "$0" | sed 's/^# \{0,1\}//'
      exit 0
      ;;
    *)
      echo "error: unknown argument '$1'" >&2
      exit 64
      ;;
  esac
done

repo_root="$(git rev-parse --show-toplevel)"
cd "$repo_root"

package_dirs=(
  "agent-booster-pack-skills"
  "agent-booster-pack-contract-first"
  "agent-booster-pack-proof"
  "agent-booster-pack-whiteboard"
  "agent-booster-pack"
)

package_field() {
  local package_dir="$1"
  local field="$2"
  node -e 'const fs = require("fs"); const pkg = JSON.parse(fs.readFileSync(process.argv[1], "utf8")); console.log(pkg[process.argv[2]]);' \
    "$package_dir/package.json" "$field"
}

is_published() {
  local name="$1"
  local version="$2"
  npm view "$name@$version" version >/dev/null 2>&1
}

require_publish_ready() {
  if [[ -n "$(git status --porcelain)" ]]; then
    echo "error: working tree is not clean" >&2
    exit 1
  fi

  if ! git describe --tags --match 'v[0-9]*.[0-9]*.[0-9]*' --abbrev=0 >/dev/null 2>&1; then
    echo "error: no reachable vX.Y.Z release tag found" >&2
    exit 1
  fi

  npm whoami >/dev/null
}

publish_package() {
  local package_dir="$1"
  local name
  local version
  name="$(package_field "$package_dir" name)"
  version="$(package_field "$package_dir" version)"

  if is_published "$name" "$version"; then
    echo "skip $name@$version (already published)"
    return
  fi

  if $dry_run; then
    echo "would publish $name@$version"
    return
  fi

  echo "publishing $name@$version"
  local args=(publish "./$package_dir" --access public)
  if [[ -n "$otp" ]]; then
    args+=(--otp "$otp")
  fi
  npm "${args[@]}"
}

if ! $dry_run; then
  require_publish_ready
fi

for package_dir in "${package_dirs[@]}"; do
  publish_package "$package_dir"
done
