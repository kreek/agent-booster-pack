---
name: git
description: >-
  Use for non-trivial git work: rebase, conflicts, bisect, squash/split,
  recovery from bad merges or force pushes, branch cleanup, undoing changes,
  and PR descriptions.
---

# Git

## Iron Law

`NEVER REWRITE SHARED HISTORY. NEVER FORCE-PUSH WITHOUT LEASE AND CONFIRMATION.`

## When to Use

- Interactive rebase, conflict resolution, bisect, reflog recovery,
  split/squash commits, branch cleanup, force-push decisions, or PR
  description repair.

## When NOT to Use

- Simple clean commit grouping; use `commit`.
- Code refactoring plan; use `refactoring`.
- CI failure triage; use relevant CI/GitHub tooling.

## Core Ideas

1. Inspect state before mutation: status, branch, upstream, rebase/merge
   state, and recent log. Preserve a recovery point before risky
   operations.
2. Rewrite only local or explicitly solo branches.
3. Prefer `--force-with-lease --force-if-includes` over bare force.
4. Use `git bisect` for regressions instead of guessing.
5. Resolve conflicts by preserving intent from both sides, then run the
   relevant tests.
6. PR descriptions explain what changed, why, how tested, and rollback.

## Workflow

1. Read `git status`, current branch/upstream, and recent history.
   Identify whether the operation rewrites, deletes, merges, or only
   inspects.
2. If risky, name the recovery point and confirm the branch is not
   shared.
3. Execute the smallest git operation that moves toward the goal;
   verify with status, log/range-diff, tests, or repro command. Stop on
   unexpected state.

## Verification

- [ ] Working tree has no unresolved merge/rebase state or conflict
      markers.
- [ ] Rewritten history was local/solo or explicitly approved.
- [ ] `range-diff` or log inspection confirms intended commits remain.
- [ ] Force pushes, if any, used lease/inclusion protection.
- [ ] Reflog/recovery point is available for rollback.

## Handoffs

- Use `commit` for grouping a dirty tree into clean commits.
- Use `refactoring` when history work is part of separating structural
  and behavioral changes.
- Use `debugging` before bisecting if the failure is not reproducible.

## References

- `git rebase`: <https://git-scm.com/docs/git-rebase>
- `git bisect`: <https://git-scm.com/docs/git-bisect>
- `git range-diff`: <https://git-scm.com/docs/git-range-diff>
- Pro Git: <https://git-scm.com/book/en/v2>
