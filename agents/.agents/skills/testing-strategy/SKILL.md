---
name: testing-strategy
description:
  Use when writing tests, deciding what to test, choosing between
  mocks/stubs/fakes, managing flaky tests, measuring test quality, or discussing
  property-based testing, mutation testing, contract testing, or test pyramid
  ratios. Also use when the user asks why tests pass but production breaks, or
  how to test code with external dependencies.
---

# Testing Strategy

## Mutation Score Over Coverage Percentage

**Coverage percentage** measures which lines were executed — not whether the
tests would catch a bug. A test can execute a line and make no assertion,
showing 100% coverage with zero confidence.

**Mutation score** measures whether your tests catch changes to the code. A
mutation testing tool (Stryker, mutmut, PIT, cargo-mutants) makes small code
changes (mutations) and checks if any test fails. If none fail, the test suite
is weak.

Target: **70–90% mutation score on business logic**. Getting to 100% has
diminishing returns; prioritise the domain model and invariants.

Run mutation testing on CI weekly or pre-release, not on every commit (it's
slow).

---

## Test Double Taxonomy (Meszaros)

Use the correct term for the correct tool:

| Type      | Description                        | When to use                                        |
| --------- | ---------------------------------- | -------------------------------------------------- |
| **Dummy** | Passed but never used              | Satisfying parameter lists                         |
| **Stub**  | Returns canned responses           | Providing indirect inputs to the system under test |
| **Spy**   | Records calls for later assertion  | Verifying indirect outputs                         |
| **Mock**  | Pre-programmed with expectations   | Verifying interactions (use sparingly)             |
| **Fake**  | Working implementation, simplified | Replacing expensive dependencies in tests          |

**Preference order: Fake > Stub > Mock**

- **Fakes** (e.g. in-memory repository, SQLite instead of Postgres) give you the
  most confidence — they test real behaviour without real infrastructure.
- **Stubs** are appropriate for indirect inputs (a clock that returns a fixed
  time).
- **Mocks** test _how_ the code calls a dependency, not _what_ it achieves. They
  couple tests to implementation details and are the source of most "tests pass,
  production breaks" situations.

**Never mock what you don't own.** Don't mock the Stripe SDK — mock the
abstraction you own that wraps it. If you mock the SDK, you're testing your
understanding of Stripe's API, not your code.

---

## Property-Based Testing

Property-based testing generates hundreds of random inputs and checks that a
property holds for all of them. It finds edge cases you wouldn't think to write
by hand.

Empirical result (OOPSLA 2025): PBT is ~52× more likely to catch a mutation than
a single example-based unit test.

```python
from hypothesis import given, strategies as st

@given(st.lists(st.integers()))
def test_sort_is_idempotent(xs):
    assert sorted(sorted(xs)) == sorted(xs)

@given(st.integers(), st.integers())
def test_add_commutative(a, b):
    assert add(a, b) == add(b, a)
```

**Good properties to test:**

- Round-trips: `deserialise(serialise(x)) == x`
- Idempotence: `f(f(x)) == f(x)`
- Invariants: "the total is always positive"
- Equivalence: "the fast path and slow path produce the same result"
- Symmetry: "order doesn't matter for commutative operations"

Libraries: Hypothesis (Python), fast-check (TypeScript/JS), proptest (Rust),
QuickCheck (Haskell/Erlang), jqwik (Java).

---

## Contract Testing at Service Boundaries

Integration tests between services are slow, flaky, and require running all
services simultaneously. Contract tests decouple the services while still
verifying the interface.

**Pact** (consumer-driven contract testing):

1. Consumer writes a test that defines what it sends and what it expects back.
2. Pact generates a contract (JSON pact file).
3. Provider verifies its implementation against the contract in isolation.
4. No need to run consumer and provider simultaneously.

Use contract testing at every service boundary. Use E2E tests sparingly — only
for critical happy-path smoke tests.

---

## Determinism as a Quality Axis

Flaky tests are worse than no tests — they erode trust and slow CI.

Root causes of flakiness:

- **Non-deterministic time:** inject the clock; use a fixed or controllable
  clock in tests.
- **Non-deterministic randomness:** seed the RNG with a fixed value in tests.
- **Shared state:** each test must set up and tear down its own state. Never
  share DB rows between tests.
- **Async races:** don't `sleep()` to wait for async operations. Use assertions
  that retry with a timeout, or make the system synchronous in tests.
- **Test order dependency:** tests must be independent. Run with
  `--randomise-order` to catch order dependencies.

---

## Test Pyramid Ratios

```
        ▲ E2E / UI       (few: 5–10 per critical flow)
       ▲▲▲ Integration   (some: cover each service boundary)
      ▲▲▲▲▲ Unit         (many: cover all domain logic)
```

**Unit tests:** fast (<1ms each), test pure calculations and domain logic, no
I/O. Aim for thousands.

**Integration tests:** test that components work together — DB queries, external
API calls (against test doubles), message bus handlers. Slower (seconds). Aim
for hundreds.

**E2E / UI tests:** test critical user flows against a running system. Slowest,
most brittle. Use only for smoke tests and the top 5–10 user journeys.

**Avoid the testing ice cream cone** (inverted pyramid): mostly E2E with few
unit tests. It's slow, brittle, and expensive to maintain.

**CI stage budgets:** unit suite <2min, integration suite <10min, E2E suite
<20min.

---

## What to Assert

Test **behaviour, not implementation:**

```python
# Bad: tests implementation details
def test_calls_repository():
    mock_repo.save.assert_called_once_with(order)

# Good: tests behaviour
def test_order_is_persisted():
    place_order(order)
    assert find_order(order.id) == order
```

Good assertions:

- Verify the output or return value
- Verify observable side effects (a row in the DB, a message on the queue)
- Verify the system state before and after

Bad assertions:

- Verify that a specific private method was called
- Verify the exact number of times a dependency was called (unless that IS the
  contract)

---

## Tests as Specifications

A test suite is the executable spec for the system. A new engineer should be
able to read the tests and understand the contract — inputs, outputs,
invariants, edge cases — without reading the implementation.

Write test names as statements of behaviour, not procedures:

```
# Bad
test_order_1
test_calculate
test_happy_path

# Good
test_order_rejects_negative_quantity
test_tax_is_zero_for_tax_exempt_jurisdictions
test_empty_cart_cannot_be_checked_out
```

Group tests by behaviour, not by the method under test. The reader wants to
answer "what does this system guarantee?" not "what methods exist on this
class?"

---

## Don't Test the Framework

Tests exist to prove _your_ logic is correct. They shouldn't re-prove the
framework, language, or library you depend on — those have their own test
suites.

Red flags:

- Tests that exercise ORM query builders rather than your domain logic
- Tests that verify the web framework routes `/foo` to `FooHandler`
- Tests asserting that `json.dumps` round-trips a dict
- Tests pinning the behaviour of a standard library function

Each of these adds maintenance cost (the test breaks on framework upgrades)
without adding proof (the framework's own test suite already covers it). Spend
the effort on domain rules, boundary behaviour, and invariants unique to your
system.

Corollary: **never mock what you don't own**. If you need to verify an
integration with a third-party API, test against a fake you control or a
recorded contract — don't stub the vendor's SDK and call it a test.
