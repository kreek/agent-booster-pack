---
name: architecture
description: Use for architecture decisions, module boundaries, coupling, layering, and system shape.
---

# Architecture

## Iron Law

`ORGANIZE BY WHAT CHANGES TOGETHER. BOUNDARIES EXPOSE CONTRACTS, NOT INTERNAL STEPS.`

## When to Use

- Choosing between domain/feature-oriented organization and horizontal
  controller/service/repository/DTO layers.
- Choosing module boundaries, bounded contexts, and public surfaces.
- Defining internal boundary contracts: what shape crosses a
  module/component boundary, what assumptions are guaranteed, and what
  details stay hidden.
- Mapping data flow inside a component from external/service payloads through
  parsed internal shapes to output/render shapes.
- Deciding whether DDD tactical patterns (aggregates, repositories,
  factories, domain services) earn their keep.
- Reviewing code where one behavior is scattered across many files for no
  technical reason.

## When NOT to Use

- Data shape, invariant, and effect discipline; use `domain-modeling`.
- Public HTTP contract details; use `api`.
- Database physical schema, indexes, or migrations; use `database`.
- Reshaping existing code while preserving behavior; use `refactoring`.

## Core Ideas

1. Organize by what changes together. Feature behavior, data shapes,
   invariants, and tests should live close enough to change together.
2. Use layers only for real boundaries. Horizontal layers are useful for
   process, deploy, trust, persistence, transport, or proven duplication. They
   are harmful when they scatter one behavior by default.
3. Expose contracts and hide internal shape. A module boundary should say what
   crosses it, what assumptions hold, and what details callers must not depend
   on.
4. Keep domain meaning local. Use bounded contexts when the same word means
   different things in different parts of the system. Do not force subtly
   different meanings into one shared model.
5. Use architecture patterns only when they carry behavior. DDD patterns like
   aggregates, repositories, factories, and domain services must protect a real
   invariant, workflow, or boundary.
6. Make data flow explicit. Name where external data enters, where it becomes
   trusted, where domain work happens, and what output shape leaves. These are
   roles, not required folders.

## Workflow

1. Name the business capability and its transitions before drawing modules.
2. Sketch the module surface from the caller's view: what it accepts, what
   it returns, what it must never expose.
3. If the surface is a durable interface, route to `contract-first`
   before implementation.
4. Sketch the internal data path: where external data enters, where it is
   parsed into a trusted shape, where domain work happens, where output data
   is shaped, and what the renderer/presenter receives.
5. Group code by capability first; introduce horizontal layers only where a
   real technical boundary justifies them.
6. For each cross-module call, ask whether the caller depends on a stable
   contract or on internal shape. Stabilize the contract; hide the shape.
7. Record the decisions that future readers can't recover from the code:
   why this boundary, why this shape, what alternative was rejected.

## Verification

- [ ] One feature can be edited without traversing more directories than the
      change deserves.
- [ ] Horizontal controller/service/repository/DTO layers, where present,
      correspond to real technical boundaries, not default ceremony.
- [ ] DDD tactical patterns are applied where they earn their keep, not as
      decoration.
- [ ] Component data flow has named ingress, parse, domain, output-shaping,
      and render/presentation roles; raw external payloads do not leak past
      the parse boundary.
- [ ] Module surfaces hide volatile decisions; callers depend on the
      contract, not the internal shape.
- [ ] Durable interfaces were routed through user-approved contract/API
      design before implementation.
- [ ] Boundaries separate concerns that change independently; they are
      not merely steps in a flowchart.
- [ ] Bounded contexts are explicit where the same word means different
      things in different parts of the system.
- [ ] Architectural decisions whose rationale isn't recoverable from the
      code are recorded (ADR, comment, or commit message).

## Tripwires

| Trigger | Do this instead | False alarm |
|---|---|---|
| "Every feature needs controller/service/repository/DTO files" | Group by capability first. Add horizontal layers only for real technical boundaries. | The framework requires the split and behavior remains local. |
| "This belongs in shared because two places use it" | Check whether the two places mean the same thing. Prefer separate context types when meaning differs. | The value is a true cross-context primitive with identical rules. |
| "Add a repository/factory/service because DDD" | Name the domain rule or boundary it protects before adding the pattern. | The pattern already exists locally and carries real behavior. |
| "Middleware can handle this feature rule" | Keep feature-specific business behavior at the handler/domain boundary. | The concern is transport-wide, such as auth session parsing or request IDs. |
| "Architecture review means move files now" | Decide the boundary first, then use `refactoring` to move code safely. | The requested task is only to sketch the target structure. |
| "A new layer will make this simpler" | Name the independent change axis or proven duplication it separates. | The layer represents process, deploy, trust, persistence, or transport. |

## Handoffs

- Use `specify` upstream to map the current and proposed contracts before
  deciding module boundaries.
- Use `domain-modeling` to design data shapes, invariants, and effect isolation
  inside a module, including the exact parsed and output shapes.
- Use `refactoring` to move existing code toward the chosen structure
  without changing behavior.
- Use `api` when the boundary in question is a public HTTP contract.
- Use `documentation` for ADRs that capture the rationale.
- Use workflow's `references/simple-not-easy.md` when deciding whether a
  boundary, layer, or tactical pattern is simplifying the system or only
  making the next edit easier.

## References

- "Domain-Driven Design" (the blue book):
  <https://www.domainlanguage.com/ddd/>
- "Implementing Domain-Driven Design":
  <https://www.informit.com/store/implementing-domain-driven-design-9780321834577>
- "Hexagonal Architecture":
  <https://alistair.cockburn.us/hexagonal-architecture/>
- "Clean Architecture":
  <https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html>
- "Package by feature, not by layer":
  <https://phauer.com/2020/package-by-feature/>
- "Boundaries":
  <https://www.destroyallsoftware.com/talks/boundaries>
