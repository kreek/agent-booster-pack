---
name: proof
description: Use for proof and tests, claims, invariants, behavior specs, edge cases, and evidence.
---

# Proof

## Iron Law

`NO ENGINEERING CLAIM WITHOUT A NAMED PROOF.`

## When to Use

Completion gate:

- Before saying work is done, fixed, ready to commit, ready for a PR, or
  passing. This includes marking a claim explicitly `unproven` with a
  named blocker.

Main skill when the requested work is proof itself:

- Adding or reviewing behavior-focused tests that prove a feature, bug
  fix, refactor, flaky test fix, or untested behavior.
- Deciding what deserves coverage and which boundary the proof should
  enter through.
- Converting an agreed spec, domain model, contract, or root-cause
  finding into Proof Contracts and executable checks.

## When NOT to Use

- Pure formatting, typo fixes, or mechanical file moves with no behavior,
  data, or contract claim.
- Mechanical refactors with no behavior surface (rename, file move,
  comment-only edits) verified by tooling or exact artifact inspection.
  Behavior-preserving refactors that change an observable boundary still need
  `proof`.
- Investigating an unconfirmed bug or symptom where the cause is not yet
  established. Use `debugging` until there is a claim to assert, then
  return for the Proof Contract.
- Reviewing changes for design, complexity, naming, or structure. Use
  `code-review`. Load `proof` only when the question is whether evidence
  is sufficient.
- Load testing, profiling, or benchmark design. Use `performance`.
- Pure toolchain setup (test runner, lint, typecheck baseline). Use
  `scaffolding`.

## Core Ideas

1. A proof is a named obligation tied to a claim. Missing evidence is an
   explicit `unproven` status, not silence that implies correctness.
2. Test-first is optional. Behavior-changing claims need executable proof, but
   new tests are not automatic. Do not add tests for mechanical, prose-only,
   or tooling-guaranteed facts.
3. A completion claim is still an engineering claim. Passing checks count
   only when they prove the latest request was actually satisfied.
4. Proof should teach the behavior, not only satisfy a checker. A good proof
   reads like a specification of the system contract for the next developer.
5. Different claims need different evidence: data claims need invariants,
   behavior claims need boundary checks, bug-fix claims need root-cause
   evidence plus a regression guard, refactor claims need before/after
   behavior preservation.
6. Test the caller-visible behavior at the outermost practical boundary where
   data shape, value, state, or error shape changes observably. Assertions
   should survive an implementation swap that preserves the contract.
7. Keep tests focused on one behavior and use real collaborators inside the
   boundary. Mock only true system boundaries such as clock, network,
   third-party service, process, filesystem, or expensive infrastructure.
   Do not test framework, language, runtime behavior, or static copy unless
   your code adds a contract on top of it. User-facing text deserves direct
   assertions only when it is parsed later, documented as contract, varies by
   branch, or carries a safety/fail-closed instruction.
8. Flaky tests are bugs in the test, code, or environment. Do not hide them
   with sleeps or retries.

## Proof Contract

For every non-trivial engineering claim, record:

- Claim: the behavior, invariant, contract, or root cause asserted.
- Data invariant: the data shape, state rule, or type boundary that
  makes bad states impossible or visible.
- Boundary: where the proof enters: the point where the claim becomes
  observable.
- Check: the executable validation that would fail if the claim were
  false.
- Evidence: command/result, test name, observed failure/pass, artifact
  inspection, or explicit reason the proof could not be run.

## Workflow

1. List the claims introduced or relied on by the change. Keep features a
   caller or user observes, external contracts, domain invariants, refactor
   preservation claims, and real error cases. Drop speculative edge cases,
   framework guarantees, and language semantics.
2. For each remaining claim, fill the Proof Contract before declaring
   the work complete.
3. When the request names files, scripts, config, endpoints, commands,
   or documents, make an acceptance map: requirement -> artifact ->
   check. A passing command is incomplete proof if it does not exercise
   the artifact the requirement asked for.
4. For removals or replacements, prove the behavior that remains or replaces
   the old surface. Do not write tests for ghosts. Use targeted search for
   cleanup proof unless rejection is the surviving public
   behavior.
5. Load only the narrow reference needed:
   - `references/data-shape-boundaries.md` when transformation chains,
     internal stages, or error envelopes make the right boundary unclear.
   - `references/recipes.md` when the proof shape is domain-specific.
   - `references/removals.md` for removals and replacements.
   - `references/test-theater.md` when tests assert implementation shape
     instead of behavior.
6. When a claim needs a test, name the behavior in caller language and assert
   the observable result.
7. Choose the narrowest runnable check that can prove the claim: single test by
   name or line when supported, then one test file, then package or suite only
   when the narrow check is clean or exposes wider risk.

## Before Saying Done

1. Re-read the latest user request and corrections; name the acceptance in
   caller language.
2. Inspect any named artifact after the last edit and confirm the proof reads
   or exercises it.
3. Run or inspect the fresh proof chosen in the workflow.
4. Report the actual state: proven, partially proven, blocked, or unproven.

## Verification

- [ ] Every non-trivial behavior, invariant, contract, root-cause, or
      refactor claim has a Proof Contract.
- [ ] At least one proof check enters through the outermost practical boundary
      and would fail if the claim were false.
- [ ] Test names and assertions describe observable behavior, not private
      methods, call choreography, framework behavior, or static copy that would
      be identical under every condition.
- [ ] Mocks appear only at true system boundaries or have a documented reason.
- [ ] Tests are order-independent and do not rely on arbitrary sleeps.
- [ ] Named files, scripts, configs, commands, or documents from the request
      are mapped to artifacts and checks.
- [ ] Adjacent substitutes, helper-only checks, and smoke checks are labeled as
      partial proof instead of full acceptance evidence.

## Tripwires

- About to run the full suite for an isolated edit: run the single relevant
  test, line filter, or test file first.
- If a broad suite fails for unrelated drift, switch to the targeted proof and
  report the broad failure separately.
- Name the invariant or boundary behavior when static types seem to cover the
  claim.
- Capture the command, observed output, and proven claim when manual proof is
  the practical check.
- Rewrite, move, or delete tests that assert implementation shape instead of
  observable behavior. Load `references/test-theater.md` for the test-theater
  taxonomy.

## Handoffs

- Use `specify` to convert the agreed ADR, RFC, tech spec, or note's proof
  obligations into Proof Contracts before claiming completion.
- Use `domain-modeling` to shape invariants and make invalid states
  unrepresentable.
- Use `debugging` when the proof depends on root-cause evidence.
- Use `api` when the claim is a public contract.
- Use `refactoring` for behavior-preservation evidence and when test
  placement reveals coupled concerns that need simplification before they
  can be cleanly proven; pair with `architecture` when the coupling
  spans module boundaries.
- Use `error-handling` when the error envelope, message content, or
  recovery contract that proof must assert at the boundary is itself
  unsettled; that skill owns the contract, this skill owns the proof.
- Use `security` when proof requires abuse cases or trust-boundary
  checks.

## References

- Data-shape boundaries (worked examples for pipelines, parsers,
  validators, middleware, sans-IO, and functional core):
  `references/data-shape-boundaries.md`.
- Proof recipes by claim type: `references/recipes.md`.
- Removals and replacements: `references/removals.md`.
- Test-theater traps: `references/test-theater.md`.
- `agent-booster-pack-proof` optional runtime package: ships from this repo at
  `agent-booster-pack-proof/`. Its `/proof` command runs a red-green-refactor
  cycle when behavior tests are the right proof vehicle; runtime output counts
  only toward the claims it covers.
