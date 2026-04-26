---
name: proof
description:
  Use when turning engineering claims into explicit proof obligations,
  especially for data invariants, behavior changes, API contracts, refactors,
  bug fixes, completion checks, or any work where the agent must show evidence
  instead of claiming correctness. Also use before saying work is done, fixed,
  ready to commit, ready for a PR, or passing; when the user mentions proofs,
  evidence, invariants, boundary tests, acceptance, or claims that need to be
  demonstrated.
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

## When NOT to Use

- Pure formatting, typo fixes, or mechanical file moves with no behavior,
  data, or contract claim.
- Commit grouping after evidence already exists; use `commit`.
- Test-shape decisions only; use `testing`.

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

## Proof Contract

For every non-trivial engineering claim, record:

- Claim: the behavior, invariant, contract, or root cause asserted.
- Data invariant: the data shape, state rule, or type boundary that
  makes bad states impossible or visible.
- Boundary: where the proof enters: public API, CLI, HTTP endpoint,
  UI flow, migration preflight, module facade, or reproducible command.
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
3. Run the check fresh after the final edit when the environment permits it.
   If it can't run,
   state the missing dependency and mark the claim unproven.

## Before Saying Done

1. Re-read the latest user request and any corrections. Name the acceptance
   claim in caller language.
2. Inspect the final diff or touched surface. Confirm the change stayed within
   scope and did not leave dead paths, stale docs, or unrelated edits behind.
3. Pick the command or inspection that would catch the failure: focused test,
   full suite, build, lint/type check, migration check, CLI run, API contract,
   UI flow, or code review of the diff.
4. Run the relevant command now, after the last edit. Read the exit code and
   the output that proves or disproves the claim.
5. Report the actual state: proven, partially proven, blocked, or unproven.
   Do not convert a partial check into a complete claim.

## Verification

- [ ] Every non-trivial behavior, invariant, contract, root-cause, or
      refactor claim has a Proof Contract.
- [ ] At least one check enters through the outermost practical
      boundary and would fail if the claim were false.
- [ ] Evidence names the exact command, test, observed result, or
      blocker.
- [ ] Completion claims are based on checks or inspections run after the final
      edit and matched to the latest request.
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

## Handoffs

- Use `data-first` to shape invariants and make invalid states
  unrepresentable.
- Use `testing` to choose proof boundaries and test names.
- Use `debugging` when the proof depends on root-cause evidence.
- Use `api` when the claim is a public contract.
- Use `refactoring` when the proof is behavior preservation through
  structural change.
