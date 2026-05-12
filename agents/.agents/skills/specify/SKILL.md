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
- Before drafting an implementation plan or writing code for any non-trivial
  change.

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

1. Specify is the Design-partner engine for ABP. It is a collaborative
   engineering conversation, not a document-filling exercise and not maximum
   autonomous coding. The first output is shared understanding: current
   system, possible target shape, tradeoffs, decisions, and open questions.
2. Read the code before proposing the shape. Cite `file:line` for existing
   contracts. For greenfield work, cite adjacent conventions, framework idioms,
   or sibling features the new work will live among.
3. Contract means any durable boundary: function signature, module export,
   public type, error vocabulary, CLI command/flag, environment variable,
   database schema and migration step, event payload, file format, or config
   key. "API" does not mean only HTTP.
4. `contract-first` owns approval for durable interfaces. Specify may discover,
   compare, and record contracts, but implementation still waits for the
   Interface Design Gate packet: current interface, proposed interface, boundary
   reason, and human approval.
5. Ask one meaningful decision question at a time. The agent should propose
   concrete options and a recommendation, then revise the shared shape from the
   user's answer. List secondary uncertainties as notes, not as a question
   barrage.
6. `domain-modeling` is the always-on lens. Name new and changed states,
   transitions, effects, and invariants. Make illegal states unrepresentable in
   the proposed shape.
7. Use specialist lenses when the design touches their domain: `api`,
   `database`, `async-systems`, `security`, `error-handling`, `observability`,
   `performance`, `ui-design`, `accessibility`, or `release`.
8. Do not create a persistent artifact before the discussion converges unless
   the user explicitly asks to use the artifact as the discussion medium.
9. Keep design above implementation sequencing. If you are writing file-by-file
   edits, pseudocode, or task checklists, you have left Specify and entered
   planning. Hand off to `workflow` or the harness planning mode only after the
   design direction is agreed.
10. Capture the agreed result where it will rot least: private `.pi/specify/`
   for local agent memory or checked-in `docs/` when the team should review and
   keep it.

## Workflow

1. State the user-visible goal in one or two sentences and frame the turn as
   Design-partner work: the agent will read, propose, ask, revise, and wait for
   agreement before planning or coding.
2. Read the relevant code or conventions. Summarize current contracts, data
   shapes, states, constraints, and ownership with citations.
3. Offer one or more feasible target shapes at the contract level. Name
   tradeoffs, compatibility concerns, migration pressure, risks, and what each
   option makes easier or harder.
4. Ask the smallest next decision question that changes the design, with a
   concrete recommended option when one is defensible. List other uncertainties
   as notes, not a question list.
5. When a durable interface appears, route through `contract-first`. Record the
   approved shape in the Specify artifact, but do not treat the artifact itself
   as interface approval.
6. Iterate until the human agrees on the design direction or rules it out.
7. Ask where to save the result if no destination is already specified:
   private `.pi/specify/` or checked-in project docs.
8. Capture the result as the smallest useful artifact, then hand it to planning,
   implementation, proof, or review.

## Artifact Types

- **ADR**: one accepted decision with context and consequences.
- **RFC**: a proposal needing review, with goals, non-goals, tradeoffs, open
  questions, and approval state.
- **Tech spec**: implementation-ready design for a scoped change, including
  contracts, data model, rollout/migration notes when relevant, and proof
  obligations.
- **Note**: lightweight private or project memory that is useful but not yet a
  formal decision or proposal.

Default locations when the repo has no convention:

- Private: `.pi/specify/adr/`, `.pi/specify/rfc/`,
  `.pi/specify/tech-spec/`, `.pi/specify/notes/`.
- Checked in: `docs/adr/`, `docs/rfcs/`, `docs/specs/`, `docs/notes/`.

## Verification

- [ ] **Code read first**: existing contracts have `file:line` evidence, or
      greenfield adjacent conventions are named.
- [ ] **Conversational**: the agent asked one meaningful decision question at a
      time and revised the shape with the user's answers.
- [ ] **Design-partner mode**: implementation planning and code waited until
      architecture, domain, boundary, or multi-component decisions converged.
- [ ] **Contracts named**: every changing contract has current shape (or "new"),
      proposed shape, owner, compatibility pressure, and proof obligation.
- [ ] **Contract-first boundary**: durable interfaces received explicit
      `contract-first` approval before implementation, or implementation was
      left out of scope.
- [ ] **Domain lens**: changed states, transitions, effects, and invariants are
      named; invalid states are made unrepresentable where practical.
- [ ] **Artifact fit**: ADR, RFC, tech spec, or note was chosen by purpose; the
      destination is user-approved or follows an existing repo convention.
- [ ] **No premature planning**: file-by-file task sequencing and pseudocode
      wait until the design direction is agreed.
- [ ] **Proof obligations**: claims the implementation must satisfy are named
      so `proof` can turn them into checks.

## Tripwires

| Trigger | Do this instead | False alarm |
|---|---|---|
| "I'll just code it, no design needed" | Check the When to Use criteria. If more than one contract, state, or boundary changes, Specify first. | Trivial typo, formatting, or dependency bump covered by When NOT to Use. |
| "This interface is obvious" | Use `contract-first`: show current interface, proposed interface, boundary reason, and ask for approval. | Private helper with no durable caller dependency. |
| "I'll write the spec before reading code" | Read the code or adjacent convention first and cite it. | Pure greenfield with no relevant local convention. |
| "I'll create a design file so the session feels formal" | Keep design in chat until it converges, then capture the agreed artifact. | The user explicitly asks to draft the artifact as the discussion medium. |
| "The artifact approves the interface" | Record the approval, but route the actual interface gate through `contract-first`. | The artifact quotes an already-approved gate packet. |
| "I'll produce the plan now" | Stay at the contract, state, tradeoff, and risk level; ask the next design question. | The human agreed on the design and asked to plan or implement. |
| "I'll ask everything up front" | Ask the next meaningful decision question and list secondary uncertainties as notes. | The user explicitly requests a full questionnaire. |
| "Design-partner means the user must design it" | Propose concrete options and a recommendation; ask the human to approve, revise, or rule it out. | The user asks to supply their own architecture. |
| "API just means HTTP" | Re-read Core Idea 3; CLI flags, env vars, schemas, events, file formats, and types are contracts too. | The change is truly HTTP-only. |
| "The user will catch open questions in review" | Ask the blocking design question now and revise the shared shape from the answer. | The user already stated the decision; record it as resolved. |
| "Architecture first, then Specify" | Use Specify to map current and proposed terrain; bring `architecture` in when boundaries are the decision. | The user explicitly asked for an architecture decision before contract drafting. |

## Handoffs

- `contract-first`: mandatory approval gate for durable interfaces discovered
  or proposed during Specify.
- `documentation`: artifact quality, audience, rot risk, ADR shape, and docs
  placement.
- `domain-modeling`: data shapes, invariants, state transitions, and effects.
- `architecture`: module boundaries, ownership, layering, and system shape.
- `proof`: convert artifact proof obligations into Proof Contracts.
- `api`, `database`, `async-systems`, `security`, `error-handling`,
  `observability`, `performance`, `ui-design`, `accessibility`, and `release`:
  specialist lenses when the design touches those domains.

## References

- Mermaid syntax: <https://mermaid.js.org/intro/>
- ADR template: status, date, context, decision, consequences.
- "Design It!" (Keeling) for architectural conversation patterns:
  <https://pragprog.com/titles/mkdsa/design-it/>
- `agent-booster-pack-contract-first` Pi runtime companion: ships from this repo
  at `agent-booster-pack-contract-first/` and soft-blocks mutating tool calls
  when interface intent appears without an approved Interface Design Gate packet.
