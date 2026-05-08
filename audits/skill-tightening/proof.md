# Proof Skill Tightening Audit

Source: `agents/.agents/skills/proof/SKILL.md`

Current length: 2,419 words.

## Keep

- The iron law is foundational for the pack.
- Proof Contract is essential and should stay in the main skill body.
- The outermost-boundary, data-shape seam, error-shape, and test-theater rules
  are high value.

## Tightening Opportunities

1. Move detailed transformation-chain guidance to references.
   Core Ideas 7-9 are strong but long. Keep short rules in the main body and
   push worked explanation to `references/data-shape-boundaries.md`, which
   already exists.

2. Preserve the test-theater tripwire taxonomy.
   Do not collapse the rows about recipe substring tests, absent-file tests,
   hardcoded constants, and mock-call-only assertions into one generic
   "implementation re-encoding" row. They look related, but each has a
   different corrective action: expand/run the recipe, use a lint/pre-commit
   guard, delete the no-behavior test, or assert resulting external state.

3. Merge duplicated proof/testing handoffs.
   Handoffs mention `refactoring` twice and `proof` concepts in several
   places. Combine by target concern: model invariants, root cause, public
   contract, tangled seam, error contract, security abuse cases.

4. Shorten `Before Saying Done`.
   It overlaps with Workflow and Verification. Keep the final-edit freshness
   requirement and artifact mapping, but remove repeated "claim" language.

5. Move Pi runtime extension to a runtime-specific section or reference.
   It is useful, but it is not part of the general proof doctrine for every
   harness.

6. Reduce examples in Proof Contract fields.
   Boundary examples are repeated in Core Ideas and Proof Contract. Keep one
   canonical list.

## Do Not Tighten

- Do not remove explicit `unproven` status.
- Do not weaken "run fresh after final edit."
- Do not remove seam-placement and error-envelope guidance without preserving
  it in an eagerly discoverable reference.
- Do not merge distinct test-theater tripwires when their "Do this instead"
  actions differ. Pattern recognition in the table is part of the behavior.

## Suggested Shape

Moderate pass. Target 15-20% reduction by moving Core Ideas 7-9 prose into
`references/data-shape-boundaries.md`, shortening duplicated handoffs, and
tightening `Before Saying Done`. Do not use percentage targets to justify
removing tripwire examples that make proof failures recognizable.
