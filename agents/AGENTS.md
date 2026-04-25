# AGENTS.md

## Core Principles

- These instructions are binding defaults, not suggestions. Follow them unless a
  more specific project instruction or an explicit user request overrides them
  without weakening safety, correctness, data integrity, or proof requirements.
- Simplicity first: the most direct solution that meets the requirement beats
  the clever one.
- Complexity is the enemy. Mutable state and tangled control flow are its
  primary vehicles; treat every accumulation of state a cost requiring
  justification.
- Prefer established, proven tech over novelty unless the task asks for it.
- Write explicit code. Avoid clever one-liners; optimise for the next reader.
- Reason before coding. For anything non-obvious, show the logic before the
  implementation.

## Priority Rules

- Safety, privacy, data integrity, and destructive-action controls are
  non-negotiable. Do not bypass them to satisfy speed, style, convenience, or a
  weak local convention.
- Proof requirements are non-negotiable for behavior, invariant, contract,
  root-cause, and refactor-safety claims. If evidence is missing, say the claim
  is unproven.
- Local project instructions may narrow or specialize this file. They may not
  silently weaken safety gates, validation, proof obligations, or user-change
  preservation. When local instructions conflict with these rules, follow the
  stricter rule and call out the conflict.
- User instructions override preferences and style guidance. They do not
  authorize unsafe destruction, secret exposure, data loss, or false claims of
  validation.

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
- Do not downgrade from the listed modern default merely because an older tool
  ships with the runtime or avoids setup. For example: use pnpm instead of npm
  for new Node projects, and uv instead of raw pip/venv for new Python projects,
  even when there are no dependencies yet. Use older/built-in tools only when
  they are the ecosystem's preferred default, such as Cargo for Rust or Go
  modules for Go, or when the repo/user explicitly chooses them.
- For new TypeScript web apps without explicit hosting constraints, prefer
  Cloudflare Workers with Hono as the backend/runtime default. Confirm before
  locking it in. Use Render, Fly.io, AWS, GCP, Azure, containers, or a VPS when
  the user requests them or when the app needs long-running processes,
  unsupported native dependencies, special networking, strict region/data
  residency, conventional Node server semantics, or managed services outside
  Cloudflare's model.
- For new web app scaffolds, do not hand-roll HTTP servers or routing when a
  mature framework supplies the conventions. Use the scaffolding skill's
  framework defaults, and search current official/project sources when the
  language, runtime, or app shape is not covered.
- For non-trivial, ambiguous, or risky changes, state the short plan,
  assumptions, and tradeoffs before editing. Ask only when the answer changes
  the implementation or risk.
- Start with the happy path. Add edge cases when the requirement names them,
  they are security- or data-loss-relevant, or they are needed for a real
  boundary such as network, filesystem, database, or concurrency.
- Preserve backwards compatibility only when required or clearly valuable. If
  compatibility expectations are unclear, ask before adding shims or making a
  breaking change.

## Skills

Skills are progressive context. Use this file as the index; load the relevant
`SKILL.md` before applying a skill, and do not duplicate skill bodies here. When
a task matches a skill trigger, loading that skill is mandatory, not optional.

When multiple skills apply, load the smallest useful set. If skills conflict,
resolve in this order: security/privacy/data-loss prevention, correctness and
domain invariants, production safety, performance, maintainability/readability,
existing project conventions, style/aesthetics. Project conventions are evidence
of local intent, not proof of quality; follow them only when they do not weaken
the higher-priority concerns.

### Foundational Design

Use these before choosing abstractions or control flow for non-trivial code.
They shape the problem, not just the implementation.

- `data`: use when designing state, data models, inputs, invariants, effects, or
  module boundaries.

### Safety Gates

Use these as mandatory review lenses when triggered. They can block an otherwise
good solution because mistakes here cause data loss, incidents, or security
failures.

- `security`: use when touching auth, authorisation, secrets, crypto, input
  validation, dependency trust, logging of sensitive data, or any trust
  boundary.
- `database`: use when changing schemas, migrations, indexes, queries,
  transactions, connection pools, deletion semantics, or production data access.
- `deployment`: use when changing pipelines, release steps, rollout strategy,
  rollback paths, feature flags, or deploy-time database coordination.
- `resilience`: use when making remote calls or designing timeouts, retries,
  idempotency, sagas, outbox, event ordering, or consistency.

### Correctness And Change Control

Use these broadly when changing behavior or structure. They keep code provable,
recoverable, and understandable.

- `review`: use when reviewing local diffs, branches, GitHub PRs,
  agent-generated code, requested changes, or review comments; use it as the
  generic code-review entrypoint before loading narrower domain lenses.
- `proof`: use when engineering claims need explicit proof obligations: data
  invariant, boundary, executable check, and evidence.
- `tests`: use when adding, reviewing, or fixing tests; deciding what to mock;
  proving caller-visible behavior; addressing flakes or overspecified tests.
- `error-handling`: use when designing error types, propagation, retries, crash
  boundaries, user-facing messages, or recovery behavior.
- `debugging`: use when investigating bugs, flakes, regressions, production
  symptoms, or any problem where the cause is not yet proven.
- `refactoring`: use when reshaping existing code, extracting modules, renaming
  broadly, migrating frameworks, or changing structure without changing
  behavior.

### Production Quality

Use these when their technical domain appears in the work. They improve
operability, scalability, and performance after the core model is sound.

- `observability`: use when adding or reviewing logs, metrics, traces, health
  checks, dashboards, SLOs, alerts, or telemetry redaction.
- `realtime`: use when designing event streams, live updates, pub/sub,
  subscriptions, SSE, WebSockets, Kafka, Kinesis, Redis Streams, consumer
  groups, offsets, lag, replay, retention, partitions, ordering, delivery
  guarantees, or stream backpressure.
- `background-jobs`: use when designing or reviewing background jobs, async
  workers, schedulers, retries, job payloads, dead jobs, queue priority, worker
  concurrency, or Sidekiq/Celery/BullMQ/RQ/Oban-style task processors.
- `concurrency`: use when writing async, threaded, actor, channel, lock, queue,
  cancellation, or backpressure-sensitive code.
- `performance`: use when optimising or diagnosing latency, throughput, p99s,
  CPU, memory, allocations, I/O, or resource saturation.
- `cache`: use when adding caches, choosing TTL/invalidation, preventing
  stampedes, using Redis/Memcached/CDNs, or debugging stale data.
- `api`: use when designing REST/HTTP APIs, OpenAPI, status codes, pagination,
  idempotency keys, rate limits, versioning, or webhooks.

### Communication And UX

Use these when the user-facing or maintainer-facing surface is part of the work.
They should not override correctness or safety. They may override weak project
conventions when the existing surface is inaccessible, confusing, misleading, or
hard to maintain.

- `docs`: use when writing or reviewing READMEs, ADRs, runbooks, API docs,
  reference docs, tutorials, or explanatory comments.
- `frontend`: use when building or materially changing frontend pages,
  components, interaction flows, responsive layout, or visual design.
- `accessibility`: use when UI work touches WCAG 2.2, ARIA, semantic HTML,
  keyboard navigation, focus management, screen readers, contrast, forms,
  modals, custom controls, reduced motion, forced colors, or inclusive design.

### Workflow

Use these for repository mechanics and change packaging. They govern how work is
organized, not what the code should do.

- `scaffolding`: use when bootstrapping a new project, adding baseline tooling
  (linter, formatter, type check, test runner, coverage) to a project that lacks
  it, or setting up initial CI config.
- `git`: use when rebasing, bisecting, resolving conflicts, splitting/squashing
  commits, recovering history, or cleaning branch history.
- `commit`: use when grouping a messy working tree, proposing commit splits,
  writing commit messages, or committing approved changes.

Proof obligations override style, aesthetics, and weak local conventions. If a
behavior, invariant, contract, root-cause, or refactor-safety claim cannot be
proven, say it is unproven rather than complete.

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
- Use the `data` skill for the full canon on modelling state, values, effects,
  and invariants.

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
- When a project has its own `AGENTS.md`, treat it as additive and more
  specific. It controls project conventions and local commands, but it does not
  erase these global safety, proof, validation, and user-change-preservation
  rules.

## Validation

Validation is part of the work. A change is not complete until the relevant
checks have run, or the exact blocker is reported.

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
- Load the `tests` skill before authoring tests. Do not skip it.
- If the working directory is empty, lacks a project manifest, or has no
  test/lint/typecheck baseline, load `scaffolding` before creating feature code.
- When starting a new project or adding quality tooling to one that lacks it,
  load the `scaffolding` skill so linter, formatter, type check, test runner,
  and coverage are all in place before feature work begins.
- If you cannot run the tests in the sandbox (missing deps, no DB, no network),
  say so and name what would be needed. Do not quietly ship untested code.

## Git

- Branch per change when the workflow supports it or the user asks. Never commit
  directly to `main`/`master`; if branch creation is outside the agent's current
  authority, keep changes uncommitted and say so.
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
- If you cannot explain how the change improves the system and what it enables
  next, treat that as an AI-coding-agent smell: pause and consider a simpler or
  better-scoped solution.
- When materially different approaches are viable, present the options and
  tradeoffs before choosing.
- State assumptions when they affect the outcome.
- Surface risks, tradeoffs, and blockers directly and early.
- Justify non-obvious choices in one sentence; do not over-explain.
