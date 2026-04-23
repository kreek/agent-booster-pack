#!/usr/bin/env bash
# Run after `stow agents` to wire cross-agent skill symlinks.
set -euo pipefail

AGENTS_SKILLS="$HOME/.agents/skills"

# Claude Code: symlink the whole skills dir
CLAUDE_SKILLS="$HOME/.claude/skills"
if [ -L "$CLAUDE_SKILLS" ]; then
  echo "~/.claude/skills already symlinked, skipping"
elif [ -d "$CLAUDE_SKILLS" ]; then
  echo "WARNING: ~/.claude/skills exists as a real directory. Move or remove it, then re-run."
else
  ln -s "$AGENTS_SKILLS" "$CLAUDE_SKILLS"
  echo "Linked ~/.claude/skills → ~/.agents/skills"
fi

# Codex: add per-skill symlinks inside existing ~/.codex/skills/
# This preserves marketplace skills (codex-primary-runtime, etc.)
CODEX_SKILLS="$HOME/.codex/skills"
if [ ! -d "$CODEX_SKILLS" ]; then
  mkdir -p "$CODEX_SKILLS"
fi

for skill_dir in "$AGENTS_SKILLS"/*/; do
  skill_name=$(basename "$skill_dir")
  target="$CODEX_SKILLS/$skill_name"
  if [ -L "$target" ]; then
    echo "~/.codex/skills/$skill_name already symlinked, skipping"
  elif [ -d "$target" ]; then
    echo "WARNING: ~/.codex/skills/$skill_name exists as a real directory. Skipping."
  else
    ln -s "$skill_dir" "$target"
    echo "Linked ~/.codex/skills/$skill_name → ~/.agents/skills/$skill_name"
  fi
done

echo "Done."
