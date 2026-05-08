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

- Any data modeling: domain data, fields, states, statuses, allowed
  combinations, state transitions, validation boundaries, value objects,
  functional cores, or effect isolation.
- Immediately after scaffolding when the specs are clear and the next
  step is shaping feature/domain data before implementation.
- Reviewing code where I/O, mutation, and business rules are tangled.

## When NOT to Use

- Public HTTP contract details; use `api`.
- Database physical schema, indexes, or migrations; use `database`.
- Module organization, layering, DDD tactical patterns; use `architecture`.
- Broad refactoring sequence; use `refactoring`.

## Core Ideas

1. Decide data shapes and invariants before writing transformations.
2. Distinguish identity, state, value, and time. Prefer immutable values
   and plain data shapes (records, sums, maps) over inheritance or classes
   that bundle behavior with mutable state; a class wrapping pure functions
   is a module.
3. Split code into data, calculations, and actions; maximize data/calculations
   and minimize actions.
4. Parse at boundaries into trusted internal shapes; do not pass raw external
   data inward.
5. Make illegal states unrepresentable with explicit alternatives, not
   flag/null combinations.
6. Model workflows as `Input -> Result<Output, Error>` pipelines where errors
   are data.
7. Effects (async, exceptions, I/O, ambient mutation, shared places) are
   contagious; keep them at the imperative shell so the functional core stays
   pure and composable.
8. Discover model abstractions from repeated domain meaning. Do not invent
   generic wrappers, base classes, or helper layers before the data says they
   pay for themselves. Use workflow's `references/simple-not-easy.md` when
   the choice is between a direct data shape and ceremony that only makes the
   next step feel easier.

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

Time and money cause more boundary bugs than any other domain. Load the
matching reference whenever either appears in the diff.

- `references/dates.md`: when storing, comparing, formatting, serialising, or
  computing on dates / times.
- `references/money.md`: when storing, comparing, formatting, serialising, or
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

## Handoffs

- Use `whiteboarding` upstream to enumerate the contracts whose data shape
  you are modeling, before formalizing invariants here.
- Use `architecture` when module boundaries, domain/feature locality, or
  layering decisions are in scope, especially when the question is what
  changes together rather than what data shape is valid.
- Use `database` when an invariant identified here must be enforced at the
  schema layer (uniqueness, referential integrity, exclusion). Domain-level
  invariants without DB-level enforcement race under concurrency.
- Use `proof` for data-claim proof obligations and for proving domain
  behavior through public boundaries.
- Use `error-handling` for parse failures, Result/Either shape, and error
  context.
- Use `async-systems` when mutable places or ownership cross task/thread
  boundaries.
- Use workflow's `references/simple-not-easy.md` when a generic helper,
  wrapper, or layer is being proposed as "simpler" before the data or effects
  justify it.

## References

- `references/dates.md`: timezone-aware always; UTC storage; ISO 8601 / RFC 3339 wire format; instant vs wall-clock-only distinction.
- `references/money.md`: never `float`; amount + currency travel together; ISO 4217 codes; per-currency decimal places.
- "Parse, Don't Validate":
  <https://lexi-lambda.github.io/blog/2019/11/05/parse-don-t-validate/>
- "Effective ML / Make Illegal States Unrepresentable":
  <https://blog.janestreet.com/effective-ml-revisited/>
