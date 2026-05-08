---
name: ui-design
description: Use for frontend UI, layouts, components, responsive behavior, visual design, and usability.
---

# UI Design

## Iron Law

`START FROM THE USER TASK AND HIERARCHY; EVERY ELEMENT EARNS ITS PLACE.`

## When to Use

- Building or materially changing UI layout, components, design systems,
  typography, color, motion, responsive behavior, or frontend framework
  choices.

## When NOT to Use

- Backend API shape; use `api`.
- Accessibility-specific implementation or review; use `accessibility`.
- Frontend runtime debugging or tests only; pair with `proof` and browser
  tooling.
- Performance profiling beyond UI design choices; use `performance`.

## Core Ideas

1. One screen has one primary action and a clear information order.
2. Use a small token system for spacing, type, color, radius, and motion.
   Apply tokens consistently; avoid stray one-off values.
3. Accessibility is a design input — not a later review pass: keyboard,
   focus, contrast, reduced motion, touch target, and screen-reader flow.
4. Component APIs express intent and state, not implementation convenience.
5. Modern CSS should reduce JavaScript and layout hacks when browser support
   allows it.

## Workflow

1. Identify the user, task, device constraints, and primary action. Choose
   existing framework/design-system patterns before inventing new ones.
2. Define hierarchy, layout, states, empty/error/loading behavior, and
   responsive rules.
3. Apply tokens consistently; remove elements that do not change
   comprehension, trust, or actionability.
4. Verify with real rendering, keyboard navigation, contrast, and
   reduced-motion behavior.

## Verification

- [ ] Hierarchy survives a squint/blur test, and one primary action is
      visually dominant per screen.
- [ ] Token system covers spacing, type, color, radius, motion; no stray
      one-off values in committed CSS.
- [ ] Accessibility inputs were considered at design time, not patched after:
      keyboard reach, focus order, contrast, reduced motion, touch target,
      screen-reader flow.
- [ ] UI states exist for loading, empty, error, disabled, and success where
      applicable.

## Handoffs

- Use `proof` for UI behavior tests and browser-verified flows.
- Use `accessibility` for WCAG, ARIA, semantic HTML, keyboard, focus, contrast,
  screen-reader, and inclusive-design work.
- Use `performance` for measured Core Web Vitals or rendering regressions.
- Use `documentation` for design-system usage docs and ADRs.

## References

- `references/canon.md`: design principles, product/tool defaults, common
  failure modes.
- `references/frameworks.md`: frontend framework tradeoffs.
- `references/platforms.md`: platform and government design systems.
- `references/css.md`: modern CSS capabilities.
- `references/typography.md`: Bringhurst-informed typography for product UI.
