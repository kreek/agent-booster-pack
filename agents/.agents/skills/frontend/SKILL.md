---
name: frontend
description:
  Use when building or materially changing frontend interfaces — pages,
  components, layouts, typography, colour systems, motion, or responsive
  behavior. Also use when picking a frontend framework, designing a component
  API, writing CSS from scratch, setting up design tokens, configuring dark
  mode, or shaping component states. Also use when the user mentions Swiss
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
  typography, color, motion, responsive behavior, or frontend framework choices.

## When NOT to Use

- Backend API shape; use `api`.
- Accessibility-specific implementation or review; use `accessibility`.
- Frontend runtime debugging or tests only; pair with `tests` and browser
  tooling.
- Performance profiling beyond UI design choices; use `performance`.

## Core Ideas

1. Start from the user's task and hierarchy, not from visual style.
2. One screen has one primary action and a clear information order.
3. Tools, dashboards, CRUD apps, and utilities are application surfaces, not
   landing pages. Put the workflow first; do not use a hero section, oversized
   slogan, or marketing composition unless the user explicitly asks for a
   landing page.
4. Match density to the job. Repeated-use tools should be compact, scannable,
   and direct: forms near the top, results in lists/tables, actions in stable
   columns, and empty states only where the relevant collection is actually
   empty.
5. Use cards only for repeated items, modals, or genuinely bounded tools. Do not
   make the whole app a set of oversized floating cards when an unframed layout,
   table, split pane, or toolbar would be clearer.
6. Typography is content architecture, not decoration. Type scale, measure,
   leading, rhythm, and numeric alignment follow the reading task and
   information hierarchy. Hero-scale type is only for real heroes; tool
   headings, panel titles, labels, and result text stay compact enough that the
   main workflow remains visible in the first viewport.
7. Color is for hierarchy and state, not theme saturation. Avoid making every
   heading, link, button, and success message the same accent color.
8. When no product, brand, or jurisdictional design system applies, use IBM
   Carbon as the default product/tool reference: grid-first layout, restrained
   typography, neutral palette, compact density, and minimal decoration. Prefer
   IBM Plex Sans/Serif/Mono as the neutral type family when licensing and
   delivery constraints allow it.
9. Use a small token system for spacing, type, color, radius, and motion.
10. Government and public-service apps should start from the relevant official
    government design system when one exists, such as USWDS for the United
    States, GOV.UK Design System for the UK, or Canada.ca Design System for
    Canada. Do not invent a branded generic UI before checking the
    jurisdiction's patterns.
11. Accessibility constrains layout and interaction decisions. Pair with
    `accessibility` whenever UI changes affect controls, navigation, forms,
    motion, contrast, focus, or semantic structure.
12. Component APIs express intent and state, not implementation convenience.
13. Keep frontend behavior in an appropriate frontend layer. Do not bury an
    interactive app UI as server-rendered HTML plus inline JavaScript inside a
    backend entrypoint just because the app is small; use Alpine.js for small
    interactive surfaces or Svelte/SvelteKit for larger ones.
14. Modern CSS should reduce JavaScript and layout hacks when browser support
    allows it.
15. Remove generic AI-look decoration unless it serves the product or workflow.

## Workflow

1. Identify the user, task, device constraints, and primary action.
2. Choose existing framework/design-system patterns before inventing new ones.
3. Classify the surface before layout: app/tool/dashboard/admin UI, content
   site, landing page, marketing page, game, or editorial experience. For
   app/tool/dashboard/admin UI, start with the working interface, not a hero.
4. If the app is for a government or public-service context, identify the
   jurisdiction and check `references/platforms.md` for the official design
   system before creating custom patterns.
5. If no official or existing product design system applies to a generic
   product/tool UI, use Carbon and IBM Plex as the visual baseline before
   inventing custom tokens.
6. Define typography early: type families, scale, measure, line-height,
   vertical rhythm, and tabular/proportional numeral behavior.
7. Define hierarchy, layout, states, empty/error/loading behavior, and
   responsive rules.
8. For collection UIs, design the populated state first, then
   empty/loading/error states. Empty states must disappear when items exist.
9. Apply tokens consistently; avoid stray one-off values.
10. Verify with real rendering, keyboard navigation, contrast, and reduced-motion
   behavior.
11. Remove elements that do not change comprehension, trust, or actionability.

## Verification

- [ ] Hierarchy survives a squint/blur test.
- [ ] One primary action is visually dominant per screen.
- [ ] App/tool/dashboard/admin UI starts with the working interface, not a
      marketing hero or oversized slogan.
- [ ] Main task controls and current results are visible without excessive
      scrolling at common desktop and mobile sizes.
- [ ] Repeated data uses a scannable list/table/card pattern with stable action
      placement and robust long-text handling.
- [ ] Text fits at mobile and desktop sizes without overlap or truncation
      surprises.
- [ ] Type scale is proportional to the container and task; hero-scale type is
      absent unless this is a real hero/landing surface.
- [ ] Long-form text has readable measure and leading; dense UI text remains
      compact without becoming cramped.
- [ ] Metrics, tables, timestamps, prices, counters, and aligned technical
      values use tabular numerals where comparison matters.
- [ ] Empty states, success states, and populated states do not contradict each
      other.
- [ ] Accent color is used selectively for action/state, not every prominent
      text element.
- [ ] Government/public-service UI uses the relevant official design system, or
      documents why none applies.
- [ ] Generic product/tool UI without a stronger system follows Carbon-style
      grid, density, restraint, and IBM Plex typography, or documents why not.
- [ ] `accessibility` was used for controls, navigation, forms, motion,
      contrast, focus, custom widgets, or semantic-structure changes.
- [ ] Interactive frontend behavior is not hidden as ad hoc inline JavaScript in
      the backend entrypoint unless the surface is a tiny static behavior or an
      explicit user-requested exception.
- [ ] UI states exist for loading, empty, error, disabled, and success where
      applicable.
- [ ] Stray decoration is removed unless its absence makes the interface worse.

## Handoffs

- Use `tests` for UI behavior tests and browser-verified flows.
- Use `accessibility` for WCAG, ARIA, semantic HTML, keyboard, focus, contrast,
  screen-reader, and inclusive-design work.
- Use `performance` for measured Core Web Vitals or rendering regressions.
- Use `docs` for design-system usage docs and ADRs.

## References

- `references/canon.md`: design principles and visual judgment.
- `references/frameworks.md`: frontend framework tradeoffs.
- `references/platforms.md`: platform design systems.
- `references/css.md`: modern CSS capabilities.
- `references/typography.md`: Bringhurst-informed typography harmonized with
  Swiss/product UI practice.
