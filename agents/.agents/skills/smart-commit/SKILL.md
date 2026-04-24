---
name: smart-commit
description:
  Use when asked to organise a messy working tree into clean commits, review
  uncommitted changes and propose a logical grouping, or create concise commit
  messages for staged changes. Also use when the user says "commit this", "clean
  up my commits", or asks to split changes into separate commits.
---

# Smart Commit

## Iron Law

`ONE LOGICAL CHANGE PER COMMIT. NEVER --no-verify.`

Commits are review, bisect, revert, and release units. A commit that skipped
hooks or bundles unrelated changes cannot be trusted.

## When to Use

- Organizing an uncommitted working tree, splitting staged/unstaged changes,
  creating commit messages, or committing approved groups.

## When NOT to Use

- Interactive rebase, conflict resolution, bisect, or recovery; use
  `git-workflow-depth`.
- Code-reviewing the implementation itself; use the relevant domain skill.
- User asked only for a review; propose grouping and stop.

## Core Ideas

1. Inspect before touching: status, staged state, diff stats, and recent log.
2. Read the actual diffs before grouping.
3. Group by meaning, not by file type or convenience.
4. Keep code, tests, and docs together when they describe one behavior.
5. Split refactors, formatting, generated output, and behavior changes.
6. Ask for approval before staging or committing groups.
7. Name files explicitly; never `git add .` or `git add -A` in a messy tree.

## Workflow

1. Run status and diff/stat inspection.
2. Read diffs for staged and unstaged changes.
3. Detect hazards: conflicts, secrets, generated churn, mixed changes in one
   file, unrelated staged work.
4. Propose commits with subject, files, and why.
5. After approval, stage named files and commit one group at a time.
6. Verify log, status, and file membership after each commit.

## Verification

- [ ] `git status --short` is clean or only contains explicitly deferred work.
- [ ] Every commit subject completes "When applied, this commit will \_\_\_".
- [ ] No commit bundles unrelated behavior, refactor, formatting, generated
      output, or vendor churn.
- [ ] No file was staged outside the approved group.
- [ ] No `--no-verify`, `--no-gpg-sign`, or `--no-signoff` was used.
- [ ] No force-push occurred unless explicitly approved and handled through
      `git-workflow-depth`.
- [ ] Recent `git log --oneline` has no WIP, fixup, squash, misc, or vague
      subjects.

## Handoffs

- Use `git-workflow-depth` for history rewriting, conflicts, bisect, force-push,
  or recovery.
- Use `refactoring-safely` when splitting structural and behavioral work
  requires code changes.
- Respect Codex/user sandbox approval requirements; this skill does not bypass
  permission gates.

## Tools

- `scripts/block-dangerous-git.sh`: optional PreToolUse hook that blocks
  destructive git commands and trust-bypassing flags.
