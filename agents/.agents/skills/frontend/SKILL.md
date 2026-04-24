---
name: frontend
description:
  Use when building or materially changing frontend interfaces — pages,
  components, layouts, typography, colour systems, motion, or accessibility.
  Also use when picking a frontend framework, designing a component API, writing
  CSS from scratch, setting up design tokens, configuring dark mode, or
  implementing WCAG 2.2 compliance. Also use when the user mentions Swiss
  design, Bauhaus, Rams, Müller-Brockmann, Nielsen's heuristics, OKLCH,
  container queries, View Transitions, shadcn/ui, Tailwind, design tokens,
  Material 3 Expressive, Apple Liquid Glass, or the "AI look".
---

# Frontend

## Iron Law

`EVERY ELEMENT EARNS ITS PLACE. DELETE UNTIL REMOVING A THING HURTS THE INTERFACE.`

Design quality comes from priority, restraint, and verification, not decoration.

## When to Use

- Building or materially changing UI layout, components, design systems,
  typography, color, motion, accessibility, responsive behavior, or frontend
  framework choices.

## When NOT to Use

- Backend API shape; use `api`.
- Frontend runtime debugging or tests only; pair with `tests` and browser
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
- [ ] Keyboard flow is complete and focus is visible.
- [ ] Contrast meets WCAG 2.2 AA for text and key non-text controls.
- [ ] Reduced-motion preference is honored.
- [ ] Touch targets are at least 44x44 where touch is expected.
- [ ] UI states exist for loading, empty, error, disabled, and success where
      applicable.
- [ ] Stray decoration is removed unless its absence makes the interface worse.

## Handoffs

- Use `tests` for UI behavior tests and browser-verified flows.
- Use `performance` for measured Core Web Vitals or rendering regressions.
- Use `documentation` for design-system usage docs and ADRs.

## References

- `references/canon.md`: design principles and visual judgment.
- `references/frameworks.md`: frontend framework tradeoffs.
- `references/platforms.md`: platform design systems.
- `references/accessibility.md`: WCAG 2.2 AA details.
- `references/css.md`: modern CSS capabilities.
