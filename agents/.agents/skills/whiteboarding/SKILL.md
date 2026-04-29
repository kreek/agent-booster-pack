---
name: whiteboarding
description: Use to whiteboard non-trivial changes, mapping contracts, drawing components, and aligning decisions before code.
---

# Whiteboarding

## Iron Law

`READ THE CODE. DRAW THE CONTRACTS THAT CHANGE. ALIGN BEFORE CODE LANDS.`

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

## Core Ideas

1. Whiteboarding produces a shared understanding, not an implementation plan.
   The doc names what changes at every boundary; it does not describe how the
   code achieves it. If you are writing pseudocode, you are off the
   whiteboard.
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
   diagram. Boxes and arrows force you to see the whole shape; prose hides
   what the diagram exposes.
6. Default to markdown with Mermaid for diagrams (flowchart, sequence, state,
   ER, class). Use HTML only when richer markup pays for itself and the team
   has a viewer that renders it. PR review depends on the doc rendering
   inline in the diff.
7. The whiteboard is iterative. Agent drafts, human edits or asks, agent
   revises in place — not by appending. Loop until open questions reach zero
   and the human signs off explicitly.
8. Aim for ≤200 lines. Past 200 lines means either pseudocode crept in
   (delete it) or the scope is too broad (split into two whiteboards).
9. Architecture is downstream of whiteboarding. The whiteboard maps the
   terrain; `architecture` decides module boundaries on top of the map. Bring
   `architecture` in only when boundary changes are part of the work.

## Workflow

1. State the user-visible goal in one or two sentences. Link to or include
   the acceptance criteria.
2. Read the code. Find the existing contracts in scope and cite `file:line`
   for each. For greenfield, cite adjacent conventions and patterns the new
   code will follow.
3. Create or update `docs/whiteboard/<branch-or-feature>.md` (or the repo's
   committed equivalent). Use the section order under Artifact below.
4. Use markdown with Mermaid by default. Switch to HTML only if richer
   markup genuinely pays for itself.
5. Name every contract that will change. Show its current shape (with
   `file:line` evidence) and its proposed shape concretely — signature, type,
   schema, payload — not narrative prose.
6. Apply the `data-first` lens. Name the new and changed states, transitions,
   invariants, and what becomes representable or unrepresentable.
7. List open questions explicitly. Do not invent answers. If the human has
   not stated a position, say so and surface the question.
8. Iterate with the human. They edit, ask, or correct. The agent rewrites
   the affected section in place. Continue until open questions reach zero,
   every changing contract is named, and the human signs off explicitly.
9. Hand off downstream skills with the whiteboard as their input.

## Artifact

Section order in the whiteboard file:

1. **Goal** — caller-language description in one or two sentences. Link to
   acceptance criteria.
2. **Surface today** — every existing contract in scope, with `file:line`
   evidence. For greenfield work, the adjacent conventions and patterns.
3. **Surface after** — every contract above, in its proposed shape,
   concretely (signature, type, schema, payload).
4. **Data shapes and invariants** — new and changed states, transitions, and
   invariants. What becomes representable; what becomes unrepresentable.
5. **Diagram** — Mermaid diagram of components and contracts between them
   when more than one service or component is touched.
6. **Patterns followed** — existing conventions in the repo this aligns
   with, with `file:line` references.
7. **Resolved decisions** — what we have agreed on, with one-line rationale
   each.
8. **Open questions** — what still needs the human to decide.
9. **Out of scope** — what we are deliberately not changing.
10. **Proof obligations** — the contracts that will need named proof once
    code lands. Feeds `proof`.
11. **Sign-off** — explicit acknowledgment field with the approver's name and
    date. The whiteboard is not done until this is filled in.

## Verification

- [ ] The whiteboard lives at a committed path that survives context resets.
- [ ] Every contract that will change is named: signature, schema, endpoint,
      event, CLI flag, config key, or file format.
- [ ] Each contract has its current shape with `file:line` evidence (or
      "doesn't exist yet" with adjacent conventions cited).
- [ ] Each contract has its proposed shape shown concretely, not in prose.
- [ ] `data-first` lens applied: new and changed states, transitions, and
      invariants named; illegal states unrepresentable in the proposed shape.
- [ ] When more than one service or component is touched, a Mermaid diagram
      shows the components and contracts between them.
- [ ] Resolved decisions and open questions are listed separately.
- [ ] Open questions reach zero before sign-off.
- [ ] Total length ≤200 lines, or the work has been split.
- [ ] Three readers (the human, the agent, a reviewer) can independently
      summarize "what is different about the system after this lands?" in two
      sentences and match each other.
- [ ] The whiteboard names proof obligations that `proof` will turn into
      Proof Contracts.
- [ ] The Sign-off section is filled in by the human approver before any
      code lands.

## Tripwires

| Trigger | Do this instead | False alarm |
|---|---|---|
| "I'll just code it, no design needed" | Check the When to Use criteria. If more than one contract changes, whiteboard first. | Trivial typo, formatting, or dep-bump per the When NOT to Use list. |
| "I'll write pseudocode so the agent knows what to write" | Delete the pseudocode. Whiteboarding names contracts, not implementation. | Naming a one-line shape change like `id: string -> id: UserId` for clarity. |
| "API just means HTTP" | Re-read Core Idea 3. CLI flags, env vars, schemas, events, file formats, and types are all contracts. | The change really is HTTP-only and no other surface is touched. |
| "I'll draft the contracts from memory" | Open the code, read it, cite `file:line` for every existing surface. | Pure greenfield with no existing code to cite, with adjacent patterns named instead. |
| "The user will catch open questions in code review" | List open questions in the whiteboard and resolve them before code lands. | The user has already stated a position; record it as a resolved decision. |
| "I'll append my revisions so we can see what changed" | Rewrite the affected section in place. Use git history for what changed. | Adding a new resolved decision below the existing list is the right kind of appending. |
| "Markdown can't show this, I need HTML" | Try Mermaid first (sequence, flowchart, ER, state, class). HTML only when interactivity is genuinely required. | The team already has a docs viewer that renders rich HTML and the artifact is consumed there. |
| "I'll skip the diagram, the prose covers it" | If more than one component is touched, draw the diagram. Visual shape catches what prose hides. | Single-component change where the diagram would be one box. |
| "The doc is over 200 lines but it's all useful" | Either pseudocode crept in (delete) or scope is too broad (split into two whiteboards). | Genuinely complex multi-contract change with concise sections; fine if every section is irreducible. |
| "Architecture first, then design" | Whiteboard the terrain first. Bring `architecture` in only when boundary changes are part of the work. | The user has explicitly asked for an architecture decision before any contract drafting. |

## Handoffs

- Use `data-first` to formalize new invariants, states, transitions, and
  parse-at-boundary discipline named on the whiteboard.
- Use `architecture` when the whiteboard reveals a boundary problem — module
  locality, layering, or DDD tactical patterns that need their own decision
  before the contracts are drawn.
- Use `api` when the changing surface is a public HTTP API; the whiteboard
  names the contract, `api` shapes the wire-level details.
- Use `database` when the changing surface includes schema, migrations,
  indexes, transactions, or production data access.
- Use `async-systems` when the changing surface includes events, queues,
  streams, ordering, or delivery guarantees.
- Use `proof` to convert resolved decisions and named contracts into Proof
  Contracts before completion.
- Use `documentation` to capture resolved decisions as ADRs when the
  rationale is not recoverable from code or commit history.

## References

- Mermaid syntax: <https://mermaid.js.org/intro/>
- ADR template: status, date, context, decision, consequences.
- "Design It!" (Keeling) for architectural conversation patterns:
  <https://pragprog.com/titles/mkdsa/design-it/>
