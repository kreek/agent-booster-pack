---
name: commit
description: >-
  Use to organize a messy working tree into clean commits, group uncommitted
  or staged changes, split commits, or write concise commit messages.
---

# Commit

## Iron Law

`ONE LOGICAL CHANGE PER COMMIT. NEVER --no-verify.`

## When to Use

- Organizing an uncommitted working tree, splitting staged/unstaged
  changes, creating commit messages, or committing approved groups.

## When NOT to Use

- Interactive rebase, conflict resolution, bisect, or recovery; use
  `git`.
- Code-reviewing the implementation itself; use the relevant domain
  skill.
- User asked only for a review; propose grouping and stop.

## Core Ideas

1. Inspect before touching: status, staged state, diff stats, recent
   log. Read the actual diffs before grouping.
2. Never commit on `main` or `master`; create or switch to a topic
   branch first. Use or request a separate worktree when new work should
   stay independent from an in-flight branch.
3. Group by meaning, not by file type or convenience. Keep code, tests,
   and docs together when they describe one behavior. Split refactors,
   formatting, generated output, and behavior changes.
4. Ask for approval before staging or committing groups when scope is
   ambiguous. A direct "commit this" / `$commit` is approval to package
   the current reviewed work, but not approval to sweep in unrelated
   files.
5. Name files explicitly; never `git add .` or `git add -A` in a messy
   tree.

## Workflow

1. Run status, branch/upstream, and diff/stat inspection. Stop if the
   current branch is `main`/`master`; ask for or create a topic
   branch.
2. Read diffs for staged and unstaged changes. Detect hazards:
   conflicts, secrets, generated churn, mixed changes in one file,
   unrelated staged work, or unrelated in-flight work that belongs in
   another branch or worktree.
3. Propose commits with subject, files, and why. For an explicit
   commit request with an obvious single group, state the group and
   proceed. Stage named files and commit one group at a time after
   approval. Recommend a separate branch or worktree for work that
   should remain independent from the current commit series. Verify log,
   status, branch, and file membership after each commit.

## Verification

- [ ] `git status --short` is clean or only contains explicitly
      deferred work.
- [ ] Commits were made on a topic branch, not `main` or `master`.
- [ ] Every commit subject completes "When applied, this commit will
      \_\_\_".
- [ ] No commit bundles unrelated behavior, refactor, formatting,
      generated output, or vendor churn.
- [ ] No file was staged outside the approved group.
- [ ] No `--no-verify`, `--no-gpg-sign`, or `--no-signoff` was used.
- [ ] No force-push occurred unless explicitly approved and handled
      through `git`.
- [ ] Recent `git log --oneline` has no WIP, fixup, squash, misc, or
      vague subjects.

## Handoffs

- Use `git` for history rewriting, conflicts, bisect, force-push, or
  recovery.
- Use `refactoring` when splitting structural and behavioral work
  requires code changes.
- Use `versioning` when the working tree includes a version manifest
  bump, CHANGELOG entry, deprecation, or release tag; the bump and
  CHANGELOG are classified there before being committed here.
- Respect Codex/user sandbox approval requirements; this skill does
  not bypass permission gates.
