---
name: git-workflow-depth
description:
  Use when doing non-trivial git work — interactive rebase, conflict resolution,
  bisecting to find regressions, squashing or splitting commits, recovering from
  a bad merge or force push, cleaning up branch history, or writing PR
  descriptions. Also use when the user asks how to undo something in git.
---

# Git Workflow Depth

## Iron Law

`NEVER REWRITE SHARED HISTORY. NEVER FORCE-PUSH WITHOUT LEASE AND CONFIRMATION.`

Git can recover almost anything locally; shared history damage spreads to
everyone else.

## When to Use

- Interactive rebase, conflict resolution, bisect, reflog recovery, split/squash
  commits, branch cleanup, force-push decisions, or PR description repair.

## When NOT to Use

- Simple clean commit grouping; use `smart-commit`.
- Code refactoring plan; use `refactoring-safely`.
- CI failure triage; use relevant CI/GitHub tooling.

## Core Ideas

1. Inspect state before mutation: status, branch, upstream, rebase/merge state,
   and recent log.
2. Preserve a recovery point before risky operations.
3. Rewrite only local or explicitly solo branches.
4. Prefer `--force-with-lease --force-if-includes` over bare force.
5. Use `git bisect` for regressions instead of guessing.
6. Resolve conflicts by preserving intent from both sides, then run the relevant
   tests.
7. PR descriptions should explain what changed, why, how tested, and rollback.

## Workflow

1. Read `git status`, current branch/upstream, and recent history.
2. Identify whether the operation rewrites, deletes, merges, or only inspects.
3. If risky, name the recovery point and confirm the branch is not shared.
4. Execute the smallest git operation that moves toward the goal.
5. Verify with status, log/range-diff, tests, or repro command as appropriate.
6. Stop on unexpected state; do not stack corrective commands blindly.

## Verification

- [ ] Working tree has no unresolved merge/rebase state or conflict markers.
- [ ] Rewritten history was local/solo or explicitly approved.
- [ ] `range-diff` or log inspection confirms intended commits remain.
- [ ] Conflict resolutions pass `git diff --check` and relevant tests.
- [ ] Bisect result reproduces when checked out fresh.
- [ ] Force pushes, if any, used lease/inclusion protection.
- [ ] Reflog/recovery point is available for rollback.

## Handoffs

- Use `smart-commit` for grouping a dirty tree into clean commits.
- Use `refactoring-safely` when history work is part of separating structural
  and behavioral changes.
- Use `debugging-methodology` before bisecting if the failure is not
  reproducible.

## References

- `git rebase`: <https://git-scm.com/docs/git-rebase>
- `git bisect`: <https://git-scm.com/docs/git-bisect>
- `git range-diff`: <https://git-scm.com/docs/git-range-diff>
- Pro Git: <https://git-scm.com/book/en/v2>
