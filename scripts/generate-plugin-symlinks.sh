#!/usr/bin/env bash
# generate-plugin-symlinks.sh — sync plugin/skills/ and plugin/commands/ with
# the source of truth at agents/.agents/skills/ and agents/.agents/commands/.
#
# Run after adding, renaming, or deleting a skill or command. Idempotent.
#
# Usage:  generate-plugin-symlinks.sh [<repo-root>]
# Exit:   0 = synced, 1 = unexpected real file blocking a symlink, 2 = bad args.

set -eu

ROOT="${1:-$(cd "$(dirname "$0")/.." && pwd)}"

if [ ! -d "$ROOT/agents/.agents/skills" ]; then
  echo "not a repo root (no agents/.agents/skills): $ROOT" >&2
  exit 2
fi

SKILLS_SRC="$ROOT/agents/.agents/skills"
COMMANDS_SRC="$ROOT/agents/.agents/commands"
SKILLS_DEST="$ROOT/plugin/skills"
COMMANDS_DEST="$ROOT/plugin/commands"

mkdir -p "$SKILLS_DEST" "$COMMANDS_DEST"

prune_dest() {
  local dest="$1" src="$2"
  for entry in "$dest"/*; do
    [ -e "$entry" ] || [ -L "$entry" ] || continue
    name=$(basename "$entry")
    if [ ! -e "$src/$name" ]; then
      if [ -L "$entry" ]; then
        rm "$entry"
        echo "removed stale link: ${entry#$ROOT/}"
      else
        echo "WARNING: ${entry#$ROOT/} is not a symlink; leaving in place" >&2
      fi
    fi
  done
}

link_each() {
  local src="$1" dest="$2" rel_prefix="$3"
  for entry in "$src"/*; do
    [ -e "$entry" ] || continue
    name=$(basename "$entry")
    target="$dest/$name"
    expected="$rel_prefix/$name"
    if [ -L "$target" ]; then
      current=$(readlink "$target")
      if [ "$current" = "$expected" ]; then
        continue
      fi
      rm "$target"
    elif [ -e "$target" ]; then
      echo "ERROR: ${target#$ROOT/} exists as a real file/dir; remove it first" >&2
      exit 1
    fi
    ln -s "$expected" "$target"
    echo "linked ${target#$ROOT/} -> $expected"
  done
}

prune_dest "$SKILLS_DEST" "$SKILLS_SRC"
prune_dest "$COMMANDS_DEST" "$COMMANDS_SRC"

link_each "$SKILLS_SRC" "$SKILLS_DEST" "../../agents/.agents/skills"

if [ -d "$COMMANDS_SRC" ]; then
  link_each "$COMMANDS_SRC" "$COMMANDS_DEST" "../../agents/.agents/commands"
fi

echo "plugin symlinks in sync"
