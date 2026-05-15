#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PACKAGE_DIR="$ROOT/agent-booster-pack"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

prune_conflicting_user_skill_symlinks() {
  local user_skills="$HOME/.agents/skills"
  [[ -d "$user_skills" ]] || return 0

  local skill_dir skill_name user_entry
  while IFS= read -r skill_dir; do
    skill_name="$(basename "$skill_dir")"
    user_entry="$user_skills/$skill_name"
    if [[ -L "$user_entry" ]]; then
      rm "$user_entry"
      printf 'Removed conflicting user skill symlink: %s\n' "$user_entry"
    fi
  done < <(find "$ROOT/agents/.agents/skills" -mindepth 1 -maxdepth 1 -type d | sort)
}

(
  cd "$PACKAGE_DIR"
  npm run prepack
  TARBALL_NAME="$(npm pack --ignore-scripts --pack-destination "$TMP_DIR" | tail -n 1)"
  prune_conflicting_user_skill_symlinks
  pi install "$TMP_DIR/$TARBALL_NAME"
)
