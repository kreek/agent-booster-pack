---
name: git-workflow
description: Use for git workflow, branch hygiene, history edits, conflict recovery, staging, and commits.
---

# Git Workflow

## Iron Law

`ONE LOGICAL CHANGE PER COMMIT. NEVER REWRITE SHARED HISTORY OR SKIP HOOKS.`

Git history is a review, bisect, revert, and release surface. Keep it
recoverable, scoped, and honest.

## When to Use

- Grouping dirty or staged changes, writing commit messages, splitting
  commits, or committing approved work.
- Rebases, merge conflicts, bisects, reflog recovery, branch cleanup,
  PR history repair, or force-push decisions.

## When NOT to Use

- Reviewing implementation correctness; use `code-review`.
- Refactor planning; use `refactoring`.
- CI failure triage; use the relevant CI/GitHub workflow.

## Core Ideas

1. Inspect before mutation: status, staged state, diff stats, branch,
   upstream, merge/rebase state, and recent log.
2. Never commit on `main` or `master`; create or switch to a topic
   branch first.
3. Group by meaning. Keep code, tests, and docs together when they
   prove one behavior; split refactors, generated output, formatting,
   and behavior changes.
4. Name files explicitly; never `git add .` or `git add -A` in a
   messy tree.
5. Rewrite only local or explicitly solo branches. Prefer
   `--force-with-lease --force-if-includes` over bare force.
6. Preserve a recovery point before risky operations.
7. Resolve conflicts by preserving intent from both sides, then run
   the relevant checks.

## Workflow

1. Read status, staged/unstaged diffs, branch/upstream, merge/rebase
   state, and recent log. Stop on unexpected state.
2. Detect hazards: conflicts, secrets, generated churn, mixed changes
   in one file, unrelated staged work, direct work on `main`/`master`,
   shared history rewrites, or in-flight work that needs a separate
   branch/worktree.
3. For commits, propose logical groups with subject, files, and why.
   A direct "commit this" / `$git-workflow` request is approval to
   package the current reviewed work, not unrelated files.
4. For history operations, name the recovery point and whether the
   branch is local/solo/shared before rewriting, deleting, or
   force-pushing.
5. Execute the smallest safe operation. Verify log/range-diff, status,
   file membership, and relevant tests or repro commands.

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
- [ ] Working tree has no unresolved merge/rebase state or conflict
      markers.
- [ ] Rewritten history was local/solo or explicitly approved.
- [ ] `range-diff` or log inspection confirms intended commits remain.
- [ ] Force pushes, if any, used lease/inclusion protection.
- [ ] Reflog/recovery point is available for rollback.

## Handoffs

- Use `refactoring` when separating structural and behavioral changes
  requires code changes.
- Use `release` when the working tree includes a version manifest
  bump, CHANGELOG entry, deprecation, or release tag.
- Use `debugging` before bisecting if the failure is not reproducible.
- Respect Codex/user sandbox approval requirements; this skill does
  not bypass permission gates.

## References

- `git rebase`: <https://git-scm.com/docs/git-rebase>
- `git bisect`: <https://git-scm.com/docs/git-bisect>
- `git range-diff`: <https://git-scm.com/docs/git-range-diff>
- Pro Git: <https://git-scm.com/book/en/v2>
