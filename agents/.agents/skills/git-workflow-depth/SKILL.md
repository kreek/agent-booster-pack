---
name: git-workflow-depth
description: Use when doing non-trivial git work: interactive rebase, conflict resolution, bisecting to find regressions, squashing or splitting commits, recovering from a bad merge or force push, cleaning up branch history, writing PR descriptions, or when the user asks how to undo something in git.
---

# Git Workflow Depth

## Rewrite or preserve history?

| Situation                                                      | Action                                                      |
| -------------------------------------------------------------- | ----------------------------------------------------------- |
| Branch is local, never pushed                                  | Rewrite freely (`rebase -i`, amend)                         |
| Pushed to your own PR branch, no other collaborators           | Rewrite, push with `--force-with-lease --force-if-includes` |
| Shared branch (`main`, release, anything others branched from) | Never rewrite. Use `git revert`                             |
| Published tag                                                  | Never move. Cut a new tag                                   |

Golden rule: never rewrite commits that exist outside your local repo or have
been pulled by others.

---

## Interactive Rebase

Interactive rebase lets you rewrite history before it's shared.

```bash
# Rebase the last N commits
git rebase -i HEAD~N

# Rebase everything since branching from main
git rebase -i $(git merge-base HEAD main)
```

**Commands in the rebase todo list:**

| Command      | Action                                          |
| ------------ | ----------------------------------------------- |
| `pick`       | Keep commit as-is                               |
| `reword`     | Keep changes, edit message                      |
| `edit`       | Pause to amend the commit                       |
| `squash`     | Meld into previous commit, combine messages     |
| `fixup`      | Meld into previous commit, discard this message |
| `drop`       | Remove the commit entirely                      |
| `exec`       | Run a shell command after this commit           |
| `break`      | Stop here so you can inspect or run commands    |
| `label`      | Mark current HEAD with a name                   |
| `reset`      | Reset HEAD to a named label                     |
| `merge`      | Recreate a merge commit                         |
| `update-ref` | Update a ref to point at this commit            |

**Squash a PR branch to a clean history:**

```bash
git rebase -i $(git merge-base HEAD main)
# Mark all commits after the first as 'fixup'
```

**Reorder commits:** just reorder the lines in the todo list.

---

## Modern PR-cleanup flow (autosquash)

One-time config: `rebase.autoSquash true`, `rebase.autoStash true`,
`push.useForceIfIncludes true`.

```bash
git commit --fixup=<sha>                  # or --squash / --fixup=reword:<sha>
git rebase -i $(git merge-base HEAD main) # autosquash reorders for you
git range-diff @{upstream}...HEAD         # verify intent preserved
git push --force-with-lease --force-if-includes
```

---

## Commit message rules

- Subject ≤50 chars, imperative ("Fix …", not "Fixed …"), no trailing dot.
- Blank line, then body wrapped at 72.
- Body answers _why_ and _what-was-wrong-before_, not _what-the-diff-shows_.
- If the project uses Conventional Commits: `type(scope): subject`; types
  `feat|fix|refactor|perf|docs|test|chore`; breaking change goes in footer as
  `BREAKING CHANGE: <description>`. Default to Conventional Commits unless the
  project says otherwise.

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

**Preconditions before `bisect start`:** the repro script must exit 0/non-zero
deterministically, the suspect range must build cleanly, and use `bisect skip`
for commits that can't build.

---

## Conflict Resolution

**Use rerere (reuse recorded resolution):**

```bash
git config --global rerere.enabled true
```

Once enabled, git records how you resolved a conflict. If the same conflict
appears again (e.g. during rebase onto an updated main), git replays the
resolution automatically. Verify replayed resolutions with `git diff` before
continuing — rerere matches on conflict text, not semantics.

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

The reflog records every position HEAD has been at — your safety net for "I just
destroyed my work." `git reflog` shows recent HEAD history;
`git reflog show <branch>` scopes to a branch. See the Undo table below for
concrete recipes.

Reflog is local only and expires after 90 days (default). Unreferenced objects
get garbage-collected. Use `git fsck --lost-found` to find truly orphaned
objects.

---

## "Undo X" quick reference

| Goal                                    | Command                                     |
| --------------------------------------- | ------------------------------------------- |
| Undo last commit, keep changes staged   | `git reset --soft HEAD~1`                   |
| Undo last commit, keep changes unstaged | `git reset --mixed HEAD~1`                  |
| Discard last commit and its diff        | `git reset --hard HEAD~1` _(destructive)_   |
| Undo a pushed commit safely             | `git revert <sha>`                          |
| Recover dropped commit                  | `git reflog` → `git switch -c rescue <sha>` |
| Undo a bad merge, keep it in history    | `git revert -m 1 <merge-sha>`               |
| Undo a bad merge, not yet pushed        | `git reset --hard ORIG_HEAD`                |
| Recover after `reset --hard`            | `git reset --hard HEAD@{1}`                 |
| Restore one file to HEAD                | `git restore <path>`                        |
| Restore one file to a specific sha      | `git restore --source=<sha> <path>`         |

---

## Worktrees for parallel work

Trigger: hotfix while mid-feature, or running review/tests without stashing.
Keep ≤2–3 live.

```bash
git worktree add ../repo-hotfix main
git worktree list
git worktree remove ../repo-hotfix
```

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

# Cherry-pick a range of commits
git cherry-pick A^..B
```

---

## Canon

- git-scm docs: [rebase](https://git-scm.com/docs/git-rebase),
  [bisect](https://git-scm.com/docs/git-bisect),
  [range-diff](https://git-scm.com/docs/git-range-diff),
  [worktree](https://git-scm.com/docs/git-worktree),
  [switch](https://git-scm.com/docs/git-switch),
  [restore](https://git-scm.com/docs/git-restore),
  [rerere](https://git-scm.com/docs/git-rerere)
- Pro Git:
  [§3.6 Rebasing](https://git-scm.com/book/en/v2/Git-Branching-Rebasing),
  [§7.10 Reset Demystified](https://git-scm.com/book/en/v2/Git-Tools-Reset-Demystified),
  [§2.4 Undoing Things](https://git-scm.com/book/en/v2/Git-Basics-Undoing-Things)
- [Conventional Commits 1.0.0](https://www.conventionalcommits.org/en/v1.0.0/)
  and [Conventional Comments](https://conventionalcomments.org/)
- Commit-message style:
  [tpope](https://tbaggery.com/2008/04/19/a-note-about-git-commit-messages.html),
  [cbea.ms seven rules](https://cbea.ms/git-commit/)
- Workflow:
  [Atlassian merging-vs-rebasing](https://www.atlassian.com/git/tutorials/merging-vs-rebasing),
  [Atlassian force-with-lease](https://www.atlassian.com/blog/it-teams/force-with-lease),
  [adamj.eu force push safely](https://adamj.eu/tech/2023/10/31/git-force-push-safely/),
  [thoughtbot autosquash](https://thoughtbot.com/blog/autosquashing-git-commits),
  [trunkbaseddevelopment.com](https://trunkbaseddevelopment.com/)
