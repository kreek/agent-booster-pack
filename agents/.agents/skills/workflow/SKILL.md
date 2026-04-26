---
name: workflow
description:
  Master entrypoint for Agent Booster Pack. Load at the start of every
  software engineering task — feature work, bug fixes, prototyping, working
  from a PRD or tech spec, refactoring, code review, scaffolding, performance
  work, security-sensitive changes, production readiness work, config or CI
  edits, dependency bumps, infra-as-code changes, exploratory research, and
  read-only code questions all qualify. Use this skill to identify the risk
  profile and select the narrower ABP skills that should guide the work.
---

# Workflow

## Iron Law

`ENTER ON EVERY SOFTWARE ENGINEERING TASK.`
`LOAD THE SKILLS THAT YIELD A CORRECT, IDIOMATIC SOLUTION FOR THE PROBLEM AT HAND, AND PROVE WHAT YOU SHIP.`

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
4. Load only the skills that materially change the work. Do not turn
   skill use into a checklist ritual.
5. Before claiming done, use `proof` to connect the completion claim to
   fresh evidence.
6. Use the coding agent's own judgment and built-in tools for
   delegation, parallelism, and sub-agents. ABP skills guide
   engineering quality and risk; they do not replace the runtime's
   native planning or task-dispatch behavior.

## Workflow

1. State the user-visible goal and the risk profile to the user in one
   or two sentences, so they can correct course before any code lands.
2. Select the smallest useful skill set:
   - shape data and invariants with `data-first`;
   - choose boundaries with `architecture`;
   - prove behavior with `testing` and `proof`;
   - investigate causes with `debugging`;
   - review diffs with `code-review`;
   - gate safety with `security`, `database`, or `deployment`;
   - improve operations with `observability`, `performance`,
     `caching`, `realtime`, `background-jobs`, or `concurrency`;
   - improve user and maintainer surfaces with `api`,
     `documentation`, `ui-design`, or `accessibility`;
   - package repository work with `git`, `commit`, or `versioning`;
   - start new projects or missing tooling with `scaffolding`.
3. Load those skills and follow their workflows. If two skills
   conflict, prefer safety, data integrity, correctness, proof, and
   user trust over convenience or style.
4. Keep the work scoped. Add dependencies, abstractions, and rollout
   machinery only when the task or risk profile needs them.
5. Finish by naming what was proven, what remains unproven, and what a
   human should review or decide.

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

## Tripwires

| Trigger | Do this instead | False alarm |
|---|---|---|
| "I'll just code it" | Name the risk profile and load the smallest useful skill set first. | None — even trivial edits enter; they may exit at step 1 with no skills. |
| "Use every skill to be safe" | Pick the few skills that change the outcome. | Explicit audit/review request across the whole pack. |
| "ABP should decide sub-agent dispatch" | Use the agent runtime's native judgment and tools for delegation; use ABP only to shape the engineering risks each task must respect. | The user explicitly asks to design a delegation policy for this repo. |
| "The agent will decide acceptance" | Ask or infer caller-visible acceptance criteria and prove them with `proof`. | User explicitly says they will verify acceptance themselves. |
| "This is only docs" | Check whether the docs change behavior, install path, commands, or user expectations. | Pure typo with no procedural meaning. |
| "Production hardening later" | Route deploy, observability, security, data, and rollback risks now if real users are in scope. | Prototype clearly marked as disposable. |

## Handoffs

- Use `proof` before claiming completion.
- Use `code-review` for independent risk review of diffs, PRs, or
  agent-generated code.
- Use `scaffolding` when a project lacks baseline tooling.
- Use `documentation` when writing user-facing or maintainer-facing
  explanations of how ABP or a project should be used.
