# Refactoring Skill Tightening Audit

Source: `agents/.agents/skills/refactoring/SKILL.md`

Current length: 869 words.

## Keep

- The iron law is strong and concrete.
- The distinction between structure and behavior commits is essential.
- The compatibility warning is valuable and should remain.

## Tightening Opportunities

1. Shorten Core Idea 8.
   The simplification paragraph is useful but long. It can point to
   `simple-not-easy` after one sentence about preserved behavior and reduced
   coupling.

2. Merge duplicate proof handoffs.
   Handoffs include `proof` twice. Combine characterization, boundary tests,
   and preservation evidence.

3. Compress tripwire wording.
   Several rows repeat "prove behavior" and "split commits." Keep the triggers
   but shorten false alarms.

4. Move named refactoring patterns to references.
   Branch by abstraction and strangler fig links are useful but can be
   reference-only. The main body only needs to name the safe slicing principle.

## Do Not Tighten

- Do not remove "green before, green after each step."
- Do not remove "ask which callers/data/releases must keep working" before
  compatibility machinery.

## Suggested Shape

Small-to-moderate pass. Target 15% reduction.
