---
name: proof
description: Use for proof and tests, claims, invariants, behavior specs, edge cases, and evidence.
---

# Proof

## Iron Law

`NO ENGINEERING CLAIM WITHOUT A NAMED PROOF.`

## When to Use

- Feature work, bug fixes, refactors, API changes, domain modeling, data
  migrations, or reviews where correctness depends on a claim being true.
- Before saying work is done, fixed, ready to commit, ready for a PR, or
  passing.
- Turning a data-first design into concrete invariants and executable
  checks.
- Adding or reviewing behavior-focused tests that prove a feature, bug
  fix, refactor, flaky test fix, or untested behavior.
- Deciding what deserves coverage and which boundary the proof should
  enter through.

## When NOT to Use

- Pure formatting, typo fixes, or mechanical file moves with no behavior,
  data, or contract claim.
- Commit grouping after evidence already exists; use `git-workflow`.
- Load testing, profiling, or benchmark design; use `performance`.
- Pure toolchain setup; use `scaffolding`.

## Core Ideas

1. A proof is a named obligation tied to a claim. Missing evidence is an
   explicit `unproven` status, not silence that implies correctness.
2. Data claims need invariants, not prose; behavior claims need boundary
   checks, not helper-only assertions.
3. Bug-fix claims need root-cause evidence and a regression guard.
   Refactor claims need before/after behavior preservation evidence.
4. Prefer one proof at the outermost useful boundary over many
   helper-level checks.
5. A completion claim is still an engineering claim. Passing checks are
   only relevant when they prove the latest request was actually satisfied.
   Use workflow's `references/simple-not-easy.md` when a "safer" hardening
   step lacks a named failure mode and evidence.
6. Test behavior, not implementation: assertions describe what a
   caller, downstream stage, or consumer observes. Enter at the
   outermost practical boundary — anywhere data shape or values change
   observably. Common cases: HTTP, CLI, UI, public API, module facade,
   pipeline or stage seam, parser or serializer edge, validator output,
   middleware boundary, or any function from raw input to a typed or
   normalized representation.
7. In transformation chains and pipelines, the function call graph is
   not the test surface. Tests belong at the seams where data shape
   changes — extract -> transform -> load; raw -> parsed -> validated;
   request -> middleware-N output -> handler input. Assert shape
   (schema, types, key invariants) plus representative values at each
   seam, plus one end-to-end happy path. A per-function unit test
   inside the chain is a duplicate of the seam assertion above it
   unless the function has non-trivial branching, accumulation, or
   edge-case handling that the seam tests do not exercise. See
   `references/data-shape-boundaries.md` for worked examples.
8. Errors are shape changes too. An error envelope (`Result.Err`, HTTP
   4xx, `ParseError`, `ValidationError`) is a different shape from the
   success envelope at the same seam, and both deserve assertions. The
   content of the user-facing error message is a value claim at the
   outermost seam where the error becomes observable to the consumer:
   assert the message, code, and structured fields the consumer relies
   on, not just that an error happened. Per-error-class coverage lives
   at the seam where the error becomes user-observable, not at every
   internal function that could raise.
9. Test placement is a code-organization signal. If a clean seam test
   is hard to write, the seam is wrong: data and effects are tangled,
   the boundary is leaking implementation, or the responsibility is
   split awkwardly across functions. Simplify the code so the seam
   becomes testable — extract the pure transform, push effects to the
   edge, name the data shape — rather than adding test ceremony around
   tangled code. A test that needs many mocks, deep setup, or
   assertions on private call patterns is reporting that the design
   needs refactoring, not that the test framework is inadequate.
10. One test covers one behavior; if the name needs "and", split it.
11. Prefer real collaborators until they cross a true system boundary.
    Mock only at edges: clock, network, third-party service, process,
    filesystem, or expensive infrastructure not under test.
12. A good test would survive a full implementation swap that preserves
    the contract.
13. Flaky tests are bugs in the test, code, or environment; do not
    hide them with sleeps or retries.

## Proof Contract

For every non-trivial engineering claim, record:

- Claim: the behavior, invariant, contract, or root cause asserted.
- Data invariant: the data shape, state rule, or type boundary that
  makes bad states impossible or visible.
- Boundary: where the proof enters — the point at which data shape
  or values change in a way the claim is about. Common cases: public
  API, CLI, HTTP endpoint, UI flow, migration preflight, module
  facade, pipeline or stage seam, parser output, validator output, or
  reproducible command.
- Check: the executable validation that would fail if the claim were
  false.
- Evidence: command/result, test name, diff reference, observed
  failure/pass, or explicit reason the proof could not be run.

## Workflow

1. List the claims introduced or relied on by the change. Drop those
   that don't matter to user behavior, domain correctness, safety, or
   maintainability.
2. For each remaining claim, fill the Proof Contract before declaring
   the work complete.
3. When the request names files, scripts, config, endpoints, commands,
   or documents, make an acceptance map: requirement -> artifact ->
   check. A passing command is incomplete proof if it does not exercise
   the artifact the requirement asked for.
4. Load `references/recipes.md` when the proof shape is unclear or
   domain-specific.
5. When a claim needs a test, name the behavior in caller language.
   Arrange only the state a real caller needs; act once; assert on
   externally visible state, output, response, event, or error.
6. Run the check fresh after the final edit when the environment
   permits it. If it can't run, state the missing dependency and mark
   the claim unproven.

## Before Saying Done

1. Re-read the latest user request and any corrections. Name the acceptance
   claim in caller language.
2. Inspect the final diff or touched surface. Confirm the change stayed within
   scope and did not leave dead paths, stale docs, or unrelated edits behind.
3. For setup, documentation, API, migration, or config work, check that
   every named artifact exists by the requested name and that the proof
   command reads or executes it.
4. Pick the command or inspection that would catch the failure: focused test,
   full suite, build, lint/type check, migration check, CLI run, API contract,
   UI flow, or code review of the diff.
5. Run the relevant command now, after the last edit. Read the exit code and
   the output that proves or disproves the claim.
6. Report the actual state: proven, partially proven, blocked, or unproven.
   Do not convert a partial check into a complete claim.

## Verification

- [ ] Every non-trivial behavior, invariant, contract, root-cause, or
      refactor claim has a Proof Contract.
- [ ] At least one check enters through the outermost practical
      boundary and would fail if the claim were false.
- [ ] Test names read as behavior statements when nested labels are
      combined.
- [ ] Assertions are about observable outcomes, not private methods or
      call choreography.
- [ ] Mocks appear only at true system boundaries or have a documented
      reason.
- [ ] Tests would survive a contract-preserving implementation swap.
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
| "Refactor only, no behavior change" | Provide before/after preservation evidence or mark unproven. | Mechanical rename verified by diff/tooling with no behavior surface. |
| "Too simple to test" | Write the smallest behavior test that would fail if the code did nothing. | Pure formatting, copy, or generated metadata changes. |
| "Already covered by another test" | Name the existing behavior test or add the missing assertion. | The named test enters through the same caller boundary and would fail for this bug. |
| "Mock is faster than a fixture" | Use the real collaborator unless it crosses a true system boundary. | Clock, network, third-party service, process, filesystem, or expensive infrastructure. |
| "I'll add tests after the feature lands" | Add the behavior assertion before claiming the feature is done. | Exploratory spike explicitly marked as not complete. |
| "This equivalent artifact should count" | Prove the requested artifact or explicitly report the substitution and risk. | The user or repo convention already named the substitute. |
| "Wrote a unit test for every function in a transformation chain" | The seam tests above and below already cover them. Keep an internal-stage test only when the stage has non-trivial branching or stateful behavior the seam assertions cannot exercise. | The internal stage has multiple branches or accumulates state that the seam tests cannot drive. |
| "Asserted an error happens, but not what the consumer sees" | The user-facing error message and envelope are the value claim at the outermost seam. Assert the message, code, and structured fields the consumer relies on. | The error path is purely internal and the consumer never observes it. |
| "Test needs many mocks and deep setup to run" | The design is signaling tangle, not test framework limits. Simplify the seam — extract pure transforms, push effects to the edge — before piling on mocks. | The test crosses a true system boundary (clock, network, infra) that genuinely requires substitution. |
| "I'll parameterize this across every input I can think of" | Tests cover behaviors named by the requirement and real boundary cases (security, data-loss, parsing edges that exist in production data). Speculative inputs are noise that locks in implementation detail. | The function is a parser, validator, or security gate where input-space coverage *is* the contract. |

## Runtime Extensions

When this skill runs inside Pi with the `pi-proof` extension loaded, its
`/proof` command runs a red-green-refactor cycle. Use it when behavior
tests are the right vehicle for showing the work. This skill still owns
the broader proof contract — data invariants, root cause, refactor safety,
completion checks, and any other evidence — and pi-proof's cycle output
counts toward whichever claims it actually covers.

## Handoffs

- Use `whiteboarding` to convert the agreed RFC/ADR's proof obligations into
  Proof Contracts before claiming completion.
- Use `data-first` to shape invariants and make invalid states
  unrepresentable.
- Use `debugging` when the proof depends on root-cause evidence.
- Use `api` when the claim is a public contract.
- Use `refactoring` or `architecture` when test placement reveals a
  tangled seam that needs simplification before it can be cleanly
  proven; the inability to write a clean seam test is a code-
  organization signal, not a test-framework limit.
- Use `error-handling` when the error envelope, message content, or
  recovery contract that proof must assert at the seam is itself
  unsettled; that skill owns the contract, this skill owns the proof.
- Use `refactoring` when the proof is behavior preservation through
  structural change.
- Use `security` when proof requires abuse cases or trust-boundary
  checks.

## References

- Proof recipes: `references/recipes.md`.
- Data-shape boundaries (worked examples for pipelines, parsers,
  validators, middleware, sans-IO, and functional core):
  `references/data-shape-boundaries.md`.
- `agent-booster-pack-proof` Pi runtime companion: ships from this repo
  at `agent-booster-pack-proof/` and enforces the red-green-refactor
  loop at tool-call time. (Renamed from `pi-proof`; old npm name
  deprecated.)
