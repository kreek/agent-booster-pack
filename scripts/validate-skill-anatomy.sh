#!/usr/bin/env bash
# validate-skill-anatomy.sh — assert every SKILL.md in the repo conforms to
# the playbook anatomy: frontmatter with name+description, required sections
# (When to Use, When NOT to Use, Common Rationalizations, Red Flags,
# Verification), no inline "per <expert>" attribution in rules.
#
# Usage:  validate-skill-anatomy.sh [<skills-dir>]
#         validate-skill-anatomy.sh --self-test
# Exit:   0 = all skills conform, 1 = findings, 2 = usage error.

set -u

SELF_TEST=0
DIR="${1:-}"
case "${1:-}" in
  --self-test) SELF_TEST=1 ;;
  -h|--help) sed -n '2,10p' "$0"; exit 0 ;;
  "") DIR="$(cd "$(dirname "$0")/.." && pwd)/agents/.agents/skills" ;;
  *) DIR="$1" ;;
esac

run_self_test() {
  tmp=$(mktemp -d)
  trap 'rm -rf "$tmp"' EXIT

  # Conforming skill.
  mkdir -p "$tmp/good"
  cat >"$tmp/good/SKILL.md" <<'EOF'
---
name: good
description: Ok
---

# Good

## When to Use
- trigger

## When NOT to Use
- other

## Common Rationalizations
| Excuse | Reality |
| --- | --- |
| a | b |

## Red Flags
- something

## Verification
- [ ] check
EOF

  # Non-conforming skill (missing several sections).
  mkdir -p "$tmp/bad"
  cat >"$tmp/bad/SKILL.md" <<'EOF'
---
name: bad
description: Not good
---

# Bad

Per Rich Hickey, prefer values over places.

## Overview

Stuff.
EOF

  out=$("$0" "$tmp" 2>&1) || true
  for expect in "bad/SKILL.md" "When to Use" "Common Rationalizations" "per <expert>"; do
    case "$out" in
      *"$expect"*) ;;
      *) printf 'self-test failed: missing %q in output\n' "$expect" >&2
         printf '%s\n' "$out" >&2
         exit 1 ;;
    esac
  done
  # And the good one should not be flagged.
  if printf '%s' "$out" | grep -q 'good/SKILL.md'; then
    echo "self-test failed: good skill flagged" >&2
    printf '%s\n' "$out" >&2
    exit 1
  fi
  echo "self-test ok"
  exit 0
}

[ "$SELF_TEST" -eq 1 ] && run_self_test

if [ ! -d "$DIR" ]; then
  echo "not a directory: $DIR" >&2
  exit 2
fi

fails=0

while IFS= read -r f; do
  problems=""
  add() { problems="${problems}${problems:+
  }- $1"; }

  head="$(head -30 "$f")"
  body="$(cat "$f")"

  # Frontmatter name + description
  printf '%s' "$head" | grep -qE '^name:[[:space:]]+[a-z][a-z0-9-]*[[:space:]]*$' \
    || add "frontmatter missing name or not kebab-case"
  printf '%s' "$head" | grep -qE '^description:' \
    || add "frontmatter missing description"

  # Required sections
  for heading in \
    "When to Use" \
    "When NOT to Use" \
    "Common Rationalizations" \
    "Red Flags" \
    "Verification"
  do
    if ! printf '%s' "$body" | grep -qE "^##+[[:space:]]+${heading}"; then
      add "missing section: ## ${heading}"
    fi
  done

  # Inline expert attribution (per <name>, per <X> …) in body — skip in
  # References / Canon sections which are expected to cite people.
  attributions="$(printf '%s' "$body" \
    | awk 'BEGIN{inref=0} /^##+ (References|Canon)/ {inref=1; next} inref==0 {print}' \
    | grep -iE '\bper ([A-Z][a-z]+[[:space:]]+)?[A-Z][a-z]+' \
    | grep -v "^>" \
    || true)"
  if [ -n "$attributions" ]; then
    add "inline 'per <expert>' attribution found — move to References"
  fi

  if [ -n "$problems" ]; then
    rel="${f#$DIR/}"
    printf '%s\n  %s\n' "$rel" "$problems"
    fails=$((fails+1))
  fi
done < <(find "$DIR" -name SKILL.md -type f | sort)

if [ "$fails" -eq 0 ]; then
  echo "all skills conform to the anatomy"
  exit 0
fi

echo
echo "$fails skill(s) failed anatomy validation"
exit 1
