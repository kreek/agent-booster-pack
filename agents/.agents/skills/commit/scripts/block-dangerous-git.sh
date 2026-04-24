#!/usr/bin/env bash
# block-dangerous-git.sh — Claude Code PreToolUse hook that rejects destructive
# git commands before they execute. Install as an entry under hooks.PreToolUse
# with matcher=Bash. Exit 0 = allow, 2 = block (harness rejects the tool call).
#
# Input: JSON on stdin with a tool_input.command string.
# Output: on block, a BLOCKED message to stderr + exit 2.
# Self-test: bash block-dangerous-git.sh --self-test

set -u

if [ "${1:-}" = "--self-test" ]; then
  fails=0
  check() {
    label="$1"; input="$2"; expect="$3"
    got=$(printf '%s' "$input" | "$0" >/dev/null 2>&1; echo $?)
    if [ "$got" != "$expect" ]; then
      printf 'FAIL %s: expected exit %s, got %s\n' "$label" "$expect" "$got" >&2
      fails=$((fails+1))
    fi
  }
  check "plain ls"            '{"tool_input":{"command":"ls -la"}}'                        0
  check "git status"          '{"tool_input":{"command":"git status"}}'                    0
  check "git log"             '{"tool_input":{"command":"git log --oneline -5"}}'          0
  check "git push"            '{"tool_input":{"command":"git push origin main"}}'          2
  check "git push --force"    '{"tool_input":{"command":"git push -f origin main"}}'       2
  check "reset --hard"        '{"tool_input":{"command":"git reset --hard HEAD~1"}}'       2
  check "clean -fd"           '{"tool_input":{"command":"git clean -fd"}}'                 2
  check "branch -D"           '{"tool_input":{"command":"git branch -D feature/old"}}'     2
  check "checkout ."          '{"tool_input":{"command":"git checkout ."}}'                2
  check "restore ."           '{"tool_input":{"command":"git restore ."}}'                 2
  check "--no-verify"         '{"tool_input":{"command":"git commit --no-verify -m wip"}}' 2
  check "--no-gpg-sign"       '{"tool_input":{"command":"git commit --no-gpg-sign -m x"}}' 2
  check "chained push"        '{"tool_input":{"command":"git add -A && git push"}}'        2
  check "piped restore"       '{"tool_input":{"command":"echo y | git restore ."}}'        2
  check "substring git-push"  '{"tool_input":{"command":"./git-pusher.sh"}}'               0
  if [ "$fails" -eq 0 ]; then
    echo "self-test ok"
    exit 0
  fi
  echo "self-test failed: $fails check(s)" >&2
  exit 1
fi

# Read stdin. If empty or non-JSON-like, allow.
input=$(cat)
[ -z "$input" ] && exit 0

# Extract the command. Use jq if available, fall back to sed.
if command -v jq >/dev/null 2>&1; then
  cmd=$(printf '%s' "$input" | jq -r '.tool_input.command // empty' 2>/dev/null)
else
  cmd=$(printf '%s' "$input" | sed -n 's/.*"command"[[:space:]]*:[[:space:]]*"\(\([^"\\]\|\\.\)*\)".*/\1/p' | head -1)
fi
[ -z "$cmd" ] && exit 0

block() {
  printf 'BLOCKED by smart-commit/block-dangerous-git.sh: %s\n' "$1" >&2
  printf 'Command: %s\n' "$cmd" >&2
  printf 'If this block is wrong, tell your human partner; do not retry with a workaround.\n' >&2
  exit 2
}

# Patterns. Each checks for git followed by the dangerous subcommand, allowing
# pipes/semicolons/&& as compound separators. Substrings of filenames like
# "git-pusher.sh" are not matched because we require a word boundary before
# "git" and whitespace between "git" and the subcommand.
GIT_PREFIX='(^|[[:space:];&|])git[[:space:]]+'

if printf '%s' "$cmd" | grep -qE "${GIT_PREFIX}push([[:space:]]|$)"; then
  block "git push is not allowed from the agent; ask your human partner to push."
fi
if printf '%s' "$cmd" | grep -qE "${GIT_PREFIX}reset[[:space:]]+.*--hard"; then
  block "git reset --hard destroys uncommitted work."
fi
if printf '%s' "$cmd" | grep -qE "${GIT_PREFIX}clean[[:space:]]+-[[:alnum:]]*f"; then
  block "git clean -f deletes untracked files permanently."
fi
if printf '%s' "$cmd" | grep -qE "${GIT_PREFIX}branch[[:space:]]+-D[[:space:]]"; then
  block "git branch -D force-deletes branches even if unmerged."
fi
if printf '%s' "$cmd" | grep -qE "${GIT_PREFIX}checkout[[:space:]]+\.([[:space:]]|$)"; then
  block "git checkout . discards all unstaged changes."
fi
if printf '%s' "$cmd" | grep -qE "${GIT_PREFIX}restore[[:space:]]+\.([[:space:]]|$)"; then
  block "git restore . discards all unstaged changes."
fi
if printf '%s' "$cmd" | grep -qE "${GIT_PREFIX}.*--no-verify([[:space:]]|$)"; then
  block "--no-verify skips pre-commit and commit-msg hooks."
fi
if printf '%s' "$cmd" | grep -qE "${GIT_PREFIX}.*--no-gpg-sign([[:space:]]|$)"; then
  block "--no-gpg-sign bypasses commit signing."
fi
if printf '%s' "$cmd" | grep -qE "${GIT_PREFIX}.*--no-signoff([[:space:]]|$)"; then
  block "--no-signoff bypasses DCO sign-off."
fi

exit 0
