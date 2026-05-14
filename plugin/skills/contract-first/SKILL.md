---
name: contract-first
description: Use when an Interface Design Gate must approve durable function, API, config, event, or schema contracts.
---

# Contract First

## Iron Law

`ALL DURABLE INTERFACES MUST BE APPROVED AND DESIGNED BEFORE IMPLEMENTATION.`

## When to Use

- A task defines or materially changes a durable interface: exported function,
  public type, HTTP endpoint, CLI/env/config surface, event payload, file
  format, database schema, migration step, or cross-component contract.
- A manual or installed Interface Design Gate asks for current interface,
  proposed interface, boundary reason, and user decision.
- Reviewing whether implementation started before contract approval.

## When NOT to Use

- Purely internal helper changes with no durable boundary outside the helper.
- Typos, formatting, comment-only edits, or docs-only changes with no contract
  effect.
- Broad routing and skill selection; use `workflow`.
- Collaborative design exploration before a concrete interface proposal; use
  `specify`.

## Core Ideas

1. Contract-first is an approval gate, not a design conversation. If the shape
   is still being explored, use `specify` first.
2. A contract is concrete enough for another caller, process, service, user, or
   migration step to depend on it.
3. Approval covers the named shape only. Compatibility, rollout, renames,
   removals, and shims need their own explicit decision.

## Workflow

1. **Stop before implementation lands.** Do not write source, migrations, or
   config that commit the boundary until approval is recorded.
2. **Name the current interface.** Cite file/line evidence, or state "new
   interface" for greenfield work.
3. **Propose the new shape.** Show the concrete signature, type, endpoint,
   CLI/env/config surface, event payload, schema, migration step, or file
   format callers will bind to.
4. **Explain the boundary.** State why it belongs here and what owns each side.
5. **Separate compatibility.** For public renames or removals, ask for a
   breaking change, alias/shim, deprecation path, or old surface retained.
6. **Record the decision.** Ask the user to approve, revise, or rule it out.
   Silence is not approval.
7. **Implement only the approved shape.** If implementation discovers a
   materially different contract, reopen the gate.

## Verification

- [ ] The current interface is named with evidence, or marked as new.
- [ ] The proposed interface is concrete enough for callers to bind to.
- [ ] Boundary ownership and compatibility decisions are explicit.
- [ ] The user approved, revised, or rejected the interface before implementation
      landed.
- [ ] Implementation matches the approved shape, or the gate was reopened.

## Optional Runtime Backstop

Some ABP installations include the manual Interface Design Gate runtime. Use
`/abp:contract [intent]` to start it when available.

## Handoffs

- `workflow`: broad routing.
- `specify`: unsettled contract shape.
- `api`, `database`, `async-systems`, `security`: domain boundary risks.
- `proof`: executable checks for the approved contract.
