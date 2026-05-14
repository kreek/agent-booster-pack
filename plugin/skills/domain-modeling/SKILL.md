---
name: domain-modeling
description: Use for domain modeling, data shapes, invariants, state transitions, parsing, and effects.
---

# Domain Modeling

## Iron Law

`ILLEGAL STATES MUST BE UNREPRESENTABLE IN THE DOMAIN CORE.`

If the type or data shape permits a state the domain forbids, a future caller
will construct it.

## When to Use

- Data shape affects correctness: domain data, fields, states, statuses,
  allowed combinations, transitions, validation boundaries, value objects,
  functional cores, or effect isolation.
- The next important step is shaping feature or domain data before
  implementation.
- Reviewing code where I/O, mutation, and business rules are coupled.

## When NOT to Use

- Public HTTP contract details; use `api`.
- Database physical schema, indexes, or migrations; use `database`.
- Module organization, layering, DDD tactical patterns; use `architecture`.
- Broad refactoring sequence; use `refactoring`.

## Core Ideas

1. Decide data shapes and invariants before writing transformations.
2. Distinguish identity, state, value, and time. Prefer immutable records,
   sums, and maps. Treat classes that wrap pure functions as modules; avoid
   classes that bundle behavior with mutable state.
3. Split code into data, calculations, and actions; maximize data/calculations
   and minimize actions.
4. Parse at boundaries into trusted internal shapes; do not pass raw external
   data inward.
5. Make illegal states unrepresentable with explicit alternatives, not
   flag/null combinations.
6. Model workflows as `Input -> Result<Output, Error>` pipelines where errors
   are data.
7. Effects (async, exceptions, I/O, ambient mutation, shared state) are
   contagious; keep them at the imperative shell so the functional core stays
   pure and composable.
8. Discover model abstractions from repeated domain meaning. Do not invent
   generic wrappers, base classes, or helper layers before the data proves
   they pay for themselves.

## Workflow

1. Name the domain data, invariants, states, and transitions.
2. Identify external inputs and define parse/construct boundaries.
3. Replace invalid flag/nullable combinations with explicit variants or
   validated wrappers.
4. Shape the workflow as transformations over values with explicit
   success/error results.
5. Move async, exceptions, I/O, clocks, randomness, logging, persistence, and
   mutation to the shell.
6. For each non-trivial invariant or transition, record a Proof Contract:
   claim, data invariant, boundary, check, evidence.

## Crosscutting Hazards

Load the matching reference whenever time or money appears in the diff.

- `references/dates.md`: when storing, comparing, formatting, serializing, or
  computing on dates / times.
- `references/money.md`: when storing, comparing, formatting, serializing, or
  computing on monetary amounts.

## Verification

- [ ] Public domain functions are classifiable as data, calculation, or action.
- [ ] External input is parsed once at the boundary; internal code does not
      handle raw untrusted strings/maps.
- [ ] Invalid state combinations cannot be represented directly.
- [ ] Workflows compose value transformations with explicit success/error
      results.
- [ ] Core tests run without mocks, monkey-patches, databases, network, or
      global time.
- [ ] Effects are explicit in function names, return types, or call sites and
      stay at the shell.
- [ ] Every non-trivial invariant or transition has proof evidence, or the
      claim is reported as unproven.
- [ ] When dates or money appear in the change, the matching `references/`
      file was loaded and its boundary discipline was applied.

## Tripwires

Use these when the shortcut thought appears:

- Parse once at each external boundary into a trusted shape.
- Model allowed states as explicit variants instead of boolean flag
  combinations.
- Split nullable meanings into named states unless absence has one clear
  meaning.
- Convert request JSON to an internal domain shape before domain work.
- Move database, network, clock, randomness, logging, and mutation effects to
  the shell.
- Add generic wrappers only after repeated domain meaning proves the
  abstraction.

## Handoffs

- `specify`: contracts whose data shape is being modeled.
- `architecture`: module boundaries, locality, layering, what changes together.
- `database`: schema enforcement for invariants that race under concurrency.
- `proof`: data-claim and public-boundary behavior evidence.
- `error-handling`: parse failures, Result/Either shape, error context.
- `async-systems`: mutable places or ownership crossing task/thread boundaries.

## References

- `references/dates.md`: timezone-aware always; UTC storage; ISO 8601 / RFC 3339 wire format; instant vs wall-clock-only distinction.
- `references/money.md`: never `float`; amount + currency travel together; ISO 4217 codes; per-currency decimal places.
- "Parse, Don't Validate":
  <https://lexi-lambda.github.io/blog/2019/11/05/parse-don-t-validate/>
- "Effective ML / Make Illegal States Unrepresentable":
  <https://blog.janestreet.com/effective-ml-revisited/>
