---
name: architecture
description: >-
  Use when deciding module boundaries, organizing code by domain/feature
  versus horizontal controller/service/repository/DTO layers, applying DDD
  tactical patterns (aggregates, repositories, factories, domain services),
  shaping bounded contexts, separating concerns that change for different
  reasons, defining contracts between internal boundaries, mapping data flow
  through a component, or hiding volatile design decisions behind small
  surfaces. Also use when the user mentions domain-driven design, DDD,
  hexagonal architecture, ports and adapters, clean architecture, layered
  architecture, vertical slices, domain locality, coupling, tangled modules,
  schema/model mapping, or data flow between a service, client, domain model,
  output shape, and render step.
---

# Architecture

## Iron Law

`ORGANIZE BY WHAT CHANGES TOGETHER. NEVER SCATTER ONE BEHAVIOR ACROSS LAYERS BY DEFAULT.`

If a single feature requires editing four files in four directories every time
it changes, the structure is fighting the work.

## When to Use

- Choosing between domain/feature-oriented organization and horizontal
  controller/service/repository/DTO layers.
- Drawing module boundaries, bounded contexts, and public surfaces.
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

- Data shape, invariant, and effect discipline; use `data-first`.
- Public HTTP contract details; use `api`.
- Database physical schema, indexes, or migrations; use `database`.
- Reshaping existing code while preserving behavior; use `refactoring`.

## Core Ideas

1. Organize by what changes together. Behavior, data shapes, invariants, and
   tests for one feature should live close enough to edit in one window.
2. Prefer domain/feature locality over horizontal layering. Horizontal
   controller/service/repository/DTO splits are useful at real technical
   boundaries; they are harmful when they scatter one behavior across many
   files by default.
3. Use DDD tactically, not ceremonially. The language, states, invariants,
   and workflow boundaries are the load-bearing part. Formal aggregates,
   repositories, factories, and domain services are optional and must earn
   their keep.
4. Hide volatile design decisions behind small surfaces, not flowchart steps.
   Module boundaries are about what callers don't need to know, not about
   sequencing.
5. Define contracts at internal boundaries. Each module/component boundary
   should say what shape crosses it, what assumptions are guaranteed, and
   what internal details must not leak. Public HTTP contracts belong to
   `api`; exact parsed shapes and invariants belong to `data-first`.
6. Bounded contexts beat shared models. When two parts of the system mean
   subtly different things by the same word, give each context its own type.
7. Separate things that change for different reasons. A simple boundary
   reduces coordination between independent changes; an easy layer that every
   feature must cross usually increases it.
8. Make component data flow explicit when a feature consumes external data.
   Name where data enters, where it is parsed or normalized, which internal
   shape owns domain meaning, and which output/view shape feeds presentation.
   These are roles in the flow, not mandatory folders. Raw service payloads
   should not leak past the trust boundary by accident.
9. Add a layer only when it represents a real boundary (process, deploy,
   trust, persistence, transport) or removes proven duplication.
   Request middleware is a transport boundary; it should carry
   pipeline-wide concerns, not feature-specific business behavior.

## Workflow

1. Name the business capability and its transitions before drawing modules.
2. Sketch the module surface from the caller's view: what it accepts, what
   it returns, what it must never expose.
3. Sketch the internal data path: where external data enters, where it is
   parsed into a trusted shape, where domain work happens, where output data
   is shaped, and what the renderer/presenter receives.
4. Group code by capability first; introduce horizontal layers only where a
   real technical boundary justifies them.
5. For each cross-module call, ask whether the caller depends on a stable
   contract or on internal shape. Stabilise the contract; hide the shape.
6. Record the decisions that future readers can't recover from the code:
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
- [ ] Boundaries separate concerns that change independently; they are
      not merely steps in a flowchart.
- [ ] Bounded contexts are explicit where the same word means different
      things in different parts of the system.
- [ ] Architectural decisions whose rationale isn't recoverable from the
      code are recorded (ADR, comment, or commit message).

## Handoffs

- Use `data-first` to design data shapes, invariants, and effect isolation
  inside a module, including the exact parsed and output shapes.
- Use `refactoring` to move existing code toward the chosen structure
  without changing behavior.
- Use `api` when the boundary in question is a public HTTP contract.
- Use `documentation` for ADRs that capture the rationale.

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
