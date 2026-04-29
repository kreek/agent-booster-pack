---
name: workflow
description: Use first to route ABP work, choose skills, sequence handoffs, and define verification.
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

ABP is progressive enhancement for coding agents: the harness already knows
how to code, scope work, plan, and validate. ABP adds engineering quality
pressure when a risk trigger makes a quality concern matter to the next
action. Skills are not a ritual; load them only when they change the
outcome.

1. Start from the quality and risk profile: correctness, data integrity,
   security, operability, performance, accessibility, compatibility, or
   change safety.
2. Prefer simple over easy: name what is being tangled together (data,
   effects, time, ownership, transport, persistence, UI state, release,
   or compatibility) before choosing the implementation path.
3. Before claiming done, use `proof` to connect the completion claim to
   fresh evidence.
4. Use the coding agent's own judgment and built-in tools for delegation,
   parallelism, and sub-agents. ABP skills guide engineering quality and
   risk; they do not replace the runtime's native planning or task-dispatch
   behavior.
5. Treat Handoffs as graph edges, not a role hierarchy. A skill can route
   to any other skill when that quality concern becomes relevant.
6. Treat compatibility, rollout risk, and extra edge-case machinery as
   product decisions. Ask before adding shims, retries, fallback paths,
   or backward-compatible behavior the user did not request.

## Workflow

1. State the user-visible goal and the quality and risk profile to the
   user in one or two sentences, including any obvious coupling or
   complexity risk, so they can correct course before any code lands.
2. Check acceptance clarity before editing. For feature work, bug fixes,
   PRD/spec work, refactors, or behavior-affecting changes, draft the
   acceptance criteria the work appears to require. If behavior, scope,
   data shape, compatibility, UX, safety, or verification is ambiguous,
   ask a focused question and offer a concrete proposed acceptance
   criterion the user can accept or revise. Use `documentation` for PRDs,
   specs, issues, user stories, or other requirements artifacts.
3. Use a separate worktree (each with its own topic branch) when parallel
   work is expected, or when the current branch has in-flight work that
   should stay separate. Do not wait until commit time to isolate the
   change. (Branch-per-change and no-edits-on-main are harness baseline.)
4. Select the smallest useful skill set by quality concern and risk
   trigger:
   - whiteboard non-trivial changes with `whiteboarding` before drafting
     code; map current and proposed contracts and resolve open questions
     before invoking design-pass skills;
   - model any feature/domain data and invariants with `data-first`
     (first after scaffolding when specs are clear);
   - choose boundaries with `architecture`;
   - prove behavior with `proof`;
   - investigate causes with `debugging`;
   - review diffs with `code-review`;
   - gate safety with `security` or `database`, and reduce release
     toil/risk with `release`;
   - improve operations with `observability`, `performance`, or
     `async-systems`;
   - improve user and maintainer surfaces with `api`, `documentation`,
     `ui-design`, or `accessibility`;
   - package repository work with `git-workflow` or `release`;
   - start new projects or missing tooling with `scaffolding`.
5. Load those skills and follow their workflows. If two skills conflict,
   prefer safety, data integrity, correctness, proof, and user trust over
   convenience or style.
6. Finish by naming what was proven, what remains unproven, and what a
   human should review or decide. Explain what was built or changed, why
   it is better than what it replaced, and/or what it enables next. If
   that explanation is weak, pause and consider whether the change is too
   broad, too clever, or not yet justified.

## Verification

- [ ] The selected skills match the actual quality and risk profile, not a
      generic checklist.
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
| "I'll just code it" | Name the quality and risk profile and load the smallest useful skill set first. | None: even trivial edits enter; they may exit at step 1 with no skills. |
| "I'll infer the product behavior" | Draft likely acceptance criteria, then ask the user to confirm or correct the ambiguous parts before editing. | Mechanical edits or explicit implementation-only tasks with no behavior choice. |
| "Use every skill to be safe" | Pick the few skills that change the outcome. | Explicit audit/review request across the whole pack. |
| "This helper/layer/global will make it easy" | Name what it couples and route to `data-first`, `architecture`, `refactoring`, or `async-systems` before adding it. | Thin adapter required by an existing framework or public API. |
| "I'll branch at commit time" | Branch, or use a worktree for parallel or in-flight branch separation, before editing so the diff, tests, and commits belong to one scoped change. | Read-only research or a task explicitly done outside Git. |
| "I'll make it flexible for later" | Build the direct requested behavior; add flexibility only when current acceptance or quality concern needs it. | Public library/API design where extension points are part of the requirement. |
| "I'll preserve old behavior just in case" | Ask whether backward compatibility is required before adding shims or dual paths. | Existing public contract or migration policy already requires compatibility. |
| "ABP should decide sub-agent dispatch" | Use the agent runtime's native judgment and tools for delegation; use ABP only to shape the engineering risks each task must respect. | The user explicitly asks to design a delegation policy for this repo. |
| "The agent will decide acceptance" | Ask or infer caller-visible acceptance criteria and prove them with `proof`. | User explicitly says they will verify acceptance themselves. |
| "This is only docs" | Check whether the docs change behavior, install path, commands, or user expectations. | Pure typo with no procedural meaning. |
| "Production hardening later" | Route deploy, observability, security, data, and rollback risks now if real users are in scope. | Prototype clearly marked as disposable. |
| "I'll just list files changed" | Explain why the change improves the system or what it enables next, tied to the user's goal. | Mechanical typo or formatting-only edit. |

## Handoffs

- Use `whiteboarding` to map current and proposed contracts before any
  non-trivial change, ahead of `data-first`, `architecture`, and
  surface-specific design skills.
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
