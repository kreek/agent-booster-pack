---
name: ui-design
description: >-
  Use for frontend UI work: pages, components, layout, typography, color,
  motion, responsive behavior, component APIs, CSS, design tokens, dark mode,
  Tailwind, and shadcn/ui.
---

# UI Design

## Iron Law

`START FROM THE USER TASK AND HIERARCHY; EVERY ELEMENT EARNS ITS PLACE.`

Design quality comes from priority, restraint, and verification, not decoration.

## When to Use

- Building or materially changing UI layout, components, design systems,
  typography, color, motion, responsive behavior, or frontend framework
  choices.

## When NOT to Use

- Backend API shape; use `api`.
- Accessibility-specific implementation or review; use `accessibility`.
- Frontend runtime debugging or tests only; pair with `testing` and browser
  tooling.
- Performance profiling beyond UI design choices; use `performance`.

## Core Ideas

1. Start from the user's task and hierarchy, not from visual style.
2. One screen has one primary action and a clear information order.
3. Use a small token system for spacing, type, color, radius, and motion.
4. Accessibility is a design input: keyboard, focus, contrast, reduced motion,
   touch target, and screen-reader flow.
5. Component APIs express intent and state, not implementation convenience.
6. Modern CSS should reduce JavaScript and layout hacks when browser support
   allows it.
7. Remove generic AI-look decoration unless it serves the product or workflow.

## Workflow

1. Identify the user, task, device constraints, and primary action.
2. Choose existing framework/design-system patterns before inventing new ones.
3. Define hierarchy, layout, states, empty/error/loading behavior, and
   responsive rules.
4. Apply tokens consistently; avoid stray one-off values.
5. Verify with real rendering, keyboard navigation, contrast, and reduced-motion
   behavior.
6. Remove elements that do not change comprehension, trust, or actionability.

## Verification

- [ ] Hierarchy survives a squint/blur test.
- [ ] One primary action is visually dominant per screen.
- [ ] Text fits at mobile and desktop sizes without overlap or truncation
      surprises.
- [ ] Reduced-motion preference is honored.
- [ ] UI states exist for loading, empty, error, disabled, and success where
      applicable.
- [ ] Stray decoration is removed unless its absence makes the interface worse.

## Handoffs

- Use `testing` for UI behavior tests and browser-verified flows.
- Use `accessibility` for WCAG, ARIA, semantic HTML, keyboard, focus, contrast,
  screen-reader, and inclusive-design work.
- Use `performance` for measured Core Web Vitals or rendering regressions.
- Use `documentation` for design-system usage docs and ADRs.

## References

- `references/canon.md`: design principles and visual judgment, including
  product/tool defaults (IBM Carbon, IBM Plex) and common failure modes
  (marketing hero on a tool, oversized cards, empty-state-while-populated).
- `references/frameworks.md`: frontend framework tradeoffs (Alpine.js for small
  interactive surfaces, Svelte/SvelteKit for larger apps).
- `references/platforms.md`: platform and government design systems (USWDS,
  GOV.UK, Canada.ca, Apple HIG, Material).
- `references/css.md`: modern CSS capabilities.
- `references/typography.md`: Bringhurst-informed typography harmonized with
  Swiss/product UI practice.
