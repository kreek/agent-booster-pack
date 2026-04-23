# AGENTS.md

Global defaults for work under `~/`. Per-project `AGENTS.md` files override this
one.

## Core Principles

- Simplicity first: the most direct solution that meets the requirement beats
  the clever one.
- Complexity is the enemy. Mutable state and tangled control flow are its
  primary vehicles; treat every accumulation of state a cost requiring
  justification.
- Prefer established, proven tech over novelty unless the task asks for it.
- Write explicit code. Avoid clever one-liners; optimise for the next reader.
- Reason before coding. For anything non-obvious, show the logic before the
  implementation.

## Working Style

- Keep changes minimal and targeted; match the existing codebase's conventions.
- Fix root causes rather than adding narrow patches.
- Introduce no new dependencies, formatters, or build tools unless the task
  clearly requires them.
- Prefer the project's existing scripts and conventions.
- For non-trivial changes, propose a short plan and wait for confirmation before
  executing.
- For tasks touching more than ~5 files, prefer a subagent for investigation.
- Ask when requirements are ambiguous; surface risks and tradeoffs before
  acting, not after.
- Start with the happy path. Only handle edge cases up-front when they're
  security-relevant or the requirement names them.
- Break large problems into incremental steps; ship and validate each before
  layering the next.
- When trade-offs exist, offer the alternatives briefly with their costs — don't
  silently pick one.
- Ask about backwards compatibility rather than assuming; compatibility shims
  add code that may not be wanted.

## Code and Data

- Separate data from logic from I/O. Pure functions must not produce side
  effects.
- Parse inputs into typed structures at trust boundaries; reject invalid data
  early.
- Make illegal states unrepresentable — prefer sum types over stringly-typed
  flags.
- Default to immutability; mutate only where the performance case is clear.
- See the `data-first-design` skill for the full canon (Hickey, Normand, Parnas,
  Wlaschin).

## Code Structure

- Unix philosophy: each function does one thing well. Prefer composition over
  monoliths.
- Keep functions short (~25–30 lines). If you need to scroll, it's probably two
  functions.
- Keep nesting under three levels. Extract or early-return before a fourth.
- Use guard clauses and early returns to flatten conditionals.
- Organise by feature, then by type. Co-locate things that change together.
- Discover abstractions, don't invent them. Write straight-line code first;
  refactor when you see real semantic duplication. Three similar lines beats a
  premature abstraction.

## File and Code Changes

- Preserve unrelated user changes; never revert work you did not make.
- Avoid destructive commands (`rm -rf`, `git reset --hard`, force-updating
  branches) unless asked.
- Create no commits, branches, or pull requests unless explicitly asked.
- Comments only when the _why_ is non-obvious; never describe what the code
  already says.

## Search and Inspection

- Use `rg` for text search and `rg --files` for file discovery.
- Read the smallest relevant set of files before editing.
- When a project has its own `AGENTS.md`, the more specific file takes
  precedence.

## Validation

- Run the narrowest relevant validation first, then broaden only if needed.
- Use the project's existing test, lint, and build commands.
- If validation cannot be run, say so and explain why.

## Git

- Branch per change: never commit directly to `main`/`master`. One branch per
  feature, fix, or refactor — even small ones.
- Branch names use a type prefix: `feature/`, `fix/`, `refactor/`, `chore/`
  (e.g. `fix/null-on-login`).
- One logical change per commit; keep commits atomic. If the subject needs
  "and", split it.
- Commit messages: imperative mood, first line ≤72 chars, explain _why_ not
  _what_.
- Review your own diff before every commit — catch debug prints, dead code, and
  stray changes before anyone else sees them.
- Rebase onto the latest base branch before opening a PR so conflicts surface
  early.
- Delete merged branches locally and remotely; stale branches obscure active
  work.
- Don't commit generated artifacts, build output, IDE settings, or OS files —
  they belong in `.gitignore`.
- Never add Co-Authored-By, generated-by, or AI-attribution trailers.
- Never skip pre-commit hooks (`--no-verify`).
- Never force-push unless explicitly requested.

## Tool-Use Etiquette

**Allowed without prompt:**

- Read files, grep/rg, list directories, `git status`/`diff`/`log`
- Run linters, formatters, type checkers on edited files
- Run a single targeted test or the test runner scoped to changed files

**Ask first:**

- Package installs or lockfile changes
- `git push`, force-push, branch delete, tag creation
- `rm`, `chmod`, or any destructive filesystem op outside the working tree
- Full test suite if it takes >30s
- Network calls to services not documented in this file

## Communication

- When explaining code or summarising work: give a concise high-level
  introduction first, then build knowledge from there.
- For new code and edits: explain why the change makes the software better and
  what it enables.
- State assumptions when they affect the outcome.
- Surface risks, tradeoffs, and blockers directly and early.
- Justify non-obvious choices in one sentence; do not over-explain.
