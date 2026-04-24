---
name: proof
description:
  Use when turning engineering claims into explicit proof obligations,
  especially for data invariants, behavior changes, API contracts, refactors,
  bug fixes, or any work where the agent must show evidence instead of claiming
  correctness. Also use when the user mentions proofs, proof production,
  evidence, invariants, boundary tests, claims, "done means proven", or making
  mature engineering practices mandatory.
---

# Proof

## Iron Law

`NO ENGINEERING CLAIM WITHOUT A NAMED PROOF.`

If a claim has no proof obligation, it is a hypothesis. Report it as unproven
rather than done.

## When to Use

- Feature work, bug fixes, refactors, API changes, domain modeling, data
  migrations, or reviews where correctness depends on a claim being true.
- Turning a data-first design into concrete invariants and executable checks.

## When NOT to Use

- Pure formatting, typo fixes, or mechanical file moves with no behavior, data,
  or contract claim.
- Commit grouping after evidence already exists; use `commit`.
- Test-shape decisions only; use `tests`.

## Core Ideas

1. A proof is a named obligation tied to a claim.
2. Data claims need invariants, not prose.
3. Behavior claims need boundary checks, not helper-only assertions.
4. Bug-fix claims need root-cause evidence and a regression guard.
5. API claims need contract evidence at the public surface.
6. Refactor claims need before/after behavior preservation evidence.
7. Missing evidence is an explicit status, not a reason to imply correctness.

## Proof Contract

For every non-trivial engineering claim, record:

- **Claim**: the behavior, invariant, contract, or root cause being asserted.
- **Data invariant**: the data shape, state rule, or type boundary that makes
  bad states impossible or visible.
- **Boundary**: where the proof enters: public API, CLI, HTTP endpoint, UI flow,
  migration preflight, module facade, or reproducible command.
- **Check**: the executable validation that would fail if the claim were false.
- **Evidence**: command/result, test name, diff reference, observed
  failure/pass, or explicit reason the proof could not be run.

## Workflow

1. List the claims introduced or relied on by the change.
2. Drop claims that do not matter to user behavior, domain correctness, safety,
   or maintainability.
3. For each remaining claim, fill the Proof Contract before declaring the work
   complete.
4. Prefer one proof that exercises the outermost useful boundary over many
   helper-level checks.
5. Run the check when the environment permits it.
6. If the check cannot run, state the missing dependency and mark the claim
   unproven.

## Verification

- [ ] Every non-trivial behavior, invariant, contract, root-cause, or refactor
      claim has a Proof Contract.
- [ ] At least one check enters through the outermost practical boundary.
- [ ] The check would fail if the claim were false.
- [ ] Evidence names the exact command, test, observed result, or blocker.
- [ ] Missing evidence is reported as unproven, not complete.
- [ ] Helper-only checks are justified by isolated complexity,
      parser/state-machine logic, or lack of a wider boundary.

## Handoffs

- Use `data` to shape invariants and make invalid states unrepresentable.
- Use `tests` to choose proof boundaries and test names.
- Use `debugging` when the proof depends on root-cause evidence.
- Use `api` when the claim is a public contract.
- Use `refactoring` when the proof is behavior preservation through structural
  change.
