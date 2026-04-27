---
name: testing
description: >-
  Use for behavior-focused tests: adding or reviewing coverage, choosing test
  boundaries, assertions, names, mocks, spec style, flake fixes, and avoiding
  over-specified tests.
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
   caller observes. Enter at the outermost practical boundary: HTTP,
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
- [ ] Mocking choices were reviewed against the system-boundary rule.

## Tripwires

| Trigger | Do this instead | False alarm |
|---|---|---|
| "Too simple to test" | Write the smallest behavior test that would fail if the code did nothing. | Pure formatting, copy, or generated metadata changes. |
| "Already covered by another test" | Name the existing behavior test or add the missing assertion. | The named test enters through the same caller boundary and would fail for this bug. |
| "Mock is faster than a fixture" | Use the real collaborator unless it crosses a true system boundary. | Clock, network, third-party service, process, filesystem, or expensive infrastructure. |
| "I'll add tests after the feature lands" | Add the behavior assertion before claiming the feature is done. | Exploratory spike explicitly marked as not complete. |
| "Private helper, no boundary needed" | Test through the public boundary that reaches the helper. | The helper is a pure algorithm with meaningful behavior not reachable cheaply elsewhere. |

## Handoffs

- Use `proof` when the work needs explicit proof contracts, evidence
  tracking, or unproven-claim reporting.
- Use `debugging` to reproduce and root-cause a bug before writing the
  guard test.
- Use `refactoring` when tests are characterization coverage for legacy
  code.
- Use `data-first` when behavior is hard to test because pure logic
  is mixed with I/O.
