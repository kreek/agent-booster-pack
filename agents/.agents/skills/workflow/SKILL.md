---
name: workflow
description: >-
  Master entrypoint for Agent Booster Pack. Load at the start of every
  software engineering task: feature work, bug fixes, prototyping, working
  from a PRD or tech spec, refactoring, code review, scaffolding, performance
  work, security-sensitive changes, production readiness work, config or CI
  edits, dependency bumps, infra-as-code changes, exploratory research, and
  read-only code questions all qualify. Use this skill to identify the risk
  profile and select the narrower ABP skills that should guide the work.
---

# Workflow

## Iron Law

`SELECT THE SMALLEST USEFUL SKILL SET, THEN PROVE WHAT YOU SHIP.`

## When to Use

- Starting any software engineering work and deciding which ABP skills
  should guide it.
- Building a feature, fixing a bug, prototyping, working from a PRD or
  tech spec, refactoring, reviewing code, scaffolding a project, or
  changing tests, docs, architecture, data, operations, or release paths.
- The user asks how to use ABP or asks for safer, more correct, more
  maintainable, more accessible, or more performant software.
- The task spans multiple concerns such as design, tests, security,
  operations, review, and release readiness.
- Config, CI/CD, infra-as-code, or dependency changes; exploratory
  research; or read-only code questions where the answer informs later
  engineering work.

## When NOT to Use

- A narrower skill is explicitly requested and fully covers the task.
- The user is asking about installing or authoring skills; use the
  relevant repo docs or `skill-creator`.
- Trivial edits (typos, formatting, mechanical metadata) still enter,
  but exit at workflow step 1 with no further skills loaded.

## Core Ideas

1. ABP is progressive enhancement for coding agents. The agent already
   knows how to code; ABP adds engineering pressure at the moment risk
   appears.
2. Humans stay in the loop for goals, tradeoffs, scope, and acceptance.
   Skills should make decisions reviewable, not hide them.
3. Start from the software risk: correctness, data, security,
   operability, performance, accessibility, or change safety.
4. Prefer simple over easy: name what is being tangled together
   (data, effects, time, ownership, transport, persistence, UI state,
   deployment, or compatibility) before choosing the implementation path.
5. Load only the skills that materially change the work. Do not turn
   skill use into a checklist ritual.
6. Before claiming done, use `proof` to connect the completion claim to
   fresh evidence.
7. Use the coding agent's own judgment and built-in tools for
   delegation, parallelism, and sub-agents. ABP skills guide
   engineering quality and risk; they do not replace the runtime's
   native planning or task-dispatch behavior.
8. Prefer direct, explicit, established code that follows the repo's
   house style. Avoid clever one-liners, speculative abstractions,
   unnecessary dependencies, and future-proofing.
9. Keep implementation shape easy to reason about: small functions,
   guard clauses, low nesting, one responsibility per function, and
   feature/domain locality before horizontal layering.
10. Treat compatibility, rollout risk, and extra edge-case machinery as
   product decisions. Ask before adding shims, retries, fallback paths,
   or backward-compatible behavior the user did not request.

## Workflow

1. State the user-visible goal and the risk profile to the user in one
   or two sentences, including any obvious coupling or complexity risk,
   so they can correct course before any code lands.
2. Check acceptance clarity before editing. For feature work, bug
   fixes, PRD/spec work, refactors, or behavior-affecting changes,
   draft the acceptance criteria the work appears to require. If
   behavior, scope, data shape, compatibility, UX, safety, or
   verification is ambiguous, ask a focused question and offer a
   concrete proposed acceptance criterion the user can accept or
   revise. Use `documentation` for PRDs, specs, issues, user stories,
   or other requirements artifacts that need clearer wording.
3. For feature work, bug fixes, refactors, dependency changes, or other
   repo mutations, check the current branch and working tree before
   editing. If on `main` or `master`, create or request a short topic
   branch using the repo's naming convention. If parallel work is
   expected, or the current branch has in-flight work that overlaps with
   or should stay separate from the new task, create or request a new
   worktree with its own topic branch. Do not wait until commit time to
   isolate the change.
4. Select the smallest useful skill set:
   - model any feature/domain data and invariants with `data-first`
     (first after scaffolding when specs are clear);
   - choose boundaries with `architecture`;
   - prove behavior with `testing` and `proof`;
   - investigate causes with `debugging`;
   - review diffs with `code-review`;
   - gate safety with `security` or `database`, and reduce release
     toil/risk with `deployment`;
   - improve operations with `observability`, `performance`,
     `caching`, `realtime`, `background-jobs`, or `concurrency`;
   - improve user and maintainer surfaces with `api`,
     `documentation`, `ui-design`, or `accessibility`;
   - package repository work with `git`, `commit`, or `versioning`;
   - start new projects or missing tooling with `scaffolding`.
5. Load those skills and follow their workflows. If two skills
   conflict, prefer safety, data integrity, correctness, proof, and
   user trust over convenience or style.
6. Keep the work scoped. Add dependencies, abstractions, and rollout
   machinery only when the task, acceptance criteria, or risk profile
   needs them. Implement the happy path first, then the edge cases
   required by security, data safety, compatibility, or acceptance.
7. Finish by naming what was proven, what remains unproven, and what a
   human should review or decide. Also explain what was built or
   changed, why it is better than what it replaced, and/or what it
   enables going forward. If that explanation is weak, pause and
   consider whether the change is too broad, too clever, or not yet
   justified.

## Verification

- [ ] The selected skills match the actual risk profile, not a generic
      checklist.
- [ ] The work is scoped to the user's goal and local project
      conventions.
- [ ] Correctness, safety, accessibility, performance, or operability
      claims are routed to the relevant skill.
- [ ] Completion claims are backed by `proof` evidence or reported as
      unproven.
- [ ] Human decisions and tradeoffs are surfaced instead of buried in
      implementation details.
- [ ] The final response explains the change's value or future
      enablement, not only the files touched.

## Tripwires

| Trigger | Do this instead | False alarm |
|---|---|---|
| "I'll just code it" | Name the risk profile and load the smallest useful skill set first. | None: even trivial edits enter; they may exit at step 1 with no skills. |
| "I'll infer the product behavior" | Draft likely acceptance criteria, then ask the user to confirm or correct the ambiguous parts before editing. | Mechanical edits or explicit implementation-only tasks with no behavior choice. |
| "Use every skill to be safe" | Pick the few skills that change the outcome. | Explicit audit/review request across the whole pack. |
| "This helper/layer/global will make it easy" | Name what it couples and route to `data-first`, `architecture`, `refactoring`, or `concurrency` before adding it. | Thin adapter required by an existing framework or public API. |
| "I'll branch at commit time" | Branch, or use a worktree for parallel or in-flight branch separation, before editing so the diff, tests, and commits belong to one scoped change. | Read-only research or a task explicitly done outside Git. |
| "I'll make it flexible for later" | Build the direct requested behavior; add flexibility only when current acceptance or risk needs it. | Public library/API design where extension points are part of the requirement. |
| "I'll preserve old behavior just in case" | Ask whether backward compatibility is required before adding shims or dual paths. | Existing public contract or migration policy already requires compatibility. |
| "ABP should decide sub-agent dispatch" | Use the agent runtime's native judgment and tools for delegation; use ABP only to shape the engineering risks each task must respect. | The user explicitly asks to design a delegation policy for this repo. |
| "The agent will decide acceptance" | Ask or infer caller-visible acceptance criteria and prove them with `proof`. | User explicitly says they will verify acceptance themselves. |
| "This is only docs" | Check whether the docs change behavior, install path, commands, or user expectations. | Pure typo with no procedural meaning. |
| "Production hardening later" | Route deploy, observability, security, data, and rollback risks now if real users are in scope. | Prototype clearly marked as disposable. |
| "I'll just list files changed" | Explain why the change improves the system or what it enables next, tied to the user's goal. | Mechanical typo or formatting-only edit. |

## Handoffs

- Use `proof` before claiming completion.
- Use `data-first` when complexity starts with unclear data shape,
  invalid states, parsing, mutation, or domain effects.
- Use `architecture` when complexity starts with boundaries, ownership,
  layering, locality, or decisions that change at different rates.
- Use `refactoring` when the complexity already exists and must be
  separated without changing behavior.
- Use `code-review` for independent risk review of diffs, PRs, or
  agent-generated code.
- Use `scaffolding` when a project lacks baseline tooling.
- Use `documentation` when writing user-facing or maintainer-facing
  explanations of how ABP or a project should be used, including
  requirements and acceptance criteria.

## References

- "Simple Made Easy": <https://www.youtube.com/watch?v=SxdOUGdseq4>
- "Out of the Tar Pit":
  <https://curtclifton.net/papers/MoseleyMarks06a.pdf>
- _Grokking Simplicity_: <https://www.manning.com/books/grokking-simplicity>
