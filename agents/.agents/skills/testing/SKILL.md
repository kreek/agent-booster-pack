---
name: testing
description:
  Best practices for writing behavior-focused tests from the caller's point of
  view. Use whenever the user is writing tests, reviewing tests, adding coverage
  for a feature, deciding what to test or skip, naming tests, picking what to
  mock, or fixing flaky or over-specified test suites. Language and framework
  agnostic, applying to any spec-style test framework with describe/context/it
  blocks (RSpec, Vitest, Jest, Mocha, Jasmine, Pest, Kotest, Spek, Ginkgo,
  Quick, pytest-describe, and similar). Focuses on test boundaries, names,
  assertions, mocks, and flake resistance. Explicitly does not test framework or
  library internals. Trigger even when the user does not say "behavior-driven"
  or "BDD", especially for prompts about adding tests, choosing what to test,
  fixing flaky tests, choosing mocks, writing specs, or deciding whether
  something is worth testing.
---

# Testing

## Iron Law

`TEST BEHAVIOR AT THE OUTERMOST OBSERVABLE BOUNDARY.`

## When to Use

- Adding or reviewing tests for a feature, bug fix, refactor, flaky
  test, mock-heavy test, or untested behavior.
- Deciding what deserves coverage and which boundary the test should
  enter through.

## When NOT to Use

- Load testing, profiling, or benchmark design; use `performance`.
- Security-specific abuse tests; pair this with `security`.
- Pure toolchain setup; use `scaffolding`.

## Core Ideas

1. Test behavior, not implementation: assertions describe what a
   caller observes. Enter at the outermost practical boundary — HTTP,
   CLI, UI, public API, or module facade.
2. One test covers one behavior; if the name needs "and", split it.
3. Prefer real collaborators until they cross a true system boundary.
   Mock only at edges: clock, network, third-party service, process,
   filesystem, or expensive infrastructure not under test.
4. A good test would survive a full implementation swap that preserves
   the contract.
5. Flaky tests are bugs in the test, code, or environment; do not hide
   them with sleeps or retries.

## Workflow

1. Name the behavior in caller language. Choose the boundary that
   would catch the wiring mistake most likely to ship.
2. Identify the behavior claim the test must protect. Arrange only the
   state a real caller needs; act once; assert on externally visible
   state, output, response, event, or error.
3. Run the focused test and then the relevant suite.

## Verification

- [ ] At least one test exercises the outermost practical boundary.
- [ ] Test names read as behavior statements when nested labels are
      combined.
- [ ] Assertions are about observable outcomes, not private methods or
      call choreography.
- [ ] Mocks appear only at true system boundaries or have a documented
      reason.
- [ ] The test would fail if production code did nothing, and would
      survive a contract-preserving implementation swap.
- [ ] Tests are order-independent and do not rely on arbitrary sleeps.
- [ ] `scripts/sniff-mocks.sh <test-dir>` is clean or findings are
      explained.

## Handoffs

- Use `proof` when the work needs explicit proof contracts, evidence
  tracking, or unproven-claim reporting.
- Use `debugging` to reproduce and root-cause a bug before writing the
  guard test.
- Use `refactoring` when tests are characterization coverage for legacy
  code.
- Use `domain-design` when behavior is hard to test because pure logic
  is mixed with I/O.

## Tools

- `scripts/sniff-mocks.sh <test-dir>`: warning-only scan for mock
  abuse, private-method testing, call-count-only assertions, and
  arbitrary waits.
