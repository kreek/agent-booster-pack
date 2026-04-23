# AGENTS.md

Global defaults for work under `~/`. Per-project `AGENTS.md` files override this one.

## Working Style

- Keep changes minimal and targeted; match the existing codebase's conventions.
- Fix root causes rather than adding narrow patches.
- Introduce no new dependencies, formatters, or build tools unless the task clearly requires them.
- Prefer the project's existing scripts and conventions.
- For non-trivial changes, propose a short plan and wait for confirmation before executing.
- For tasks touching more than ~5 files, prefer a subagent for investigation.
- Ask when requirements are ambiguous; surface risks and tradeoffs before acting, not after.

## Code and Data

- Separate data from logic from I/O. Pure functions must not produce side effects.
- Parse inputs into typed structures at trust boundaries; reject invalid data early.
- Make illegal states unrepresentable — prefer sum types over stringly-typed flags.
- Default to immutability; mutate only where the performance case is clear.
- See the `data-first-design` skill for the full canon (Hickey, Normand, Parnas, Wlaschin).

## File and Code Changes

- Preserve unrelated user changes; never revert work you did not make.
- Avoid destructive commands (`rm -rf`, `git reset --hard`, force-updating branches) unless asked.
- Create no commits, branches, or pull requests unless explicitly asked.
- Comments only when the *why* is non-obvious; never describe what the code already says.

## Search and Inspection

- Use `rg` for text search and `rg --files` for file discovery.
- Read the smallest relevant set of files before editing.
- When a project has its own `AGENTS.md`, the more specific file takes precedence.

## Validation

- Run the narrowest relevant validation first, then broaden only if needed.
- Use the project's existing test, lint, and build commands.
- If validation cannot be run, say so and explain why.

## Git

- One logical change per commit; keep commits atomic.
- Commit messages: imperative mood, first line ≤72 chars, explain *why* not *what*.
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

- When explaining code or summarising work: give a concise high-level introduction first, then build knowledge from there.
- For new code and edits: explain why the change makes the software better and what it enables.
- State assumptions when they affect the outcome.
- Surface risks, tradeoffs, and blockers directly and early.
- Justify non-obvious choices in one sentence; do not over-explain.
