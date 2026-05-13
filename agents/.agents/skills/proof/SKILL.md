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
  comment-only edits) verified by diff or tooling. Behavior-preserving
  refactors that change an observable boundary still need `proof`.
- Investigating an unconfirmed bug or symptom where the cause is not yet
  established. Use `debugging` until there is a claim to assert, then
  return for the Proof Contract.
- Reviewing diffs for design, complexity, naming, or structure. Use
  `code-review`. Load `proof` only when the question is whether evidence
  is sufficient.
- Load testing, profiling, or benchmark design. Use `performance`.
- Pure toolchain setup (test runner, lint, typecheck baseline). Use
  `scaffolding`.

## Timing

Test-first is optional. Test-at-all is not. Tests for the claims this skill
names must exist before the change is committed, before a PR is opened, or
before a personal project is merged straight to main. Writing tests after the
implementation is fine; shipping without them is not.

## Core Ideas

1. A proof is a named obligation tied to a claim. Missing evidence is an
   explicit `unproven` status, not silence that implies correctness.
2. A completion claim is still an engineering claim. Passing checks count
   only when they prove the latest request was actually satisfied.
3. Proof should teach the behavior, not only satisfy a checker. A good proof
   makes the expected system behavior easier for the human to understand.
4. Different claims need different evidence: data claims need invariants,
   behavior claims need boundary checks, bug-fix claims need root-cause
   evidence plus a regression guard, refactor claims need before/after
   behavior preservation.
5. Test behavior, not implementation. Assertions describe what a caller,
   downstream stage, or consumer observes. A good test would survive an
   implementation swap that preserves the contract.
6. Enter at the outermost practical boundary where data shape or values change
   observably. One proof at that boundary beats many helper-level checks. Use
   `references/data-shape-boundaries.md` when transformation chains or internal
   stages make the right boundary unclear.
7. Errors are shape changes too. Assert the user-facing error envelope
   (message, code, structured fields the consumer relies on) at the
   boundary where the consumer observes it, not at every internal function
   that could raise.
8. The framework or language is not under test. Trust the framework to
   honor its own contract; cover your business logic on top of it and
   the boundary where your code binds to it.
9. Mock only at true system boundaries: clock, network, third-party service,
   process, filesystem, or expensive infrastructure not under test. If a
   boundary test still needs many mocks or deep setup, simplify the design
   before adding more mocks.
10. One test covers one behavior; if the name needs "and", split it.
   Prefer BDD-shaped runners (vitest, RSpec, Jest, pytest with
   descriptive names, ExUnit's `describe`, Go's table-driven subtests)
   so nested labels compose into a readable behavior sentence.
11. Flaky tests are bugs in the test, code, or environment. Do not
    hide them with sleeps or retries.

## Proof Contract

For every non-trivial engineering claim, record:

- Claim: the behavior, invariant, contract, or root cause asserted.
- Data invariant: the data shape, state rule, or type boundary that
  makes bad states impossible or visible.
- Boundary: where the proof enters: the point at which data shape
  or values change in a way the claim is about (see
  `references/data-shape-boundaries.md` for common cases).
- Check: the executable validation that would fail if the claim were
  false.
- Evidence: command/result, test name, diff reference, observed
  failure/pass, or explicit reason the proof could not be run.

## Workflow

1. Proof targets business logic: features a caller or user observes,
   contracts external callers bind to, invariants the domain requires,
   and the main error cases users can actually hit. List the claims
   introduced or relied on by the change and keep only those.
   Speculative edge cases, framework-guaranteed behavior, and re-tests
   of the language's own semantics are noise.
2. For each remaining claim, fill the Proof Contract before declaring
   the work complete.
3. When the request names files, scripts, config, endpoints, commands,
   or documents, make an acceptance map: requirement -> artifact ->
   check. A passing command is incomplete proof if it does not exercise
   the artifact the requirement asked for.
4. For removals, prove the old surface is gone without creating test
   theater. Prefer this order:
   - Remove the implementation path.
   - Remove or update stale docs, examples, commands, and tests that
     named the removed surface.
   - Run existing boundary tests that would fail if supported callers
     still depended on the removed surface.
   - Use search or diff inspection to prove no stale references remain.
   Add a new absence test only when absence is itself a durable public
   contract, such as a security blocklist, deprecated API rejection, or
   migration guard with an owner and removal condition.
5. Load `references/recipes.md` when the proof shape is unclear or
   domain-specific.
6. When a claim needs a test, name the behavior in caller language.
   Arrange only the state a real caller needs; act once; assert on
   externally visible state, output, response, event, or error.

## Before Saying Done

1. Re-read the latest user request and corrections; name the
   acceptance in caller language.
2. Inspect the final diff once per coherent work item, after the last
   edit and before claiming completion: change stays in scope; no dead
   paths, stale docs, or unrelated edits. Do not repeat diff review
   after every intermediate edit. For tiny approved prose or config
   edits, a targeted validator, exact file read, or mirror check may
   replace full diff review.
3. For setup, documentation, API, migration, or config work, confirm
   each named artifact exists by the requested name and that the proof
   command reads or executes it.
4. Pick the command or inspection that would catch the failure
   (focused test, full suite, build, lint/type, migration, CLI, API
   contract, UI flow, or diff review). Run it after the last edit and
   read the result.
5. Report the actual state: proven, partially proven, blocked, or
   unproven. Do not convert partial checks into complete claims.

## Verification

- [ ] Every non-trivial behavior, invariant, contract, root-cause, or
      refactor claim has a Proof Contract.
- [ ] At least one check enters through the outermost practical
      boundary and would fail if the claim were false.
- [ ] Test names read as behavior statements when nested labels are
      combined.
- [ ] Proof evidence makes the claimed behavior understandable to the human,
      not only green in a tool.
- [ ] Assertions are about observable outcomes, not private methods or
      call choreography.
- [ ] Mocks appear only at true system boundaries or have a documented
      reason.
- [ ] Each new test would fail if production code were swapped for a
      behavior-equivalent implementation.
- [ ] Tests are order-independent and do not rely on arbitrary sleeps.
- [ ] Evidence names the exact command, test, observed result, or
      blocker.
- [ ] Completion claims are based on checks or inspections run after the final
      edit and matched to the latest request.
- [ ] Named files, scripts, configs, commands, or documents from the request
      are mapped to artifacts and checks; adjacent substitutes are called out.
- [ ] Missing evidence is reported as unproven, not complete.

## Tripwires

| Trigger | Do this instead | False alarm |
|---|---|---|
| "I'll prove it after merging" | Keep the claim and evidence together, or mark the claim unproven. | Draft notes that explicitly defer the claim. |
| "Tests passed earlier" | Re-run the relevant check after the final edit and report the result. | No files changed since the captured command output. |
| "CI will catch it" | Run the local proof you can run now; treat CI as extra evidence. | The local environment cannot run the check and the blocker is reported. |
| "The type system covers it" | Name the invariant or boundary behavior the types do not prove. | The claim is only about static shape and the type check just passed. |
| "I ran it manually" | Capture the command, observed output, and claim it proves. | The manual inspection is the only possible check and is reported as such. |
| "Should be fine" / "I think this works" | Convert the thought into a named Proof Contract. | Exploratory analysis that is not claiming correctness. |
| "The check passed but I can't explain the behavior" | Rewrite the proof claim in caller language and add missing evidence. | The command was only a smoke check and is reported as partial. |
| "Refactor only, no behavior change" | Provide before/after preservation evidence or mark unproven. | Mechanical rename verified by diff/tooling with no behavior surface. |
| "Too simple to test" | Write the smallest behavior test that would fail if the code did nothing. | Pure formatting, copy, or generated metadata changes. |
| "I removed an alias, command, flag, file, or compatibility path, so I should add a test proving it is absent" | First remove or update stale tests/docs and run existing boundary checks plus search. Add a new absence test only when absence is the durable behavior contract. | Security blocklists, explicit API rejection behavior, or migration guards with an owner and removal condition. |
| "Already covered by another test" | Name the existing behavior test or add the missing assertion. | The named test enters through the same caller boundary and would fail for this bug. |
| "Mock is faster than a fixture" | Use the real collaborator unless it crosses a true system boundary. | Clock, network, third-party service, process, filesystem, or expensive infrastructure. |
| "I'll add tests after the feature lands" | Add the behavior assertion before claiming the feature is done. | Exploratory spike explicitly marked as not complete. |
| "This equivalent artifact should count" | Prove the requested artifact or explicitly report the substitution and risk. | The user or repo convention already named the substitute. |
| "Wrote a unit test for every function in a transformation chain" | The boundary tests above and below already cover them. Keep an internal-stage test only when the stage has non-trivial branching or stateful behavior the boundary assertions cannot exercise. | The internal stage has multiple branches or accumulates state that the boundary tests cannot drive. |
| "Asserted an error happens, but not what the consumer sees" | The user-facing error message and envelope are the value claim at the outermost boundary. Assert the message, code, and structured fields the consumer relies on. | The error path is purely internal and the consumer never observes it. |
| "Test needs many mocks and deep setup to run" | The design has coupled concerns. Simplify the boundary: extract pure transforms and push effects to the edge before adding more mocks. | The test crosses a true system boundary (clock, network, infra) that genuinely requires substitution. |
| "I'll parameterize this across every input I can think of" | Tests cover behaviors named by the requirement and real boundary cases (security, data-loss, parsing edges that exist in production data). Speculative inputs are noise that locks in implementation detail. | The function is a parser, validator, or security gate where input-space coverage *is* the contract. |
| "Asserted that a config, Makefile, manifest, or recipe contains a literal command string" | The implementation is the source of truth. Either expand and run the recipe (`make -n`, `npm run --silent`) and assert resulting behavior, or delete the test. Substring assertions over the implementation re-encode it 1:1 and only fail when you forget to update both in lockstep. | The string under test is a public contract a downstream consumer reads (e.g. a published config schema, a documented CLI flag list). |
| "Wrote a test asserting the framework or language behaves as documented" | Trust the framework's contract. Test your code's use of it at the boundary where you bind to it, not the framework's own behavior. | A specific framework bug or version pin where the guard is the claim, with a comment naming the bug. |
| "Tested that a removed file or directory stays absent" | Tests prove behavior, not repo structure. The same merge that resurrects the file deletes the test. If you need a guard against re-introduction, write a lint rule or pre-commit hook, not a unit test. | A migration-era guard explicitly time-boxed in a comment with a removal date. |
| "Asserted that a function returns its hardcoded constant or trivial passthrough" | No behavior, no test. Delete it. The "smallest test that would fail if the code did nothing" rule does not justify writing a test when the code legitimately *is* nothing. | The constant is part of a public contract a consumer depends on (protocol version, error code, schema field name). |
| "Asserted that a mock was called with X" without asserting resulting behavior | Test the outcome, not the interaction. If the only observable effect *is* the call (e.g. logging, telemetry), assert the resulting external state (log line in a captured stream, metric in a registry), not that the mock recorded it. | The call itself is the contract under test (e.g. an outbox writer where "row written to outbox" is the behavior). |

## Optional Runtime Extensions

Some ABP installations include the `agent-booster-pack-proof` runtime. Its
`/proof` command runs a red-green-refactor cycle when behavior tests are the
right proof vehicle.

This skill still owns the broader proof contract: data invariants, root cause,
refactor safety, completion checks, and any other evidence. Runtime output
counts only toward the claims it actually covers.

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

- Proof recipes: `references/recipes.md`.
- Data-shape boundaries (worked examples for pipelines, parsers,
  validators, middleware, sans-IO, and functional core):
  `references/data-shape-boundaries.md`.
- `agent-booster-pack-proof` optional runtime package: ships from this repo at
  `agent-booster-pack-proof/`.
