---
name: smart-commit
description: Use when asked to organise a messy working tree into clean commits, review uncommitted changes and propose a logical grouping, or create concise commit messages for staged changes. Also use when the user says "commit this", "clean up my commits", or asks to split changes into separate commits.
---

# Smart Commit

Turn a messy working tree into a small set of coherent commits.

## Step 1: Inspect Before Touching Anything

```bash
git rev-parse --show-toplevel
git status --short
git diff --stat
git diff --cached --stat
git log --oneline -10
```

**Stop and ask** if:
- The repo is mid-merge, mid-rebase, or has conflict markers in `git status --short` (`UU`, `AA`, `DD`)
- Unrelated changes are mixed inside the same file and cannot be separated safely with whole-file staging
- The user asked only for a review — present the plan and stop; do not commit

---

## Step 2: Read the Actual Diffs

Read every diff before forming groups. Don't assume from filenames.

```bash
git diff -- path/to/file          # unstaged changes
git diff --cached -- path/to/file # staged changes
```

---

## Step 3: Group by Meaning

- Keep code, tests, and docs **together** when they describe one change.
- **Split** mechanical renames, formatting, generated output, and vendor churn into separate commits — they obscure behavioural changes.
- **Respect existing staged changes** as user intent. If already-staged changes form a coherent set, commit them first.
- Prefer whole-file groups. If one file mixes multiple logical changes, flag it and ask how to proceed.

---

## Step 4: Present the Proposal

```
## Proposed Commits

### Commit 1: add input validation for order creation
Files: src/orders/create.py, tests/test_order_create.py
Why: validates required fields before hitting the DB

### Commit 2: extract price calculation to pure function
Files: src/orders/pricing.py
Why: separate concerns, enables property-based testing
```

Ask: "Does this grouping look right? I can adjust before committing."

---

## Step 5: Execute After Approval

```bash
git add -- path/to/file1 path/to/file2
git commit -m "concise message"
git show --stat --oneline HEAD
git status --short
```

Repeat per group. Confirm working tree is clean at the end.

---

## Commit Message Rules

- Imperative mood, first line ≤72 chars.
- Explain the outcome, not the mechanics of staging.
- Match the repository's existing commit style (`git log --oneline -10`).
- Never add Co-Authored-By or AI-attribution trailers.

## Safety Rules

- Never commit without explicit approval.
- Never unstage user-staged changes without approval.
- Never use `--no-verify`.
- If only one logical change exists, make one commit; do not invent splits.
