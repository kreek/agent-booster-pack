# Git Workflow Skill Tightening Audit

Source: `agents/.agents/skills/git-workflow/SKILL.md`

Current length: 521 words.

## Keep

- The skill is already compact.
- Explicit file staging in messy trees is important.
- The direct-commit approval rule is useful and should remain.

## Tightening Opportunities

1. Replace the harness-baseline paragraph with direct rules.
   Like workflow/code-review, it currently explains what the harness already
   covers. The skill can start Core Ideas at "Inspect before mutation."

2. Merge Verification items.
   `status clean/deferred`, `no unrelated staged files`, and `no conflict
   markers` could be grouped under "final status is known and scoped."

3. Shorten Handoffs.
   The sandbox approval row is more of a global rule than a handoff. Keep it
   only if agents have previously tried to bypass permissions.

## Do Not Tighten

- Do not remove "never git add . in a messy tree."
- Do not remove recovery point guidance for risky history operations.

## Suggested Shape

Small pass. Target 10% reduction, mostly by removing meta-commentary.
