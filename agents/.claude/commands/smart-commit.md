# Smart Commit

Analyse uncommitted changes and group them into logical, well-structured commits.

## Instructions

### Step 1: Check repository state

```bash
git rev-parse --is-inside-work-tree 2>/dev/null || exit 1
git status --short
git diff --stat
git diff --cached --stat
git log --oneline -10
```

Stop if the repo is mid-merge, mid-rebase, or has conflict markers (`git status --short` shows `UU`/`AA`/`DD`). Report and ask how to proceed.

### Step 2: Analyse and group changes

Read the actual diffs before grouping:

```bash
git diff -- <unstaged-path>
git diff --cached -- <staged-path>
```

Group by meaning, not file type:
- Keep code, tests, and docs together when they describe one change.
- Split mechanical renames, formatting, generated output, or vendor churn into separate commits.
- Respect already-staged changes as user intent; commit that set first when it is coherent.
- Prefer whole-file groups. If one file mixes multiple logical changes, flag it and ask.

### Step 3: Present proposal

```
## Proposed Commits

### Commit 1: <message>
Files: path/to/file1, path/to/file2
Why: <one sentence on what changed and why>

### Commit 2: <message>
...
```

Ask: "Does this grouping look right? I can adjust before committing."

### Step 4: Execute after approval

```bash
git add -- path/to/file1 path/to/file2
git commit -m "message"
git show --stat --oneline HEAD
```

Repeat per group. Verify working tree is clean at the end.

## Commit Message Rules

- Imperative mood, first line ≤72 chars.
- Explain the outcome, not the mechanics of staging.
- Never add Co-Authored-By or AI-attribution trailers.
- Follow the repository's existing style (check `git log --oneline -10`).

## Safety Rules

- Never commit without explicit approval.
- Never unstage user-staged changes without approval.
- Never use `--no-verify`.
- If only one logical change exists, make one commit — do not invent splits.
- If the user asks to review, present the plan and stop; do not commit.
