---
name: whiteboarding
description: Use for design discussions that map contracts, resolve questions, and capture the result as an RFC/ADR.
---

# Whiteboarding

## Iron Law

`READ THE CODE. DISCUSS THE SHAPE. ALIGN BEFORE CODE LANDS.`

## When to Use

- Feature work, refactors, migrations, or bug fixes that touch more than one
  contract.
- Adding a new public surface: function signature, exported type, endpoint,
  event/queue payload, CLI flag, environment variable, config key, file format,
  or database schema/migration step.
- Changing an existing public surface in a way callers will see.
- Crossing a module boundary or touching more than one service or component.
- Any work where data shape, state machine, or domain invariant changes.
- Before drafting an implementation plan or writing code for any non-trivial
  change.

## When NOT to Use

- Typos, formatting, comment-only edits, or doc-only changes with no
  executable effect.
- Internal helper extraction with no change to any public surface.
- Single-line bug fixes where no contract changes.
- Pure dependency bumps with no API surface change.
- The user has explicitly invoked a narrower skill that fully covers the task.
- The user wants a concrete implementation plan; use the built-in planning
  mode or `workflow` instead after the design shape is understood.

## Core Ideas

1. Whiteboarding starts as a collaborative design conversation, not plan mode
   and not a document to fill in. The first output is shared understanding:
   what the system is today, what shape is possible, what tradeoffs exist, and
   what decisions still need the human. After agreement, capture the decision
   as an RFC or ADR.
2. Read the code that exists before drawing anything. Cite `file:line` for
   every existing contract in scope. For greenfield, cite the adjacent
   conventions, framework idioms, or sibling features the new code will live
   among.
3. Contract is the broadest sense of API: function signature, module export,
   public type, error vocabulary, CLI command/flag, environment variable,
   database schema and migration step, queue or event payload, file format,
   config key, or any shape that crosses a boundary. "API" does not mean only
   HTTP.
4. `data-first` is the always-on lens. Name new and changed states,
   transitions, and invariants. Make illegal states unrepresentable in the
   proposed shape. Apply `api`, `database`, `async-systems`, and other
   surface-specific lenses in addition when those surfaces are touched.
5. When the change touches more than one service or component, draw a
   lightweight diagram in the conversation. Boxes and arrows force you to see
   the whole shape; prose hides what the diagram exposes. Mermaid is fine when
   it helps, but a diagram is a discussion aid, not a required file.
6. Do not create a file called `whiteboard` or `docs/whiteboard/...`. Do not
   create any design artifact before the discussion has converged. Once the
   human agrees on the direction, write the result as an RFC or ADR using the
   repo's existing convention, or ask where RFCs/ADRs should live if no
   convention exists.
7. The whiteboard is iterative. Offer an initial read of the code and design
   shape, then ask the next meaningful question. Revise the shape as the human
   answers. Do not collapse the session into a one-shot plan.
8. Keep the conversation high-level enough to preserve design options. If you
   are writing step-by-step implementation tasks, pseudocode, or file-by-file
   edits, you have left whiteboarding and entered planning.
9. Architecture is downstream of whiteboarding. The whiteboard maps the
   terrain; `architecture` decides module boundaries on top of the map. Bring
   `architecture` in only when boundary changes are part of the work.

## Workflow

1. State the user-visible goal in one or two sentences and explicitly frame
   that this is a design discussion, not an implementation plan.
2. Read the code. Find the existing contracts in scope and cite `file:line`
   for each. For greenfield, cite adjacent conventions and patterns the new
   code will follow.
3. Summarize the current surface: contracts, data shapes, states, and
   constraints that matter to the user's goal. Keep citations close to each
   claim.
4. Offer one or more feasible target shapes at the contract level. Name
   tradeoffs, compatibility concerns, migration pressure, and what each option
   makes easier or harder.
5. Ask the human the smallest set of decision questions that changes the
   design. Avoid asking for information the code can answer.
6. Iterate. After each user answer, update the shared shape: resolved
   decisions, open questions, out-of-scope boundaries, and proof obligations.
7. When the human agrees on the design direction, create or update the RFC or
   ADR that records the decision, contracts, tradeoffs, open follow-ups, and
   proof obligations. Then hand off downstream skills with that artifact as
   their input.

## Conversation Shape

Use this structure in chat before writing the RFC or ADR:

1. **Goal** — caller-language description in one or two sentences.
2. **Surface today** — existing contracts and constraints, with `file:line`
   evidence. For greenfield work, adjacent conventions and patterns.
3. **Possible shape** — proposed contracts, data shapes, states, and
   invariants, concrete enough to compare but not a task list.
4. **Tradeoffs** — compatibility, migration, ergonomics, operational risk,
   and what becomes easier or harder.
5. **Questions** — decisions only the human can make.
6. **Current agreement** — resolved decisions, out-of-scope boundaries, and
   proof obligations to carry into planning or implementation.

## Final Artifact

After the discussion converges, create or update one persistent design artifact:

1. **ADR** — use when one architectural or contract decision has been accepted.
   Include status, date, context, decision, consequences, and links to the
   code contracts that motivated it.
2. **RFC** — use when the design is still a proposal, spans multiple decisions,
   needs review, or carries meaningful rollout/migration questions. Include
   problem, goals, non-goals, current surface, proposed surface, data shapes
   and invariants, tradeoffs, open follow-ups, and proof obligations.

Use the repo's existing RFC/ADR location and naming convention. If none exists,
ask the human before choosing a path. The artifact is the durable record of the
completed discussion; it is not the starting point for the discussion.

## Verification

- [ ] No `whiteboard` or `docs/whiteboard/...` file was created.
- [ ] No persistent design artifact was created before the design discussion
      converged.
- [ ] After convergence, the agreed design was captured as an RFC or ADR in
      the repo's convention, or the human was asked where it should live.
- [ ] The interaction stayed conversational: the agent asked meaningful
      decision questions and revised the design with the user's answers.
- [ ] Every contract that will change is named: signature, schema, endpoint,
      event, CLI flag, config key, or file format.
- [ ] Each contract has its current shape with `file:line` evidence (or
      "doesn't exist yet" with adjacent conventions cited).
- [ ] Each contract has its proposed shape shown concretely, not in prose.
- [ ] `data-first` lens applied: new and changed states, transitions, and
      invariants named; illegal states unrepresentable in the proposed shape.
- [ ] When more than one service or component is touched, a Mermaid diagram
      or equivalent lightweight sketch shows the components and contracts
      between them in the conversation.
- [ ] Resolved decisions and open questions are listed separately.
- [ ] Open questions that block design direction are answered before moving to
      implementation.
- [ ] Three readers (the human, the agent, a reviewer) can independently
      summarize "what is different about the system after this lands?" in two
      sentences and match each other.
- [ ] The discussion names proof obligations that `proof` will turn into
      Proof Contracts.
- [ ] The human has agreed to move from design discussion into RFC/ADR capture,
      planning, or implementation before any code lands.

## Tripwires

| Trigger | Do this instead | False alarm |
|---|---|---|
| "I'll just code it, no design needed" | Check the When to Use criteria. If more than one contract changes, whiteboard first. | Trivial typo, formatting, or dep-bump per the When NOT to Use list. |
| "I'll create a whiteboard file so the session is formal" | Keep the design in chat until it converges, then capture the result as an RFC or ADR. | The user explicitly asks to draft an RFC/ADR first as the discussion medium. |
| "We agreed, so no doc is needed" | Capture the agreed decision as an RFC or ADR before handing off to planning or implementation. | Trivial change covered by When NOT to Use. |
| "I'll produce the plan now" | Stay at the contract and tradeoff level. Ask the next design question before task sequencing. | The human has agreed on the design and asked to plan or implement. |
| "I'll write pseudocode so the agent knows what to write" | Delete the pseudocode. Whiteboarding names contracts, not implementation. | Naming a one-line shape change like `id: string -> id: UserId` for clarity. |
| "API just means HTTP" | Re-read Core Idea 3. CLI flags, env vars, schemas, events, file formats, and types are all contracts. | The change really is HTTP-only and no other surface is touched. |
| "I'll draft the contracts from memory" | Open the code, read it, cite `file:line` for every existing surface. | Pure greenfield with no existing code to cite, with adjacent patterns named instead. |
| "The user will catch open questions in code review" | Ask the design question now and revise the shared shape from the answer. | The user has already stated a position; record it as a resolved decision. |
| "I'll skip the diagram, the prose covers it" | If more than one component is touched, draw the diagram. Visual shape catches what prose hides. | Single-component change where the diagram would be one box. |
| "Architecture first, then design" | Whiteboard the terrain first. Bring `architecture` in only when boundary changes are part of the work. | The user has explicitly asked for an architecture decision before any contract drafting. |

## Handoffs

- Use `data-first` to formalize new invariants, states, transitions, and
  parse-at-boundary discipline named in the discussion and RFC/ADR.
- Use `architecture` when the discussion reveals a boundary problem — module
  locality, layering, or DDD tactical patterns that need their own decision
  before the contracts are drawn.
- Use `api` when the changing surface is a public HTTP API; the discussion
  names the contract, `api` shapes the wire-level details.
- Use `database` when the changing surface includes schema, migrations,
  indexes, transactions, or production data access.
- Use `async-systems` when the changing surface includes events, queues,
  streams, ordering, or delivery guarantees.
- Use `proof` to convert RFC/ADR proof obligations and named contracts into
  Proof Contracts before completion.
- Use `documentation` to capture resolved decisions as ADRs when the
  rationale is not recoverable from code or commit history.

## References

- Mermaid syntax: <https://mermaid.js.org/intro/>
- ADR template: status, date, context, decision, consequences.
- "Design It!" (Keeling) for architectural conversation patterns:
  <https://pragprog.com/titles/mkdsa/design-it/>
- `agent-booster-pack-contract-first` Pi runtime companion: ships from
  this repo at `agent-booster-pack-contract-first/` and soft-blocks
  mutating tool calls when interface intent appears without an approved
  Interface Design Gate packet.
