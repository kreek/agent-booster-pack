#!/usr/bin/env bash
# Run after `stow agents` to wire cross-agent skill and command symlinks.
set -euo pipefail

AGENTS_SKILLS="$HOME/.agents/skills"
AGENTS_COMMANDS="$HOME/.agents/commands"

if [ ! -d "$AGENTS_SKILLS" ]; then
  # Most common cause of stow failing silently: a personal ~/AGENTS.md
  # that stow refuses to overwrite, which aborts the whole package.
  # Detect that case and surface the merge path instead of the generic
  # "run stow" hint.
  if [ -e "$HOME/AGENTS.md" ] && [ ! -L "$HOME/AGENTS.md" ]; then
    cat >&2 <<EOF
ERROR: $AGENTS_SKILLS is missing.

You already have a personal ~/AGENTS.md, which makes 'stow agents'
refuse to overwrite it and abort the whole package. To install without
losing your file:

  1. Merge the ABP guidance from agents/AGENTS.md into your ~/AGENTS.md.
     Keep your personal rules, and preserve the ABP rule that project
     AGENTS.md files are additive and must not weaken safety, proof,
     validation, or user-change-preservation requirements.

  2. Re-run stow with AGENTS.md ignored so the rest of the pack links:
       stow --target="\$HOME" --ignore='^AGENTS\\.md\$' agents

  3. Re-run this script:
       ./setup.sh

See the "Install" section of README.md for the full procedure.
EOF
    exit 1
  fi
  echo "ERROR: $AGENTS_SKILLS is missing. Run 'stow agents' from the repo root first." >&2
  exit 1
fi

AGENTS_SKILLS_REAL=$(cd "$AGENTS_SKILLS" && pwd -P)

points_into_agents_skills() {
  case "$1" in
    "$AGENTS_SKILLS"/* | "$AGENTS_SKILLS_REAL"/*) return 0 ;;
    *) return 1 ;;
  esac
}

prune_stale_skill_links() {
  local label="$1"
  local target_dir="$2"
  local target link_target

  for target in "$target_dir"/*; do
    [ -e "$target" ] || [ -L "$target" ] || continue
    [ -L "$target" ] || continue

    link_target=$(readlink "$target")
    if points_into_agents_skills "$link_target" && [ ! -e "$target" ]; then
      rm "$target"
      echo "$label: removed stale skill link $(basename "$target")"
    fi
  done
}

# Claude Code: symlink the whole skills dir
CLAUDE_SKILLS="$HOME/.claude/skills"
if [ -L "$CLAUDE_SKILLS" ]; then
  echo "${CLAUDE_SKILLS/#$HOME/~} already symlinked, skipping"
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
  prune_stale_skill_links "$label" "$target_dir"
  for skill_dir in "$AGENTS_SKILLS"/*/; do
    local skill_name
    local expected_target
    local expected_real_target
    local current_target
    skill_name=$(basename "$skill_dir")
    local target="$target_dir/$skill_name"
    expected_target="${skill_dir%/}/"
    expected_real_target="$AGENTS_SKILLS_REAL/$skill_name/"
    if [ -L "$target" ]; then
      current_target=$(readlink "$target")
      if [ "$current_target" = "$expected_target" ] ||
        [ "$current_target" = "${expected_target%/}" ] ||
        [ "$current_target" = "$expected_real_target" ] ||
        [ "$current_target" = "${expected_real_target%/}" ]; then
        echo "$label: $skill_name already symlinked, skipping"
      else
        echo "WARNING: $target is a symlink to $current_target. Expected $expected_target. Skipping."
      fi
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

# Pi, Cursor, Gemini CLI, OpenCode, and GitHub Copilot CLI read
# ~/.agents/skills/ directly per the agentskills.io de-facto convention — no
# per-tool symlinks needed. (Copilot CLI scans ~/.copilot, ~/.claude, and
# ~/.agents; relying on ~/.agents avoids duplicate registration with the
# ~/.claude/skills symlink above.)
echo ""
echo "Auto-discovered via ~/.agents/skills/ (no extra wiring needed):"
for tool in pi cursor gemini opencode copilot; do
  case "$tool" in
    pi) home_dir="$HOME/.pi" ;;
    cursor) home_dir="$HOME/.cursor" ;;
    gemini) home_dir="$HOME/.gemini" ;;
    opencode) home_dir="$HOME/.config/opencode" ;;
    copilot) home_dir="$HOME/.copilot" ;;
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

# Sync the in-repo Claude Code plugin for maintainers when uv is available.
# End-user installs use the committed plugin symlinks and should not need Python
# tooling just to fan out already-published skills.
REPO_ROOT=$(cd "$(dirname "$0")" && pwd)
GENERATE_PLUGIN="$REPO_ROOT/scripts/generate_plugin_symlinks.py"
if [ -f "$GENERATE_PLUGIN" ] && command -v uv >/dev/null 2>&1; then
  echo ""
  (cd "$REPO_ROOT" && uv run python "$GENERATE_PLUGIN" "$REPO_ROOT")
elif [ -f "$GENERATE_PLUGIN" ]; then
  echo ""
  echo "uv not found; skipping maintainer-only plugin sync"
fi

echo "Done."
