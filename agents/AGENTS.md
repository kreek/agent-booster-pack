# AGENTS.md

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

- Keep changes scoped to the request and fix the root cause in the touched area.
  Do not start broad cleanup without being asked.
- Respect useful local conventions, but do not copy patterns that are unsafe,
  incorrect, brittle, overcomplicated, or hostile to readability.
- Introduce no new dependencies, formatters, or build tools unless the task
  clearly requires them.
- Package managers: match the repo's existing lockfile or manifest. When
  starting fresh, default to the modern preferred tool for the ecosystem:
  **pnpm** (Node), **uv** (Python), **bundler** (Ruby), **cargo** (Rust), **go
  modules** (Go), **composer** (PHP), **gradle** (Java/Kotlin, unless the
  project is locked to Maven), **SwiftPM** (Swift), **dotnet/NuGet** (.NET),
  **mix** (Elixir). Never mix managers in one repo.
- For non-trivial, ambiguous, or risky changes, state the short plan,
  assumptions, and tradeoffs before editing. Ask only when the answer changes
  the implementation or risk.
- Start with the happy path. Add edge cases when the requirement names them,
  they are security- or data-loss-relevant, or they are needed for a real
  boundary such as network, filesystem, database, or concurrency.
- Preserve backwards compatibility only when required or clearly valuable;
  otherwise surface the tradeoff before adding shims.

## Skills

Skills are progressive context. Use this file as the index; load the relevant
`SKILL.md` before applying a skill, and do not duplicate skill bodies here.

When multiple skills apply, load the smallest useful set. If skills conflict,
resolve in this order: security/privacy/data-loss prevention, correctness and
domain invariants, production safety, performance, maintainability/readability,
existing project conventions, style/aesthetics. Project conventions are evidence
of local intent, not proof of quality; follow them only when they do not weaken
the higher-priority concerns.

### Foundational Design

Use these before choosing abstractions or control flow for non-trivial code.
They shape the problem, not just the implementation.

- `data-first-design`: use when designing state, data models, inputs,
  invariants, effects, or module boundaries.

### Safety Gates

Use these as mandatory review lenses when triggered. They can block an otherwise
good solution because mistakes here cause data loss, incidents, or security
failures.

- `security-review`: use when touching auth, authorisation, secrets, crypto,
  input validation, dependency trust, logging of sensitive data, or any trust
  boundary.
- `database-safety`: use when changing schemas, migrations, indexes, queries,
  transactions, connection pools, deletion semantics, or production data access.
- `deployment-and-cicd`: use when changing pipelines, release steps, rollout
  strategy, rollback paths, feature flags, or deploy-time database coordination.
- `distributed-systems-resilience`: use when making remote calls or designing
  timeouts, retries, idempotency, sagas, outbox, queues, event ordering, or
  consistency.

### Correctness And Change Control

Use these broadly when changing behavior or structure. They keep code provable,
recoverable, and understandable.

- `behavior-testing`: use when adding, reviewing, or fixing tests; deciding what
  to mock; proving caller-visible behavior; addressing flakes or overspecified
  tests.
- `error-handling-patterns`: use when designing error types, propagation,
  retries, crash boundaries, user-facing messages, or recovery behavior.
- `debugging-methodology`: use when investigating bugs, flakes, regressions,
  production symptoms, or any problem where the cause is not yet proven.
- `refactoring-safely`: use when reshaping existing code, extracting modules,
  renaming broadly, migrating frameworks, or changing structure without changing
  behavior.

### Production Quality

Use these when their technical domain appears in the work. They improve
operability, scalability, and performance after the core model is sound.

- `observability-for-services`: use when adding or reviewing logs, metrics,
  traces, health checks, dashboards, SLOs, alerts, or telemetry redaction.
- `concurrency-patterns`: use when writing async, threaded, actor, channel,
  lock, queue, cancellation, or backpressure-sensitive code.
- `performance-profiling`: use when optimising or diagnosing latency,
  throughput, p99s, CPU, memory, allocations, I/O, or resource saturation.
- `caching-strategies`: use when adding caches, choosing TTL/invalidation,
  preventing stampedes, using Redis/Memcached/CDNs, or debugging stale data.
- `api-design`: use when designing REST/HTTP APIs, OpenAPI, status codes,
  pagination, idempotency keys, rate limits, versioning, or webhooks.

### Communication And UX

Use these when the user-facing or maintainer-facing surface is part of the work.
They should not override correctness or safety. They may override weak project
conventions when the existing surface is inaccessible, confusing, misleading, or
hard to maintain.

- `documentation`: use when writing or reviewing READMEs, ADRs, runbooks, API
  docs, reference docs, tutorials, or explanatory comments.
- `frontend-design`: use when building or materially changing frontend pages,
  components, interaction flows, responsive layout, accessibility, or visual
  design.

### Workflow

Use these for repository mechanics and change packaging. They govern how work is
organized, not what the code should do.

- `scaffolding`: use when bootstrapping a new project, adding baseline tooling
  (linter, formatter, type check, test runner, coverage) to a project that lacks
  it, or setting up initial CI config.
- `git-workflow-depth`: use when rebasing, bisecting, resolving conflicts,
  splitting/squashing commits, recovering history, or cleaning branch history.
- `smart-commit`: use when grouping a messy working tree, proposing commit
  splits, writing commit messages, or committing approved changes.

## Code and Data

Programs are transformations over data before they are object hierarchies.
Design data shapes and invariants first; then write transformations and isolate
effects at the boundary.

- Separate data from logic from I/O. Pure functions must not produce side
  effects.
- Parse inputs into typed structures at trust boundaries; reject invalid data
  early.
- Make illegal states unrepresentable — prefer sum types over stringly-typed
  flags.
- Default to immutability; mutate only where the performance case is clear.
- Use the `data-first-design` skill for the full canon on modelling state,
  values, effects, and invariants.

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

Tests prove behavior and document the contract. Timing is tactical; the proof is
not.

- Run the narrowest relevant validation first, then broaden only if needed.
- Use the project's existing test, lint, and build commands.
- If validation cannot be run, say so and explain why.

## Done means proven

A feature is not complete until its user-observable behaviors are exercised by
tests. Test-first is optional; test-at-all is not.

- Identify the outermost boundary the user reaches — HTTP endpoint, UI
  interaction, CLI invocation, public API. That is where tests enter.
- Write at least one `when X, Y happens` test per user-visible behavior. A
  feature with three endpoints and five distinct behaviors across them needs
  five tests, not one.
- Internal helpers and persistence modules do not need their own tests when
  outer-boundary tests exercise them. They do need tests when the logic is
  non-trivial in isolation — parsers, state machines, pure algorithms.
- Load the `behavior-testing` skill before authoring tests. Do not skip it.
- When starting a new project or adding quality tooling to one that lacks it,
  load the `scaffolding` skill so linter, formatter, type check, test runner,
  and coverage are all in place before feature work begins.
- If you cannot run the tests in the sandbox (missing deps, no DB, no network),
  say so and name what would be needed. Do not quietly ship untested code.

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
