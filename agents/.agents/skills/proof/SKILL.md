---
name: proof
description:
  Use when turning engineering claims into explicit proof obligations,
  especially for data invariants, behavior changes, API contracts, refactors,
  bug fixes, or any work where the agent must show evidence instead of claiming
  correctness. Also use when the user mentions proofs, evidence, invariants,
  boundary tests, or claims that need to be demonstrated.
---

# Proof

## Iron Law

`NO ENGINEERING CLAIM WITHOUT A NAMED PROOF.`

## When to Use

- Feature work, bug fixes, refactors, API changes, domain modeling, data
  migrations, or reviews where correctness depends on a claim being true.
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

## Proof Contract

For every non-trivial engineering claim, record:

- **Claim**: the behavior, invariant, contract, or root cause asserted.
- **Data invariant**: the data shape, state rule, or type boundary that
  makes bad states impossible or visible.
- **Boundary**: where the proof enters: public API, CLI, HTTP endpoint,
  UI flow, migration preflight, module facade, or reproducible command.
- **Check**: the executable validation that would fail if the claim were
  false.
- **Evidence**: command/result, test name, diff reference, observed
  failure/pass, or explicit reason the proof could not be run.

## Workflow

1. List the claims introduced or relied on by the change. Drop those
   that don't matter to user behavior, domain correctness, safety, or
   maintainability.
2. For each remaining claim, fill the Proof Contract before declaring
   the work complete.
3. Run the check when the environment permits it. If it can't run,
   state the missing dependency and mark the claim unproven.

## Verification

- [ ] Every non-trivial behavior, invariant, contract, root-cause, or
      refactor claim has a Proof Contract.
- [ ] At least one check enters through the outermost practical
      boundary and would fail if the claim were false.
- [ ] Evidence names the exact command, test, observed result, or
      blocker.
- [ ] Missing evidence is reported as unproven, not complete.

## Handoffs

- Use `domain-design` to shape invariants and make invalid states
  unrepresentable.
- Use `testing` to choose proof boundaries and test names.
- Use `debugging` when the proof depends on root-cause evidence.
- Use `api` when the claim is a public contract.
- Use `refactoring` when the proof is behavior preservation through
  structural change.
