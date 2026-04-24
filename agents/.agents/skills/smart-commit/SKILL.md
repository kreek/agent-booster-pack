---
name: smart-commit
description:
  Use when asked to organise a messy working tree into clean commits, review
  uncommitted changes and propose a logical grouping, or create concise commit
  messages for staged changes. Also use when the user says "commit this", "clean
  up my commits", or asks to split changes into separate commits.
---

# Smart Commit

Turn a messy working tree into a small set of coherent commits.

## Step 1: Inspect Before Touching Anything

```bash
git rev-parse --show-toplevel
git status --short
git diff --stat
git diff --cached --stat
git log --oneline -20
```

**Stop and ask** if:

- The repo is mid-merge, mid-rebase, or has conflict markers in
  `git status --short` (`UU`, `AA`, `DD`)
- Unrelated changes are mixed inside the same file and cannot be separated
  safely with whole-file staging
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
- **Split refactors from behaviour changes.** Rename / extract / reformat goes
  in its own commit; the behaviour change lands on top.
- **Split** mechanical renames, formatting, generated output, and vendor churn
  into separate commits — they obscure behavioural changes.
- **Respect existing staged changes** as user intent. If already-staged changes
  form a coherent set, commit them first.
- Prefer whole-file groups. If one file mixes multiple logical changes, flag it
  and ask how to proceed.

**Size check before proposing.** If a single group exceeds ~400 lines changed or
~10 files, look again for a seam (refactor vs behaviour, independent features,
setup vs use). If no seam exists, proceed and say so in the proposal.

---

## Step 4: Present the Proposal

Each proposed commit shows: subject, files, one-sentence _why_, and whether a
body is needed (with a one-line sketch if yes).

```
## Proposed Commits

### Commit 1: add input validation for order creation
Files: src/orders/create.py, tests/test_order_create.py
Why: validates required fields before hitting the DB
Body: no

### Commit 2: extract price calculation to pure function
Files: src/orders/pricing.py
Why: separate concerns, enables property-based testing
Body: yes — note this is a pure refactor; behaviour change follows
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

**Subject line:**

- Imperative mood ("add", "fix", "remove" — not "added" / "fixes").
- Target ≤50 chars, hard cap 72.
- No trailing period. Capitalise per repo convention.
- Completes the sentence "When applied, this commit will \_\_\_".
- Match the repository's existing style (`git log --oneline -20`).
- Never add Co-Authored-By or AI-attribution trailers.

**Subject smell tests — split the commit if the subject:**

- Needs "and" / "also" / a comma joining two verbs.
- Uses vague verbs ("update", "change", "misc") with no object.
- Describes mechanics ("stage files", "fix merge") instead of outcome.

**Message body (when the why isn't obvious from the subject):**

- Blank line after subject, body wrapped to ~72 cols.
- Say _why_ and _what it enables_ — not what the diff already shows.
- Note tradeoffs, alternatives rejected, and follow-ups if relevant.
- Reference issues with trailers: `Fixes #123`, `Refs #456`.
- Omit the body entirely if the subject already tells the whole story.

**Detect the repo's message style from `git log --oneline -20`:**

- If most subjects match `type(scope): subject` → use Conventional Commits
  (`feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `perf`, `build`, `ci`).
  Mark breaking changes with `!` before the colon.
- Otherwise use plain imperative prose.
- Never switch styles mid-history.

---

## Iterate Then Clean

If the working tree holds multiple drafts of the same change, commit them as WIP
locally, then offer interactive rebase / squash before the branch goes up for
review. Never rewrite already-pushed shared history.

---

## Safety Rules

- Never commit without explicit approval.
- Never unstage user-staged changes without approval.
- Never use `--no-verify`.
- If only one logical change exists, make one commit; do not invent splits.

---

## Canon

- Tim Pope, "A Note About Git Commit Messages" —
  https://tbaggery.com/2008/04/19/a-note-about-git-commit-messages.html
- Scott Chacon, _Pro Git_ — Contributing to a Project —
  https://git-scm.com/book/en/v2/Distributed-Git-Contributing-to-a-Project
- Linus Torvalds on good commit messages —
  https://gist.github.com/matthewhudson/1475276
- Drew DeVault, "Using Git with Discipline" —
  https://drewdevault.com/blog/Using-git-with-discipline/
- Google eng-practices: Small CLs —
  https://google.github.io/eng-practices/review/developer/small-cls.html
- Conventional Commits v1.0.0 — https://www.conventionalcommits.org/en/v1.0.0/
- Pragmatic Programmer Tips — https://pragprog.com/tips/
