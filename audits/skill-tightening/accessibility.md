# Accessibility Skill Tightening Audit

Source: `agents/.agents/skills/accessibility/SKILL.md`

Current length: 939 words.

## Keep

- The iron law is direct and useful.
- The tripwires are high signal because they name concrete ARIA, focus,
  dialog, and keyboard failure modes agents commonly create.
- The workflow is short and operational.

## Tightening Opportunities

1. Compress the focus rule in Core Ideas.
   The current rule carries specific measurements and forced-colors fallback.
   Be cautious: outline width, contrast ratios, and forced-colors fallback are
   exactly the details agents forget. Move them only if the main body keeps an
   unmistakable trigger such as "focus must meet the WCAG 2.2 focus appearance
   measurements; load the reference for the numeric recipe."

2. Combine overlapping verification items.
   The checks for focus visibility, contrast, target size, reflow, reduced
   motion, forced colors, and dark mode could be grouped by "keyboard/focus",
   "visual perception", and "user preferences". This saves tokens without
   weakening the checklist.

3. Shorten tripwire false alarms.
   Several false-alarm cells restate the same condition at length. They can be
   reduced where the trigger/action already makes the exception obvious.

## Do Not Tighten

- Do not remove the concrete tripwires for `div onClick`, `role=button`,
  positive `tabindex`, `aria-label` hiding visible text, or modal focus traps.
  These are exactly the kinds of failures the skill should prevent.
- Do not move all WCAG specifics to references; enough concrete behavior must
  remain in the main skill to steer UI implementation.
- Do not hide focus measurements unless the body retains a trigger phrase that
  forces the reference to load.

## Suggested Shape

Small pass only. Target 10-15% reduction by trimming verification and long
false-alarm cells, not by deleting tripwires.
