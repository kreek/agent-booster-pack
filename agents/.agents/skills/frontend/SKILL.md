---
name: frontend
description:
  Use when building or materially changing frontend interfaces — pages,
  components, layouts, typography, colour systems, motion, or responsive
  behavior. Also use when picking a frontend framework, designing a component
  API, writing CSS from scratch, setting up design tokens, configuring dark
  mode, or shaping component states.
---

# Frontend

## Iron Law

`EVERY ELEMENT EARNS ITS PLACE. DELETE UNTIL REMOVING A THING HURTS THE INTERFACE.`

## When to Use

- Building or materially changing UI layout, components, design
  systems, typography, color, motion, responsive behavior, or
  frontend framework choices.

## When NOT to Use

- Backend API shape; use `api`.
- Accessibility-specific implementation or review; use
  `accessibility`.
- Frontend runtime debugging or tests only; pair with `testing` and
  browser tooling.
- Performance profiling beyond UI design choices; use `performance`.

## Core Ideas

1. Start from the user's task and hierarchy, not visual style. One
   screen has one primary action and a clear information order.
2. Tools, dashboards, CRUD apps, and utilities are application
   surfaces, not landing pages. Put the workflow first; no hero
   section, oversized slogan, or marketing composition unless the
   user explicitly asks for a landing page. Use cards only for
   repeated items, modals, or genuinely bounded tools — not the whole
   app as oversized floating cards when an unframed layout, table,
   split pane, or toolbar would be clearer.
3. Match density to the job. Repeated-use tools are compact,
   scannable, and direct: forms near the top, results in
   lists/tables, actions in stable columns, empty states only where
   the relevant collection is actually empty.
4. Typography is content architecture, not decoration. Type scale,
   measure, leading, rhythm, and numeric alignment follow the reading
   task. Hero-scale type is only for real heroes; tool headings,
   panel titles, labels, and result text stay compact enough that the
   main workflow remains visible in the first viewport.
5. Color is for hierarchy and state, not theme saturation. Avoid
   making every heading, link, button, and success message the same
   accent color.
6. When no product, brand, or jurisdictional design system applies,
   use IBM Carbon as the default product/tool reference: grid-first
   layout, restrained typography, neutral palette, compact density,
   minimal decoration. Prefer IBM Plex Sans/Serif/Mono as the neutral
   type family when licensing allows.
7. Government and public-service apps start from the relevant
   official government design system when one exists (USWDS, GOV.UK
   Design System, Canada.ca Design System). Don't invent a branded
   generic UI before checking the jurisdiction's patterns.
8. Component APIs express intent and state, not implementation
   convenience. Use a small token system for spacing, type, color,
   radius, and motion.
9. Keep frontend behavior in an appropriate frontend layer. Don't
   bury an interactive app UI as server-rendered HTML plus inline
   JavaScript inside a backend entrypoint just because the app is
   small; use Alpine.js for small interactive surfaces or
   Svelte/SvelteKit for larger ones.
10. Modern CSS should reduce JavaScript and layout hacks when browser
    support allows it. Remove generic AI-look decoration unless it
    serves the product or workflow.

## Workflow

1. Identify the user, task, device constraints, and primary action.
   Classify the surface: app/tool/dashboard/admin UI, content site,
   landing page, marketing page, game, or editorial. For
   app/tool/dashboard/admin UI, start with the working interface, not
   a hero.
2. For government/public-service contexts, identify the jurisdiction
   and check `references/platforms.md` before creating custom
   patterns. If no official or existing product design system applies
   to a generic product/tool UI, use Carbon and IBM Plex as the
   visual baseline.
3. Define typography early: families, scale, measure, line-height,
   rhythm, and tabular/proportional numeral behavior. Define
   hierarchy, layout, states, empty/error/loading behavior, and
   responsive rules. For collection UIs, design the populated state
   first, then empty/loading/error.
4. Apply tokens consistently; avoid stray one-off values. Verify with
   real rendering, keyboard navigation, contrast, and reduced-motion
   behavior. Remove elements that don't change comprehension, trust,
   or actionability.

## Verification

- [ ] Hierarchy survives a squint/blur test; one primary action is
      visually dominant per screen.
- [ ] App/tool/dashboard/admin UI starts with the working interface,
      not a marketing hero.
- [ ] Main task controls and current results are visible without
      excessive scrolling at common desktop and mobile sizes.
- [ ] Repeated data uses a scannable list/table/card pattern with
      stable action placement and robust long-text handling.
- [ ] Type scale is proportional to the container and task;
      hero-scale type is absent unless this is a real hero/landing
      surface.
- [ ] Long-form text has readable measure and leading; dense UI text
      remains compact without becoming cramped.
- [ ] Metrics, tables, timestamps, prices, counters, and aligned
      technical values use tabular numerals where comparison matters.
- [ ] Empty, success, and populated states do not contradict each
      other.
- [ ] Accent color is used selectively for action/state, not every
      prominent text element.
- [ ] Government/public-service UI uses the relevant official design
      system, or documents why none applies.
- [ ] Generic product/tool UI without a stronger system follows
      Carbon-style grid, density, restraint, and IBM Plex typography,
      or documents why not.
- [ ] `accessibility` was used for controls, navigation, forms,
      motion, contrast, focus, custom widgets, or semantic-structure
      changes.
- [ ] Interactive frontend behavior is not hidden as ad hoc inline
      JavaScript in the backend entrypoint unless explicitly excepted.
- [ ] UI states exist for loading, empty, error, disabled, and
      success where applicable.
- [ ] Stray decoration is removed unless its absence makes the
      interface worse.

## Handoffs

- Use `testing` for UI behavior tests and browser-verified flows.
- Use `accessibility` for WCAG, ARIA, semantic HTML, keyboard, focus,
  contrast, screen-reader, and inclusive-design work.
- Use `performance` for measured Core Web Vitals or rendering
  regressions.
- Use `documentation` for design-system usage docs and ADRs.

## References

- `references/canon.md`: design principles and visual judgment.
- `references/frameworks.md`: frontend framework tradeoffs.
- `references/platforms.md`: platform design systems.
- `references/css.md`: modern CSS capabilities.
- `references/typography.md`: Bringhurst-informed typography
  harmonized with Swiss/product UI practice.
