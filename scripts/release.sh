#!/usr/bin/env bash
# Cut a new ABP release.
#
# Usage:
#   scripts/release.sh X.Y.Z [--dry-run]
#
# Bumps the version in every manifest, promotes the [Unreleased] section of
# CHANGELOG.md to [X.Y.Z], runs the validators, commits, and tags vX.Y.Z.
# Pushing the commit + tag and creating the GitHub Release stay manual on
# purpose: they are the moment of "I really mean it" for shared state.
#
# Requires: jq, uv (for validators).

set -euo pipefail

dry_run=false
version=""
for arg in "$@"; do
  case "$arg" in
    --dry-run) dry_run=true ;;
    -h|--help)
      sed -n '2,12p' "$0" | sed 's/^# \{0,1\}//'
      exit 0
      ;;
    -*) echo "error: unknown flag '$arg'" >&2; exit 64 ;;
    *)
      if [[ -n "$version" ]]; then
        echo "error: extra positional argument '$arg'" >&2
        exit 64
      fi
      version="$arg"
      ;;
  esac
done

if [[ -z "$version" ]]; then
  echo "usage: $0 X.Y.Z [--dry-run]" >&2
  exit 64
fi

if [[ ! "$version" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "error: version must be X.Y.Z (semver), got '$version'" >&2
  exit 65
fi

command -v jq >/dev/null 2>&1 || {
  echo "error: jq not found. install with 'brew install jq'" >&2
  exit 1
}

repo_root="$(git rev-parse --show-toplevel)"
cd "$repo_root"

if [[ "$(git rev-parse --abbrev-ref HEAD)" != "main" ]]; then
  echo "error: not on main branch (current: $(git rev-parse --abbrev-ref HEAD))" >&2
  exit 1
fi

if [[ -n "$(git status --porcelain)" ]]; then
  echo "error: working tree is not clean" >&2
  exit 1
fi

if git rev-parse --verify "v$version" >/dev/null 2>&1; then
  echo "error: tag v$version already exists" >&2
  exit 1
fi

today="$(date -u +%Y-%m-%d)"

bump_json() {
  local file="$1"
  local jq_expr="$2"
  [[ -f "$file" ]] || return 0
  local tmp
  tmp="$(mktemp)"
  jq --arg v "$version" "$jq_expr" "$file" > "$tmp"
  if $dry_run; then
    echo "  would update $file"
    rm -f "$tmp"
  else
    mv "$tmp" "$file"
    echo "  updated $file"
  fi
}

echo "==> bumping manifest versions to $version"
bump_json ".claude-plugin/marketplace.json" '.metadata.version = $v | .plugins[0].version = $v'
bump_json "plugin/.claude-plugin/plugin.json" '.version = $v'
bump_json "plugin/.codex-plugin/plugin.json" '.version = $v'
bump_json "pi/package.json" '.version = $v'

echo "==> promoting CHANGELOG [Unreleased] section to [$version]"
if grep -q "^## \[Unreleased\]" CHANGELOG.md; then
  tmp="$(mktemp)"
  awk -v v="$version" -v d="$today" '
    /^## \[Unreleased\]/ {
      print
      print ""
      print "## [" v "] (" d ")"
      next
    }
    { print }
  ' CHANGELOG.md > "$tmp"
  if $dry_run; then
    echo "  would update CHANGELOG.md"
    rm -f "$tmp"
  else
    mv "$tmp" CHANGELOG.md
    echo "  updated CHANGELOG.md"
  fi
else
  echo "  warning: no [Unreleased] section found; skipping CHANGELOG promotion"
fi

echo "==> running validators"
uv run python scripts/validate_skill_anatomy.py
uv run pytest -q
uv run ruff format --check .
uv run ruff check .
uv run refcheck . --no-color

if $dry_run; then
  echo
  echo "==> dry run complete; no commit, no tag, manifests reverted"
  git checkout -- .claude-plugin/marketplace.json plugin/.claude-plugin/plugin.json plugin/.codex-plugin/plugin.json pi/package.json CHANGELOG.md 2>/dev/null || true
  exit 0
fi

echo "==> committing release"
git add CHANGELOG.md .claude-plugin/marketplace.json plugin/.claude-plugin/plugin.json plugin/.codex-plugin/plugin.json pi/package.json
git commit -m "chore: release v$version"
git tag -a "v$version" -m "v$version"

echo
echo "==> release v$version is staged locally"
echo "    next steps (run when ready):"
echo "      git push origin main"
echo "      git push origin v$version"
echo "      gh release create v$version --title \"v$version\" \\"
echo "        --notes \"\$(awk '/^## \\[$version\\]/{flag=1;next} /^## \\[/{flag=0} flag' CHANGELOG.md)\""
