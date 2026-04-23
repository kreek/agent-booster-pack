---
name: git-workflow-depth
description: Use when doing non-trivial git work: interactive rebase, conflict resolution, bisecting to find regressions, squashing or splitting commits, recovering from a bad merge or force push, cleaning up branch history, writing PR descriptions, or when the user asks how to undo something in git.
---

# Git Workflow Depth

## Interactive Rebase

Interactive rebase lets you rewrite history before it's shared.

```bash
# Rebase the last N commits
git rebase -i HEAD~N

# Rebase everything since branching from main
git rebase -i $(git merge-base HEAD main)
```

**Commands in the rebase todo list:** | Command | Action | |---|---| | `pick` |
Keep commit as-is | | `reword` | Keep changes, edit message | | `edit` | Pause
to amend the commit | | `squash` | Meld into previous commit, combine messages |
| `fixup` | Meld into previous commit, discard this message | | `drop` | Remove
the commit entirely | | `exec` | Run a shell command after this commit |

**Squash a PR branch to a clean history:**

```bash
git rebase -i $(git merge-base HEAD main)
# Mark all commits after the first as 'fixup'
```

**Reorder commits:** just reorder the lines in the todo list.

---

## Splitting a Commit

If a commit mixes unrelated changes, split it:

```bash
git rebase -i HEAD~3  # or however far back
# Mark the commit to split as 'edit'

# When paused at that commit:
git reset HEAD~1      # unstage all changes from the commit
git add -p            # stage first logical group
git commit -m "first part"
git add -p            # stage second logical group
git commit -m "second part"
git rebase --continue
```

---

## git bisect — Binary Search for Regressions

Find which commit introduced a bug by binary searching the history.

```bash
git bisect start
git bisect bad                    # current HEAD is broken
git bisect good v1.4.0            # last known good tag/commit

# Git checks out a midpoint commit
# Test manually, then:
git bisect good   # or: git bisect bad

# Repeat until bisect identifies the culprit commit
git bisect reset  # return to HEAD
```

**Automate with a test script:**

```bash
git bisect start
git bisect bad HEAD
git bisect good v1.4.0
git bisect run ./scripts/test-regression.sh
# Script must exit 0 for good, non-zero for bad
```

For flaky tests, use `git bisect skip` to skip commits where the test result is
unreliable.

---

## Conflict Resolution

**Use rerere (reuse recorded resolution):**

```bash
git config --global rerere.enabled true
```

Once enabled, git records how you resolved a conflict. If the same conflict
appears again (e.g. during rebase onto an updated main), git replays the
resolution automatically.

**Resolving conflicts:**

```bash
git mergetool           # opens a configured 3-way merge tool
# or edit files manually, then:
git add <resolved-file>
git rebase --continue   # or git merge --continue
```

**Abort if stuck:**

```bash
git rebase --abort      # returns to pre-rebase state
git merge --abort       # returns to pre-merge state
```

**Understanding conflict markers:**

```
<<<<<<< HEAD (your changes)
the_current_version()
=======
the_incoming_version()
>>>>>>> feature-branch
```

Middle section (`=======` down) is what's coming in. Top section is your current
state. You keep one, the other, or combine them, then remove all markers.

---

## Recovering with Reflog

The reflog records every position HEAD has been at. It's your safety net for "I
just destroyed my work."

```bash
git reflog            # show recent HEAD history
git reflog show main  # show history for a specific branch

# Recover a dropped commit
git checkout -b recovery <sha-from-reflog>

# Recover after a bad reset --hard
git reset --hard <sha-from-reflog>
```

The reflog is local only and expires after 90 days (default). Objects that no
longer have any reference are garbage collected. Use `git fsck --lost-found` to
find truly orphaned objects.

---

## Safe Force Push

Never `git push --force` to a shared branch. Use `--force-with-lease`:

```bash
git push --force-with-lease origin feature-branch
```

`--force-with-lease` refuses the push if someone else has pushed to the branch
since your last fetch. It's the only safe way to push a rewritten history.

To be extra safe, combine with `--force-if-includes` (Git 2.30+), which verifies
the remote tip is in your reflog.

---

## PR Description Template

A good PR description answers three questions: what, why, and how to verify.

```markdown
## What

One paragraph summarising the change. Not a list of files changed — explain what
the system can now do that it couldn't before.

## Why

The motivation: bug that was occurring, feature requested, tech debt that was
slowing things down, compliance requirement.

## How to test

- [ ] Run `make test` — all tests pass
- [ ] Hit `POST /orders` with the example payload in `docs/examples/order.json`
      — returns 201
- [ ] Check the `orders` table for the new row

## Rollback

`git revert <sha>` is safe — no schema changes. Or redeploy the previous image
tag.
```

---

## Conventional Comments (for code reviews)

Use labels to signal the weight of feedback, reducing misunderstandings:

| Label         | Meaning                                     |
| ------------- | ------------------------------------------- |
| `nitpick:`    | Minor style issue; take it or leave it      |
| `suggestion:` | Improvement idea, not blocking              |
| `question:`   | Genuinely asking, not criticism             |
| `issue:`      | Problem that should be fixed before merging |
| `blocker:`    | Must be addressed before this can merge     |
| `praise:`     | Good work, call it out explicitly           |

Example:
`suggestion: consider extracting this into a helper — it appears three times.`

---

## Useful One-Liners

```bash
# Show what changed in a branch vs main
git log --oneline main..HEAD

# Find which commit deleted a function
git log -S "functionName" --oneline

# Show all branches, including remote, sorted by last commit
git branch -a --sort=-committerdate

# Temporarily stash only staged changes
git stash push --staged -m "stash: staged work"

# Undo the last commit but keep the changes staged
git reset --soft HEAD~1

# Completely discard last commit and its changes (destructive!)
git reset --hard HEAD~1

# Cherry-pick a range of commits
git cherry-pick A^..B
```
