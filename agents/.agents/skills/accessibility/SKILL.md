---
name: accessibility
description: >-
  Use for accessibility in UI, web, app, or document work: WCAG, ARIA,
  semantics, keyboard flow, focus, contrast, motion, labels, forms, and custom
  controls.
---

# Accessibility

## Iron Law

`WCAG 2.2 AA IS THE FLOOR; NATIVE SEMANTICS COME FIRST.`

## When to Use

- Building, changing, or reviewing user-facing UI, forms, navigation,
  modals, custom controls, interactive states, animation, color,
  typography, or content structure.
- Testing keyboard flow, focus order, screen-reader behavior,
  contrast, reduced motion, forced colors, or accessible names.

## When NOT to Use

- Backend-only changes with no user-facing output.
- Visual hierarchy or brand direction without implementation; use
  `ui-design` first, then return here for accessibility constraints.
- Performance-only UI work; use `performance`, then verify
  accessibility if rendering behavior changed.

## Core Ideas

1. Prefer native HTML controls and semantics before ARIA.
2. Every interactive element needs name, role, value, state, and
   keyboard behavior.
3. Focus must be visible, ordered, restored after modal/overlay
   close, and never trapped accidentally.
4. Color cannot be the only signal; contrast must satisfy WCAG 2.2
   AA.
5. Motion, transparency, dark mode, high contrast, and forced colors
   follow user preferences.
6. Forms need explicit labels, grouped controls, errors tied to
   fields, and no placeholder-only instructions.
7. Automated checks catch only part of the problem; manual keyboard
   and screen-reader checks are required for meaningful UI changes.

## Workflow

1. Identify the affected user journey, controls, and content
   structure. Use semantic HTML first; add ARIA only when native
   elements cannot express the interaction.
2. Define keyboard behavior and focus management before styling
   custom controls. Check labels, accessible names, headings,
   landmarks, form errors, status messages, and live regions.
3. Verify contrast, reflow, target size, reduced motion, forced
   colors, and text spacing.
4. Run automated checks, then perform manual keyboard testing. Add
   screen-reader testing for custom controls, dialogs, menus, tabs,
   forms, and live updates. Record remaining accessibility risks as
   explicit blockers or deferred work.

## Verification

- [ ] WCAG 2.2 AA-relevant criteria are satisfied or gaps are named.
- [ ] Native controls/semantics are used where possible; ARIA is
      minimal and correct.
- [ ] Keyboard-only use reaches every interactive control in logical
      order.
- [ ] Focus is visible, not obscured, and restored after
      modal/overlay close.
- [ ] Text contrast, non-text contrast, target size, and reflow are
      checked.
- [ ] Forms have labels, grouped controls where needed, and
      field-linked errors.
- [ ] Reduced motion, forced colors, contrast preferences, and dark
      mode are not broken.
- [ ] Automated tooling was run, and manual keyboard checks were
      performed; screen-reader behavior was checked for custom
      controls, dialogs, menus, tabs, forms, and live/status updates.

## Handoffs

- Use `ui-design` for visual hierarchy, layout, design systems, and
  component composition.
- Use `testing` for browser automation around accessibility-critical
  flows.
- Use `documentation` when writing accessibility statements,
  design-system guidance, or remediation notes.

## References

- `references/accessibility.md`: WCAG 2.2, ARIA, keyboard,
  screen-reader, and inclusive-design details.
