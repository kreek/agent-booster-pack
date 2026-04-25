---
name: domain-design
description:
  Use when designing domain models, data shapes, state transitions, invariants,
  value objects, or choosing records/classes/tuples/maps; when deciding what
  should be a value vs a mutable place; when organizing code by domain/feature
  vs horizontal layers; when reasoning about side effects; or when reviewing
  code that mixes I/O with domain rules. Also use when the user mentions
  immutability, parse-don't-validate, illegal states, values vs places,
  functional core / imperative shell, effect coloring, domain-driven design,
  layered architecture, domain locality, or premature abstraction.
---

# Domain Design

## Iron Law

`ILLEGAL STATES MUST BE UNREPRESENTABLE IN THE DOMAIN CORE.`

## When to Use

- Designing domain data, state transitions, validation boundaries, value
  objects, functional cores, or effect isolation.
- Choosing between domain/feature-oriented organization and horizontal
  controller/service/repository/DTO layers.
- Reviewing code where I/O, mutation, and business rules are tangled.

## When NOT to Use

- Public HTTP contract details; use `api`.
- Database physical schema, indexes, or migrations; use `database`.
- Broad refactoring sequence; use `refactoring`.

## Core Ideas

1. Decide data shapes and invariants before writing transformations.
2. Distinguish identity, state, value, and time. Prefer immutable values
   and plain data shapes (records, sums, maps) over classes that bundle
   behavior with mutable state. A class wrapping pure functions is a
   module.
3. Split code into data, calculations, and actions; maximize
   data/calculations and minimize actions.
4. Parse at boundaries into trusted internal shapes; do not pass raw
   external data inward. Make illegal states unrepresentable with
   explicit alternatives, not flag/null combinations.
5. Model workflows as `Input -> Result<Output, Error>` pipelines where
   errors are data.
6. Effects (async, exceptions, I/O, ambient mutation, shared places)
   are contagious; keep them at the imperative shell so the functional
   core stays pure and composable.
7. Prefer domain/feature locality over horizontal layering when it
   keeps behavior, data shapes, invariants, and tests close together.
   Use DDD tactically for language, states, invariants, and workflow
   boundaries; formal aggregates, repositories, factories, and domain
   services are optional and must earn their keep.
8. Horizontal layers are useful at real technical boundaries, but do
   not split code into controller/service/repository/DTO layers by
   default when that scatters one behavior across many files.
9. Hide volatile design decisions behind small surfaces, not flowchart
   steps. Discover abstractions; don't invent them.

## Workflow

1. Name the domain data, invariants, states, and transitions; identify
   external inputs and define parse/construct boundaries.
2. Replace invalid flag/nullable combinations with explicit variants or
   validated wrappers. Shape the workflow as transformations over values
   with explicit success/error results.
3. Start organization from the business capability and its transitions.
   Add technical layers only when they represent real boundaries or
   remove proven duplication.
4. Move async, exceptions, I/O, clocks, randomness, logging,
   persistence, and mutation to the shell.
5. For each non-trivial invariant or transition, record a Proof
   Contract: claim, data invariant, boundary, check, evidence.

## Crosscutting Hazards

Time and money cause more boundary bugs than any other domain. Both are
canonical iron-law cases — illegal states are easy to represent unless
the type forces care. Load the right reference when either appears in
the diff:

- `references/dates.md` — storing, comparing, formatting, serialising,
  or computing on dates / times.
- `references/money.md` — storing, comparing, formatting, serialising,
  or computing on monetary amounts.

## Verification

- [ ] Public domain functions are classifiable as data, calculation, or
      action; effects stay at the shell.
- [ ] External input is parsed once at the boundary; internal code does
      not handle raw untrusted strings/maps.
- [ ] Invalid state combinations cannot be represented directly.
- [ ] Workflows compose value transformations with explicit
      success/error results.
- [ ] Core tests run without mocks, monkey-patches, databases, network,
      or global time.
- [ ] Behavior, data shapes, invariants, and tests are close together
      unless a real technical boundary justifies separation.
- [ ] Horizontal controller/service/repository/DTO layers are not
      scattering one behavior without a concrete reason.
- [ ] Module boundaries hide volatile decisions, not merely sequential
      steps.
- [ ] Every non-trivial invariant or transition has proof evidence, or
      the claim is reported as unproven.
- [ ] When dates or money appear in the change, the matching
      `references/` file was loaded and its boundary discipline applied.

## Handoffs

- Use `proof` when data claims need explicit proof obligations.
- Use `testing` to prove domain behavior through public boundaries.
- Use `error-handling` for parse failures, Result/Either shape, and
  error context.
- Use `concurrency` when mutable places or ownership cross task/thread
  boundaries.

## References

- `references/dates.md` — timezone-aware always; UTC storage; ISO 8601 / RFC 3339 wire format; instant vs wall-clock-only distinction.
- `references/money.md` — never `float`; amount + currency travel together; ISO 4217 codes; per-currency decimal places.
- "Parse, Don't Validate":
  <https://lexi-lambda.github.io/blog/2019/11/05/parse-don-t-validate/>
- "Effective ML / Make Illegal States Unrepresentable":
  <https://blog.janestreet.com/effective-ml-revisited/>
- "Designing with Types: Making Illegal States Unrepresentable":
  <https://fsharpforfunandprofit.com/posts/designing-with-types-making-illegal-states-unrepresentable/>
- "Railway Oriented Programming":
  <https://fsharpforfunandprofit.com/rop/>
- "Boundaries":
  <https://www.destroyallsoftware.com/talks/boundaries>
- "Out of the Tar Pit":
  <https://curtclifton.net/papers/MoseleyMarks06a.pdf>
- "What Color is Your Function?":
  <https://journal.stuffwithstuff.com/2015/02/01/what-color-is-your-function/>
- "Simple Made Easy": <https://www.youtube.com/watch?v=SxdOUGdseq4>
- "The Value of Values": <https://www.infoq.com/presentations/Value-Values/>
- _Grokking Simplicity_: <https://www.manning.com/books/grokking-simplicity>
