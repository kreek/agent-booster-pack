---
name: data
description:
  Use when designing data models, choosing between records/classes/tuples/maps,
  handling state transitions, deciding what should be a value vs a mutable
  place, reasoning about side effects, or reviewing code that mixes I/O with
  pure logic. Also use when the user mentions immutability,
  parse-don't-validate, illegal states, Hickey, Normand, Grokking Simplicity,
  functional core, or effect isolation.
---

# Data

## Iron Law

`ILLEGAL STATES MUST BE UNREPRESENTABLE IN THE DOMAIN CORE.`

If the type or data shape permits a state the domain forbids, a future caller
will construct it.

## When to Use

- Designing domain data, state transitions, validation boundaries, value
  objects, functional cores, or effect isolation.
- Reviewing code where I/O, mutation, and business rules are tangled.

## When NOT to Use

- Public HTTP contract details; use `api`.
- Database physical schema, indexes, or migrations; use `database`.
- Broad refactoring sequence; use `refactoring`.

## Core Ideas

1. Decide data shapes and invariants before writing transformations.
2. Split code into data, calculations, and actions; maximize data/calculations
   and minimize actions.
3. Parse at boundaries into trusted internal shapes; do not pass raw external
   data inward.
4. Make illegal states unrepresentable with explicit alternatives, not flag/null
   combinations.
5. Model workflows as `Input -> Result<Output, Error>` pipelines where errors
   are data.
6. Hide volatile design decisions behind small surfaces, not flowchart steps.
7. Treat async, exceptions, I/O, ambient mutation, and shared places as
   contagious effects; isolate them honestly.

## Workflow

1. Name the domain data, invariants, states, and transitions.
2. Identify external inputs and define parse/construct boundaries.
3. Replace invalid flag/nullable combinations with explicit variants or
   validated wrappers.
4. Shape the workflow as transformations over values with explicit success/error
   results.
5. For each non-trivial invariant or transition, record a Proof Contract: claim,
   data invariant, boundary, check, evidence.
6. Move async, exceptions, I/O, clocks, randomness, logging, persistence, and
   mutation to the shell.
7. Keep module surfaces small around decisions likely to change.

## Verification

- [ ] Public domain functions are classifiable as data, calculation, or action.
- [ ] External input is parsed once at the boundary; internal code does not
      handle raw untrusted strings/maps.
- [ ] Invalid state combinations cannot be represented directly.
- [ ] Workflows compose value transformations with explicit success/error
      results.
- [ ] Core tests run without mocks, monkey-patches, databases, network, or
      global time.
- [ ] Module boundaries hide volatile decisions, not merely sequential steps.
- [ ] Effects are explicit in function names, return types, or call sites and
      stay at the shell.
- [ ] Every non-trivial invariant or transition has proof evidence, or the claim
      is reported as unproven.

## Handoffs

- Use `proof` when data claims need explicit proof obligations.
- Use `tests` to prove domain behavior through public boundaries.
- Use `errors` for parse failures, Result/Either shape, and error context.
- Use `concurrency` when mutable places or ownership cross task/thread
  boundaries.

## References

- Rich Hickey, "Simple Made Easy":
  <https://www.infoq.com/presentations/Simple-Made-Easy/>
- Rich Hickey, "The Value of Values":
  <https://www.infoq.com/presentations/Value-Values/>
- Eric Normand, _Grokking Simplicity_:
  <https://www.manning.com/books/grokking-simplicity>
