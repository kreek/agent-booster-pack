---
name: contract-first
description: Use when an Interface Design Gate must approve durable function, API, config, event, or schema contracts.
---

# Contract First

## Iron Law

`NO DURABLE INTERFACE LANDS BEFORE THE HUMAN APPROVES THE SHAPE.`

## When to Use

- A task defines or materially changes a durable interface: exported function,
  public type, module boundary, HTTP endpoint, CLI command or flag, config key,
  environment variable, event payload, file format, database schema, migration
  step, or cross-component contract.
- The Pi Interface Design Gate blocks a mutating tool call and asks for the
  current interface, proposed interface, boundary reason, and user decision.
- Reviewing whether implementation started before contract approval.

## When NOT to Use

- Purely internal helper changes with no caller-visible boundary.
- Typos, formatting, comment-only edits, or docs-only changes with no contract
  effect.
- Broad routing and skill selection; use `workflow`.
- Collaborative design exploration before a concrete interface proposal; use
  `specify`.

## Runtime backstop

Two Pi runtime gates support this skill:

1. The Interface Design Gate (in this package) fires after you have opened a
   packet, blocking implementation until the user approves the proposed shape.
2. The Design-Moment Guard (in the `agent-booster-pack` meta-package) fires
   before you have opened a packet, when a mutating tool call writes to a
   public-surface path (API, CLI, schema, contract, migration) or introduces a
   new exported symbol. It asks you to open a Gate packet first, or to
   explicitly note that the change is not a new surface.

If either gate blocks a tool call, open the packet (Current interface, Proposed
interface, Why this boundary, User decision) and retry.

## Workflow

1. Stop before implementation code lands. Do not write source, migration, or
   config that commits the new boundary until approval is recorded.
2. Name the current interface with file/line evidence, or state "new
   interface" for greenfield work.
3. Propose the concrete interface shape: function signature, type, endpoint,
   CLI, config, event, schema, or file format. For public renames or removals,
   separate the desired new shape from the compatibility plan: breaking change,
   alias/shim, deprecation path, or old surface retained.
4. Explain why this boundary belongs here and what owns each side of it.
5. Ask the user to approve, revise, or rule it out. Treat silence as not
   approved, and do not treat name/shape approval as compatibility approval.
6. After approval, implement only the approved shape. If the implementation
   discovers a materially different contract, return to the gate.

## Verification

- [ ] The current interface is named with evidence, or marked as new.
- [ ] The proposed interface is concrete enough for callers to bind to.
- [ ] Ownership and boundary placement are explained.
- [ ] Public renames/removals have an explicit compatibility decision, or
      compatibility was left out of scope.
- [ ] The user approved, revised, or rejected the interface before
      implementation landed.
- [ ] The implemented contract matches the approved shape, or the gate was
      reopened for approval.

## Handoffs

- Use `workflow` to choose all relevant skills and keep the broad ABP routing
  context.
- Use `specify` when the contract shape is still being explored.
- Use `api`, `database`, `async-systems`, or `security` when the interface
  crosses those domain boundaries.
- Use `proof` to turn the approved contract into executable acceptance checks.
