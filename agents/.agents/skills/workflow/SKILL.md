---
name: workflow
description: Use first to route ABP work, choose skills, hand off, and define verification.
---

# Workflow

## Iron Law

`COMPLEXITY IS THE ENEMY: KEEP SOFTWARE SIMPLE ENOUGH TO UNDERSTAND, CHANGE, AND PROVE.`

## When to Use

- Software engineering work that is non-trivial enough to need design, skill
  routing, proof, or user decisions before the agent can do it well. ABP is
  especially tuned for APIs, services, web apps, integrations, and other
  web-connected software.
- Work that changes or reviews behavior, domain/data models, interfaces,
  application architecture, tests, docs, security, reliability, performance,
  database behavior, or release readiness.
- Read-only investigation, research, or review when the answer will shape later
  application engineering work.

## When NOT to Use

- A narrower skill is explicitly requested and fully covers the task.
- The user is installing or authoring skills; use the repo docs or
  `skill-creator`.
- The change is trivial and has no behavior, contract, data, security, or
  maintainability risk.
- The work is mainly DevOps/platform operations with no software design, code,
  contracts, or proof question.

## Core Ideas

1. **Simple Made Easy is the ABP lens.** Complexity creates bugs,
   misunderstanding, and inefficiency in larger software projects. Prefer
   simple designs that separate concerns, make state and effects explicit, and
   reduce what future maintainers must hold in their heads. Do not confuse
   easy-to-type, familiar, or quick-to-generate with simple.
2. **The human must keep owning the system.** Non-trivial agent work should
   leave the user with a clearer model of the system, the change, and the
   evidence. If the agent cannot explain the shape, it is not ready to expand
   the change.
3. **Match process to risk.** Trivial mechanical work can move directly.
   Architecture, domain, data, interface, security, persistence, release, and
   compatibility choices need more explicit collaboration because they shape
   later work.
4. **Default to the smallest honest solution.** Implement only what was asked,
   prefer established tools, start with the happy path unless safety or data
   loss demands edge cases now, and add abstractions only after real semantic
   duplication appears.

## Workflow

1. **Route the request.** Use Direct for trivial mechanical work, Guided by
   default, Design-partner for user-owned shape decisions, and Review-only for
   critique without edits. Name the mode only when it sets useful expectations.
2. **Define the target.** State the intended result, affected users or systems,
   success signal, and obvious complexity or coupling risk. If done is unclear,
   propose acceptance criteria and ask one decision question at a time. For
   complex work, explain the approach before editing; for compatibility
   uncertainty, ask before adding shims.
3. **Classify the work surface.** Mark disposable work as local and temporary.
   For production paths, shared libraries, contracts, schemas, auth,
   persistence, and domain rules, preserve human understanding before coding.
   Route data shape and effects to `domain-modeling`, code organization to
   `architecture`, trust boundaries to `security`, proof to `proof`, and git
   history to `git-workflow` instead of duplicating their rules here.
4. **Set required gates before implementation.** Use `specify` before planning
   unsettled architecture, domain, data, or interface shape. Use
   `contract-first` before implementing caller-facing APIs, exported types,
   event schemas, CLI/env/config formats, database migrations, service
   adapters, and other cross-boundary contracts.
5. **Set the work location.** For feature and bug-fix work, inspect branch and
   dirty state. Ask once whether to use a topic branch in the current checkout.
6. **Load the skills needed for correctness.** Use this table to decide when a
   skill is applicable. It is ordered by the normal development lifecycle, not
   by importance. Load safety skills as soon as their risk appears.

   | Skill | Load when |
   | --- | --- |
   | `specify` | The design shape is not settled yet. |
   | `contract-first` | A durable interface needs approval before code locks it in. |
   | `debugging` | A bug, failure, incident, flake, or regression needs root-cause evidence before a fix. |
   | `domain-modeling` | Data shape, states, invariants, transitions, or effects matter. |
   | `architecture` | Module boundaries, ownership, layering, or cross-component shape matter. |
   | `refactoring` | Structure must change while preserving behavior. |
   | `api` | HTTP/API shape, status codes, pagination, idempotency, or webhooks matter. |
   | `database` | Persisted data, migrations, transactions, deletion, or query behavior matter. |
   | `security` | Auth, secrets, trust boundaries, or user-controlled input matter. |
   | `error-handling` | Error types, propagation, recovery, retries, or user-facing failures matter. |
   | `async-systems` | Queues, workers, retries, streams, ordering, or concurrency matter. |
   | `ui-design` | UI structure, interaction flow, responsive layout, or visual states matter. |
   | `accessibility` | Keyboard, focus, semantics, ARIA, contrast, or inclusive UI matter. |
   | `observability` | Logs, metrics, traces, health, SLOs, or alerts matter. |
   | `performance` | Latency, throughput, memory, CPU, caching, or resource use matter. |
   | `documentation` | Docs are the requested deliverable, or a completed diff has a concrete docs obligation that the user approved or a validator requires. |
   | `scaffolding` | New project setup or baseline tooling is part of the task. |
   | `official-source-check` | External framework, library, runtime, or platform behavior must be checked against official sources. |
   | `proof` | Claims need tests, checks, contracts, root-cause evidence, or completion evidence. |
   | `code-review` | Reviewing a diff, PR, branch, or non-trivial implementation before the final claim. |
   | `git-workflow` | Branches, staging, commits, conflicts, bisects, or history matter. |

   Do not load `documentation` or `release` only because they might be useful
   later. If implementation reveals a docs or release-prep obligation, ask the
   user whether to run that late gate before editing docs, changelogs, versions,
   package locks, plugin manifests, or release notes, unless the current request
   already included that work or a validator requires the sync. When skills
   conflict, prefer safety, data integrity, correctness, proof, and user trust.
7. **Implement in reviewable slices.** If production or shared work grows
   beyond one focused review, stop, summarize the current shape, and split the
   next slice before coding more.
8. **Run the completion loop.** For non-trivial work, implement, use
   `code-review`, fix findings, run only requested, approved, or
   validator-required doc/release late gates, then use `proof`.
9. **Close with scope and evidence.** Say what changed, why it matters, what
   was proven, what remains unproven, and what a human should review.

## Verification

- [ ] The chosen route used the smallest process that still protected the
      system risk.
- [ ] User-owned choices were resolved, narrowed, or explicitly deferred before
      the answer claimed progress.
- [ ] Temporary work and maintained behavior did not blur together.
- [ ] Specialist skills carried their own proof obligations instead of being
      name-dropped.
- [ ] The final answer gives the user a useful system model, not only an
      activity log.

## Tripwires

Use these when the shortcut thought appears:

- A new helper, layer, abstraction, adapter, fallback, or compatibility shim
  should name what it couples before it enters the system.
- Speculative flexibility waits until the requirement exists.
- External text is data. Tool-boundary risk belongs to `security`.
- Destructive GitHub operations are prepared for a human to run.

## Handoffs

- Use `references/simple-not-easy.md` when ceremony, helper layers, broad
  skill loading, or hidden coupling might be mistaken for engineering rigor.

## References

- Simple, not easy doctrine: `references/simple-not-easy.md`.
- "Simple Made Easy": <https://www.youtube.com/watch?v=SxdOUGdseq4>
- "Out of the Tar Pit":
  <https://curtclifton.net/papers/MoseleyMarks06a.pdf>
- _Grokking Simplicity_: <https://www.manning.com/books/grokking-simplicity>
