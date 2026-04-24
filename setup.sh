#!/usr/bin/env bash
# Run after `stow agents` to wire cross-agent skill and command symlinks.
set -euo pipefail

AGENTS_SKILLS="$HOME/.agents/skills"
AGENTS_COMMANDS="$HOME/.agents/commands"

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

# Per-agent per-skill symlinks. Per-skill (not whole-dir) preserves any
# marketplace or user-added skills already in each agent's skills directory.
#
# Windsurf is conditional because it stores under ~/.codeium/windsurf/, which
# only exists if Windsurf is installed.
link_skills_per_agent() {
  local label="$1"
  local target_dir="$2"
  if [ ! -d "$(dirname "$target_dir")" ]; then
    echo "$label not installed — skipping (no $(dirname "$target_dir"))"
    return
  fi
  mkdir -p "$target_dir"
  for skill_dir in "$AGENTS_SKILLS"/*/; do
    local skill_name
    skill_name=$(basename "$skill_dir")
    local target="$target_dir/$skill_name"
    if [ -L "$target" ]; then
      echo "$label: $skill_name already symlinked, skipping"
    elif [ -d "$target" ]; then
      echo "WARNING: $target exists as a real directory. Skipping."
    else
      ln -s "$skill_dir" "$target"
      echo "Linked ${target/#$HOME/~} → ~/.agents/skills/$skill_name"
    fi
  done
}

# Codex CLI: ~/.codex/skills/
link_skills_per_agent "Codex" "$HOME/.codex/skills"

# Windsurf (Codeium Cascade): ~/.codeium/windsurf/skills/
link_skills_per_agent "Windsurf" "$HOME/.codeium/windsurf/skills"

# Pi, Cursor, Gemini CLI, and OpenCode read ~/.agents/skills/ directly per the
# agentskills.io de-facto convention — no per-tool symlinks needed.
echo ""
echo "Auto-discovered via ~/.agents/skills/ (no extra wiring needed):"
for tool in pi cursor gemini opencode; do
  case "$tool" in
    pi)       home_dir="$HOME/.pi" ;;
    cursor)   home_dir="$HOME/.cursor" ;;
    gemini)   home_dir="$HOME/.gemini" ;;
    opencode) home_dir="$HOME/.config/opencode" ;;
  esac
  if [ -d "$home_dir" ]; then
    echo "  - $tool ($home_dir exists)"
  else
    echo "  - $tool (not installed, will auto-discover if added)"
  fi
done
echo ""

# Commands: fan out each command file to every agent's expected location.
# Claude Code → ~/.claude/commands/<name>.md
# Codex CLI   → ~/.codex/prompts/<name>.md
declare -a COMMAND_TARGETS=(
  "$HOME/.claude/commands"
  "$HOME/.codex/prompts"
)

for dir in "${COMMAND_TARGETS[@]}"; do
  mkdir -p "$dir"
done

if [ -d "$AGENTS_COMMANDS" ]; then
  for cmd_file in "$AGENTS_COMMANDS"/*.md; do
    [ -e "$cmd_file" ] || continue
    cmd_name=$(basename "$cmd_file")
    for dir in "${COMMAND_TARGETS[@]}"; do
      target="$dir/$cmd_name"
      if [ -L "$target" ]; then
        echo "${target/#$HOME/~} already symlinked, skipping"
      elif [ -e "$target" ]; then
        echo "WARNING: $target exists as a real file. Move or remove it, then re-run."
      else
        ln -s "$cmd_file" "$target"
        echo "Linked ${target/#$HOME/~} → ~/.agents/commands/$cmd_name"
      fi
    done
  done
fi

echo "Done."
