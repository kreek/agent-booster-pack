# Documentation Skill Tightening Audit

Source: `agents/.agents/skills/documentation/SKILL.md`

Current length: 633 words.

## Keep

- The iron law is strong and operational.
- The distinction among tutorial, how-to, reference, explanation, and runbook
  is useful.
- The comments rule is valuable because agents often over-comment obvious
  code.

## Tightening Opportunities

1. Shorten Core Idea 6.
   The comments paragraph is much longer than the rest of Core Ideas. Preserve
   the rule, but move examples of good comment subjects to a reference or
   verification checklist.

2. Compress README guidance.
   README scope appears in Verification but not Workflow. Keep it as one
   concise checklist item.

3. Move Material for MkDocs default to scaffolding or a reference.
   This rule appears in both documentation and scaffolding. Decide which skill
   owns it and let the other hand off.

## Do Not Tighten

- Do not remove "write only missing context and link authoritative sources."
- Do not remove requirements/acceptance routing; it helps workflow step 2.

## Suggested Shape

Small pass. Target 10-15% reduction by tightening the comments paragraph and
deduplicating docs-system defaults.
