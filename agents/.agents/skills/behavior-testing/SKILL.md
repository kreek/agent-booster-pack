---
name: behavior-testing
description:
  Best practices for writing behavior-focused tests that prove a feature works
  from the caller's point of view. Use whenever the user is writing tests,
  reviewing tests, adding coverage for a feature, deciding what to test or skip,
  naming tests, picking what to mock, or fixing flaky or over-specified test
  suites. Language and framework agnostic, applying to any spec-style test
  framework with describe/context/it blocks (RSpec, Vitest, Jest, Mocha,
  Jasmine, Pest, Kotest, Spek, Ginkgo, Quick, pytest-describe, and similar).
  Treats each test as a proof that a specific user-observable behavior is
  implemented correctly. Explicitly does not test framework or library
  internals. Trigger even when the user does not say "behavior-driven" or "BDD",
  e.g. prompts like "add a test for X", "what should I test here", "these tests
  are flaky", "how do I mock this", "write a spec for", "test this feature", or
  "is this worth testing" should all pull this skill in.
---

# Behavior Testing

A test is a proof. It demonstrates that, given some starting state and some
action, a specific observable thing happens. That is the only thing a test
should do.

This skill is about **proving user-observable behavior works**, using the
describe/context/it idiom that most modern test frameworks share. It borrows
BDD's discipline around naming and structure without requiring Gherkin, feature
files, or writing tests before code. It is compatible with any language and any
framework that uses nested describe/context/it blocks.

## What counts as a user-observable behavior

The "user" is whoever calls the code under test. Sometimes that is a human
clicking a button, sometimes it is another service posting JSON, sometimes it is
a teammate calling a function. The user-observable behavior is what that caller
sees happen.

A behavior test answers one question:

> When [condition] and [action], does [specific observable outcome] occur?

Concrete examples of behaviors worth proving:

- When the cart is empty and the user clicks checkout, the server returns a 400
  and no order is created.
- When an idempotency key is reused within 24 hours, the second POST returns the
  original response without reprocessing.
- When a prescription is refilled more than the allowed number of times, the
  refill attempt fails with a specific error.
- When a feature flag is off, the new code path is not reached.

If you cannot phrase what you are testing as a "when X and Y, Z" sentence, the
test is probably not proving a behavior. It is probably exercising code.

## What NOT to test

This is the other half of the discipline. The core rule:

**Do not test anything that is not your code.** Your dependencies have their own
tests. Your framework has its own tests. Your language's standard library has
its own tests. If your test would still pass with the exact same assertions
after you replaced your feature code with a different implementation using the
same library, the test is testing the library, not you.

Quick examples of tests that should not exist:

- "it validates presence of email" when the implementation is only
  `validates :email, presence: true` (testing ActiveRecord).
- "it persists to the database" when the implementation is only `user.save`
  (testing the ORM).
- "it returns JSON" when the implementation is only `render json: user` (testing
  the framework).
- "it re-renders when props change" for a plain React component (testing React).
- Tests for getters and setters that have no logic.
- Tests that call a private method directly and check its return value.

A test earns its place when it proves behavior that is specific to your feature
and would plausibly break if someone refactored.

## Enter at the outermost observable boundary

When a feature is reachable from outside the process, its user lives outside the
process. Test at that boundary, not at an internal seam. A passing
`normalizeUrl()` unit test does not prove `POST /api/links` returns 201 with a
short URL.

Pick the entry point by app shape:

| App shape                     | Test through                                                                                                                 |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| HTTP service / REST / GraphQL | Send real requests through the framework's test client (SvelteKit adapter, supertest, `httpx.AsyncClient`, Rack::Test, etc.) |
| Web UI (SSR or SPA)           | Render via a component-testing library; interact via role-based queries                                                      |
| CLI                           | Spawn the binary with argv and stdin; assert on stdout, stderr, and exit code                                                |
| Library                       | Call the public API; assert on return values and emitted effects                                                             |
| Background worker             | Enqueue a real message; assert on downstream state changes                                                                   |
| Stream processor              | Feed input records; assert on output records                                                                                 |

Rule: **pick the outermost boundary you own, and test through it.** Tests below
that boundary only earn their place when the logic they cover is non-trivial in
isolation — a pure algorithm, a parser, a complex state machine. A thin
persistence layer whose only job is to wrap SQL does not need unit tests; the
endpoint tests cover it.

Common miss for web apps: the agent writes unit tests for a `db.ts` or
`service.ts` module and stops, leaving the HTTP handlers, form actions, and
redirects untested. Those are where the feature lives. Test them.

## The three blocks

Most spec-style frameworks give you three nesting blocks. They mean different
things. Use each for its purpose.

| Block      | Purpose                                     | Example                                 |
| ---------- | ------------------------------------------- | --------------------------------------- |
| `describe` | The thing or feature being tested           | `describe "the checkout endpoint"`      |
| `context`  | A condition or state that affects behavior  | `context "when the cart is empty"`      |
| `it`       | A single observable behavior, asserted once | `it "returns 400 and creates no order"` |

Nest contexts to layer state. Each context block adds one condition on top of
its parent.

```
describe "the checkout endpoint"
  context "when the user is not authenticated"
    it "returns 401"
    it "does not charge the card"

  context "when the user is authenticated"
    context "and the cart is empty"
      it "returns 400"
      it "does not create an order"

    context "and the cart has items"
      context "and the card is declined"
        it "returns 402"
        it "does not create an order"
        it "does not send a confirmation email"

      context "and the card is accepted"
        it "returns 201 with the order id"
        it "creates an order with status 'paid'"
        it "sends a confirmation email"
```

Read that top to bottom. Every leaf describes a real, observable proof.

## Naming: the test output reads as a sentence

When a test runner prints `describe` + nested `context`s + `it`, the result
should read as natural English. This is the single biggest lever for legibility.
Get it right and the test file doubles as specification.

Good (reads as "PaymentService, when the card is declined, does not record the
payment"):

```
describe "PaymentService"
  context "when the card is declined"
    it "does not record the payment"
```

Bad (reads as "PaymentService testCardDeclined"):

```
describe "PaymentService"
  it "testCardDeclined"
```

Rules:

- `describe` takes a noun phrase: the subject or feature.
- `context` always starts with a preposition or conjunction: `when`, `with`,
  `without`, `and`, `given`, `if`, `after`, `before`. A context that does not
  start with one of those is probably misused as a describe.
- `it` starts with a verb: the subject's behavior. Not
  `it "test charge succeeds"`; just `it "charges the card"` or
  `it "returns 201"`. The framework supplies the `it`; do not restate it.
- Prefer behaviors named after their effect on the caller, not after internal
  state: `it "returns the existing order"` over `it "hits the cache"`.

## Structure: arrange, act, assert

Every `it` block has three phases, ideally visually separated by blank lines.

```
it "charges the card and returns 201" {
  // Arrange: set up the state this behavior needs
  cart    = a cart with two items
  paymentProvider.willAccept()

  // Act: the single action under test
  response = checkout(cart, paymentProvider)

  // Assert: the one or more observable outcomes of that action
  expect(response.status).toBe(201)
  expect(response.body.orderId).toBeDefined()
}
```

Guidelines:

- **One behavior per test.** Multiple calls are fine when the behavior is the
  sequence itself: retry, idempotency, cache miss then hit, or a state
  transition. Split only when the calls assert unrelated outcomes.
- **Assert the behavior, not the mechanism.** Assert the response the caller
  receives, the message the queue got, the email that went out. Do not assert
  that a specific internal method was called unless the externally visible
  behavior genuinely depends on that call.
- **Multiple related assertions are fine** when they describe a single behavior
  from different angles (status + body + side effect). Just keep them focused on
  the one behavior.
- **Shared arrange goes in `before` / `beforeEach` / `let`.** Setup that every
  test in a context needs should not be copy-pasted. But do not over-hoist: if a
  detail matters to the test's meaning, keep it visible inside the `it`.

## Mock at the edges, not the middle

Mocks are for the boundaries of your system: HTTP clients, message queues,
clocks, random number generators, third-party SDKs. They are not for your own
code under test.

- **Do mock**: outbound HTTP calls, database calls when the behavior under test
  is not about persistence, the system clock when time matters, random values
  when the test needs determinism.
- **Do not mock**: the function you are testing, the class that contains the
  behavior you are asserting, adjacent business logic the caller would actually
  exercise in production.

If a test needs so many mocks that setting them up takes more lines than the
assertion, the seams are probably wrong and the production code needs a rethink.
The test is giving you a signal: listen to it.

## Anti-patterns to flag on sight

If any of these show up in a test file you are touching or reviewing, call them
out:

- `describe` named after a function or class method (`describe "parseInput"`,
  `describe "#save"`) instead of a feature or subject. Rewrite to describe a
  feature or behavior.
- `it` named as a restatement of the test name (`it "test it works"`,
  `it "should correctly handle the case"`).
- `context` that does not start with `when`, `with`, `without`, `and`, `given`,
  `if`, `after`, or `before`.
- Tests that pass after deleting the production code they ostensibly cover.
  These are tautological, usually the result of over-mocking.
- Multiple unrelated acts in a single `it`.
- Private methods tested directly. Test through the public surface.
- Mocks of the class under test. You are no longer testing the class, you are
  testing your mock.
- Snapshot tests on complex objects whose exact shape is irrelevant to the
  behavior. They break on every refactor and nobody reads the diff.
- Tests that depend on execution order, global state that leaks across files, or
  specific wall-clock time.
- `sleep`, `setTimeout`, or arbitrary waits inside tests. Use deterministic
  fakes for time.
- Tests that exist only to raise coverage (`it "instantiates without error"`).
  Coverage is a downstream metric, not a goal.
- Tests whose failure message does not tell you what broke. A good test named
  `it "returns 400 when the email is missing"` with a clean assertion tells you
  everything from the failure line alone.
- Shared mutable fixtures that every test modifies. Use fresh setup per test, or
  immutable shared setup.
- Testing that the framework does its job (ORM persists, validator validates,
  serializer serializes, router routes). These tests test the framework.

## The decision loop

When you are about to write or keep a test, ask in order:

1. **Can I phrase what this test proves as "when X, Y happens"?** If not, stop.
   You are probably about to test implementation or coverage, not behavior.
2. **Is the thing happening (Y) observable to the caller?** If it is an internal
   state change that the caller never sees, reconsider whether it is really a
   behavior or just an implementation detail.
3. **Would this test still pass if I swapped the production code for a different
   implementation that met the same contract?** If no, the test is coupled to
   implementation. Loosen the assertions.
4. **Would this test pass if I deleted the production code and the framework did
   nothing?** If yes, the test is tautological. Delete it.
5. **Does the test name, read aloud with its enclosing contexts, describe a real
   user-observable requirement?** If not, rename until it does.

If all five pass, write the test.

## Cross-language note

The frameworks this skill targets share the same mental model but differ in
spelling: RSpec (Ruby), Vitest and Jest (TypeScript/JS), Mocha, Jasmine, Pest
(PHP), Kotest and Spek (Kotlin), Ginkgo (Go), Quick (Swift), pytest-describe
(Python). The naming rules, structure rules, and anti-patterns apply identically
across all of them. Pick the one that fits the project; the discipline is the
same.
