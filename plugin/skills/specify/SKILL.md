---
name: specify
description: Design-partner mode for discovery, tradeoffs, decisions, and agreed design artifacts.
---

# Specify

## Iron Law

`DESIGN-PARTNER MODE: READ THE SYSTEM, DECIDE THE SHAPE TOGETHER, THEN RECORD WHAT WAS AGREED.`

## When to Use

- Feature work, refactors, migrations, or bug fixes that touch more than one
  contract, component, module boundary, state transition, or domain invariant.
- Adding or changing a public surface: function signature, exported type,
  endpoint, event/queue payload, CLI flag, environment variable, config key,
  file format, or database schema/migration step.
- Ambiguous or risky implementation intent where the agent should turn fuzzy
  goals into an approved design direction before code lands.
- The user asks to design, specify, draft an ADR/RFC/tech spec, or capture a
  design note.
- `workflow` chooses the Design-partner mode because architecture, domain
  modeling, durable interfaces, cross-boundary contracts, or multi-component
  choices need human participation.

## When NOT to Use

- Typos, formatting, comment-only edits, or docs-only changes with no
  executable or contract effect.
- Internal helper extraction with no caller-visible boundary.
- Single-line bug fixes where no contract, state, data, or boundary changes.
- Pure dependency bumps with no public surface change.
- The user wants a concrete task plan after the design is already settled; use
  workflow or the harness planning mode instead.
- A durable interface is already concrete and only needs approval; use
  `contract-first` directly.

## Core Ideas

1. Specify turns fuzzy intent into shared design. Its output is agreement on
   the current surface, target shape, tradeoffs, decisions, and open questions;
   it is not autonomous coding or document theater.
2. Stay above implementation sequencing. Specify owns contracts, states,
   tradeoffs, risks, and decisions. File-by-file edits, pseudocode, and task
   checklists belong to planning after the design direction is agreed.
3. Contracts are any durable boundary: function signature, module export,
   public type, error vocabulary, CLI flag, environment variable, database
   schema or migration step, event payload, file format, or config key. "API"
   does not mean only HTTP.

## Workflow

1. **Frame the design task.** State the intended outcome and the decision that
   needs collaboration. Say that coding waits until the shape is agreed.
2. **Read before proposing.** Summarize current contracts, data shapes, states,
   constraints, and ownership with citations. For greenfield work, name the
   adjacent convention.
3. **Learn with disposable spikes only when needed.** If code is the fastest
   way to reveal the shape, ask first, keep it local and small, and discard or
   rewrite it after convergence.
4. **Propose target shapes.** Compare feasible options at the contract, state,
   tradeoff, compatibility, migration, and risk level. Recommend one option
   when the evidence supports it.
5. **Ask the next design question.** Ask the smallest question that changes the
   shape. List secondary uncertainties as notes, then revise the proposal from
   the user's answer.
6. **Route specialist design risks.** Use `domain-modeling` for data, state,
   effects, and invariants; `contract-first` for contract approval; and the
   domain skill for API, persistence, async, security, errors, observability,
   performance, UI, accessibility, or release risks.
7. **Converge before planning.** Iterate until the human agrees on the design
   direction or rules it out. Then hand off to planning, implementation, proof,
   or review.
8. **Capture only what will be used.** If an artifact is needed, choose the
   smallest useful form after convergence and save it where it will rot least:
   private `.pi/specify/` for local agent memory, or checked-in `docs/` when
   the team should keep it.

## Artifact Types

- ADR: accepted decision with context and consequences.
- RFC: proposal needing review, with tradeoffs and approval state.
- Tech spec: implementation-ready design for a scoped change, including proof
  obligations.
- Note: lightweight memory that is useful but not yet a formal decision.

## Verification

- [ ] Current surface is backed by `file:line` evidence or named greenfield
      conventions.
- [ ] The proposed shape names contracts, states, tradeoffs, compatibility
      pressure, unresolved decisions, and proof obligations.
- [ ] User-owned decisions are approved, narrowed, or explicitly left open.
- [ ] Durable interfaces have `contract-first` approval before implementation,
      or implementation remains out of scope.
- [ ] Any artifact records the agreed shape and has a purpose-fit destination.

## Tripwires

Use these when the shortcut thought appears:

- A design written before reading code is speculation.
- Building the whole thing to discover the shape turns discovery into
  unapproved implementation.
- A design file is not approval for a contract, migration, config surface, or
  caller dependency.
- A question barrage is less useful than one recommended decision and notes.
- Design-partner means the agent proposes concrete options; the human approves,
  revises, or rules them out.
- Open questions should not wait for code review when they block the design.

## Handoffs

- `contract-first`: contract approval.
- `documentation`: artifact quality, audience, rot risk, and docs placement.
- `domain-modeling`: data shapes, invariants, transitions, and effects.
- `architecture`: boundaries, ownership, layering, and system shape.
- `proof`: design proof obligations.
- `api`, `database`, `async-systems`, `security`, `error-handling`,
  `observability`, `performance`, `ui-design`, `accessibility`, and `release`:
  specialist lenses when the design touches those domains.

## References

- ADR template: status, date, context, decision, consequences.
- `agent-booster-pack-contract-first` optional runtime package: ships from this
  repo at `agent-booster-pack-contract-first/` and provides the manual
  `/abp:contract` Interface Design Gate workflow.
