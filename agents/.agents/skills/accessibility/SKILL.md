---
name: accessibility
description: Use for accessible UI, WCAG, ARIA, keyboard, focus, contrast, and inclusive states.
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
3. Focus must be visible: at least a 2px outline at 3:1 contrast
   against both adjacent surfaces, with a transparent fallback for
   Forced Colors. Focus order must be logical. Focus must be restored
   after modal or overlay close. Do not trap focus by hand inside a
   `<dialog>`.
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
   colors, text spacing, dragging alternatives, redundant entry, and
   authentication flows. Authentication must not depend on cognitive
   tests.
4. Run automated checks, then perform manual keyboard testing. Add
   screen-reader testing for custom controls, dialogs, menus, tabs,
   forms, and live updates. Record remaining accessibility risks as
   explicit blockers or deferred work.

## Verification

- [ ] WCAG 2.2 AA-relevant criteria are satisfied or gaps are named.
- [ ] Native controls/semantics are used where possible; ARIA is
      minimal and correct.
- [ ] Keyboard/focus: every interactive control reachable in logical
      order; focus visible, not obscured, restored after modal/overlay
      close.
- [ ] Visual perception: text contrast, non-text contrast, target
      size, and reflow checked.
- [ ] User preferences: reduced motion, forced colors, contrast, and
      dark mode all work.
- [ ] Forms have labels, grouped controls where needed, and
      field-linked errors.
- [ ] Dragging has a single-pointer alternative; multi-step flows avoid
      redundant entry; authentication does not require cognitive tests.
- [ ] Automated tooling was run, manual keyboard checks were performed,
      and screen-reader behavior was checked on custom controls,
      dialogs, menus, tabs, forms, and live/status updates.

## Tripwires

| Trigger | Do this instead | False alarm |
|---|---|---|
| "Just put `onClick` on the `<div>`" | Use `<button type="button">` for in-page actions or `<a href>` for navigation. Native gives keyboard, focus, and AT semantics for free. | A genuinely non-interactive element used only for layout or visual grouping. |
| "`role="button"` on the span will do" | Replace with `<button>`. ARIA role does not add keyboard handling, focusability, or default activation. | A presentational element that intentionally carries `role="img"` or `role="presentation"` for screen-reader semantics only. |
| "`autocomplete="off"` on the password field" | Remove it. Use `current-password`, `new-password`, or `one-time-code`, and never block paste. WCAG 3.3.8 forbids cognitive-test authentication. | A documented kiosk or shared-terminal field where the user explicitly opted out of autofill. |
| "Custom focus trap inside our modal" | Use native `<dialog>` + `.showModal()` where supported. Do not trap focus by hand inside native dialog. | A pre-`<dialog>` legacy code path documented with a migration plan. |
| "`aria-label` on a button that already has visible text" | Remove the `aria-label`, or ensure 2.5.3 Label-in-Name compliance: the accessible name must contain the visible text verbatim. | An icon-only control with no visible text label. |
| "`role="menu"` on the site nav" | Use `<nav>` + a list of `<a>` + an optional disclosure pattern for submenus. `role="menu"` is for application menus. | A genuine application menubar (toolbar, contextual command surface) with the full APG keyboard model. |
| "`outline: none` on focus" | Replace with a 2px solid outline at 3:1 contrast against both surfaces, plus `outline: 2px solid transparent` so Forced Colors mode renders a visible focus ring. | The replacement focus ring has been measured against both adjacent surfaces and meets 2.4.13. |
| "`aria-live` to announce that the toggle is now pressed" | Remove it. Screen readers announce `aria-pressed`, `aria-expanded`, `aria-selected`, `aria-current`, and `aria-busy` natively. | Status text genuinely outside any control's role/state surface (e.g. a toast unrelated to the activated control). |
| "Carousel auto-advances every 5s" | Add a pause control reachable by keyboard, respect `prefers-reduced-motion`, and never wrap the slides in a live region. | A static hero or single-slide promo that does not rotate. |
| "Positive `tabindex` to fix the tab order" | Reorder the DOM. Positive `tabindex` is a hazard with no safe use. | Never. |

## Handoffs

- Use `ui-design` for visual hierarchy, layout, design systems, and
  component composition.
- Use `proof` for browser automation around accessibility-critical
  flows.
- Use `documentation` when writing accessibility statements,
  design-system guidance, or remediation notes.

## References

- `references/accessibility.md`: WCAG 2.2, ARIA, keyboard,
  screen-reader, and inclusive-design details.
