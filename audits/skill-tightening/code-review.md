# Code Review Skill Tightening Audit

Source: `agents/.agents/skills/code-review/SKILL.md`

Current length: 1,424 words.

## Keep

- Findings-first and severity guidance are essential.
- Runtime/toolchain compatibility before language advice is important.
- The complexity/coupling review lens is high value and should remain in the
  main body.

## Tightening Opportunities

1. Replace the harness-baseline paragraph with direct instructions.
   The "harness baseline already covers" paragraph reads like meta-commentary.
   Start Core Ideas directly with what this skill adds or expects.

2. Merge duplicate proof handoffs.
   `proof` appears twice in Handoffs. Combine into one row covering proof
   obligations, missing behavior coverage, mocks, and flakes.

3. Compress Workflow step 1.
   The GitHub-specific command details are useful but long. Move exact `gh`
   command guidance to a reference or GitHub-specific skill. Keep the main
   instruction as "resolve target and thread state when it matters."

4. Shorten Finding Format.
   Severity definitions are valuable, but each can be reduced. The section can
   be a compact table: `Critical`, `High`, `Medium`, `Low`.

5. Move "test theater" examples to proof references.
   The long tripwire row imports multiple proof tripwires. Keep a concise row
   and point to `proof` for the detailed taxonomy.

## Do Not Tighten

- Do not remove the mandatory security pass language.
- Do not weaken "style is not blocking unless it hides real risk."
- Do not remove language-reference compatibility checks.

## Suggested Shape

Moderate pass. Target 20% reduction by moving GitHub mechanics and test-theater
detail out of the main skill.
