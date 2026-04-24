---
name: frontend-design
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

# Frontend Design

Compass: Swiss–Bauhaus–Rams. Every element must earn its place. Less, but
better.

Scope of this file: the directives and defaults. Depth lives in `references/`.

---

## Before writing any code: framework gate

Propose a framework and confirm before coding. Default **Svelte 5 + SvelteKit**.

| Request shape                                 | Recommend                      |
| --------------------------------------------- | ------------------------------ |
| Design-forward app, motion-heavy              | Svelte 5 + SvelteKit (default) |
| React team / shadcn/ui + Radix stack required | React 19 + Next.js 15          |
| Content site, blog, docs, marketing           | Astro 5                        |
| APAC enterprise, Vue shop                     | Vue 3.5 + Nuxt 4               |
| Absolute perf / resumability priority         | Solid/SolidStart or Qwik       |
| Server-heavy CRUD with thin JS                | htmx                           |

Confirmation template:

> "I recommend Svelte 5 + SvelteKit because (1) smaller bundles, (2) built-in
> transitions and `animate:flip` without extra deps, (3) scoped styles with
> runes keep components compact. Alternatives: React + Next.js + shadcn/ui,
> Astro, Vue + Nuxt, Solid/Qwik, or htmx. Which would you like?"

See `references/frameworks.md` for detailed tradeoffs and versions.

---

## Opinionated defaults — ship these unless overridden

| Token            | Default                                                                    |
| ---------------- | -------------------------------------------------------------------------- |
| UI typeface      | Inter or Geist; system stack as fallback                                   |
| Content typeface | System serif or `ui-serif, Georgia` for long-form                          |
| Base font size   | 16 px (`1rem`)                                                             |
| Body line-height | 1.5–1.65. Headings 1.1–1.25. Display <1.1                                  |
| Measure          | 60–75 ch (`max-width: 65ch`)                                               |
| Type scale       | 1.2 or 1.25 for apps. 1.333 for content-heavy                              |
| Weights          | 3–4 max (400/500/600/700). Never ultra-thin grey body                      |
| Spacing          | 4 px base. Ramp 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 128          |
| Radii            | 0 / 2 / 4 / 6 / 8 / 12. Default 6–8. Never 16+ on small elements           |
| Colour           | OKLCH. 10-step neutral + one accent + semantic success/warning/error/info  |
| Dark bg          | `#0A0A0A` or `#0D0E12`. Never `#000`                                       |
| Dark text        | `#E5E5E7` or 87% white. Never pure white                                   |
| Shadows          | Minimal. Prefer 1 px border at ~8% black                                   |
| Focus ring       | 2 px outline, 2 px offset, accent colour. Never suppressed                 |
| Motion           | 200 ms default, `cubic-bezier(0.16, 1, 0.3, 1)`. 400–500 ms drawers/modals |
| Tap target       | ≥44×44 CSS px on touch (exceeds WCAG 2.2 minimum of 24×24)                 |
| Breakpoints      | 600 / 900 / 1240 px                                                        |

---

## Typography rules

- Body measure 45–75 characters. Aim for 66.
- Unitless line-heights. 1.5–1.65 body, 1.1–1.25 headings, 1.0–1.1 display >48
  px.
- Modular scale from one ratio — 1.125, 1.2, 1.25, or 1.333. Golden 1.618 only
  for editorial/display.
- Two typefaces max. Three to four weights.
- Kerning belongs to the font. Apply tracking uniformly — negative on large
  display, slightly positive on all-caps or small text.
- WOFF2 only. `font-display: swap` (or `optional` for body on slow links).
- Preload above-fold faces. `preconnect` to font hosts. Subset with `pyftsubset`
  or glyphhanger.
- On `@font-face` fallbacks, use `size-adjust` + `ascent-override` +
  `descent-override` + `line-gap-override` to prevent swap CLS.
- Variable fonts (one file, `font-weight: 100 900`) replace static file stacks.
  Enable `font-optical-sizing: auto` when the font exposes `opsz`.

Canonical screen sans-serifs: Inter, Geist, Söhne, IBM Plex, SF Pro. Details in
`references/canon.md`.

---

## Colour

- Use OKLCH. Perceptually uniform — equal `L` reads as equal brightness.
- Tonal scales step `L` while holding `H` and `C`.
- `color(display-p3 r g b)` for wide-gamut accents. Keep an sRGB fallback.
- Relative colour — `oklch(from var(--brand) calc(l + .1) c h)` — replaces Sass
  colour functions.
- Default palette: 10-step neutral + one accent + semantic success/warning/
  error/info. Not a painter's wheel.

Contrast gates:

| Layer                        | WCAG 2 AA | APCA target |
| ---------------------------- | --------- | ----------- |
| Body text                    | 4.5 : 1   | Lc ≥ 75     |
| Large text (≥18pt/14pt bold) | 3 : 1     | Lc ≥ 60     |
| Non-text UI / graphics       | 3 : 1     | Lc ≥ 30     |

Dark mode specifics in `references/canon.md` under "Dark mode".

---

## Composition

- Treat whitespace as substance.
- Flush-left hierarchies beat centred marketing blocks.
- Gestalt: proximity, similarity, continuity, closure, figure/ground, common
  fate, symmetry, prägnanz.
- CRAP as a squint test: Contrast, Repetition, Alignment, Proximity.
- 8-point grid. All dimensions multiples of 8 (4 permitted for icon-to-label
  pairings). Line-heights are multiples of 8 or 4.

---

## Motion

Ship these tokens verbatim:

```css
:root {
  --dur-1: 100ms;
  --dur-2: 150ms;
  --dur-3: 200ms;
  --dur-4: 300ms;
  --dur-5: 400ms;
  --dur-6: 600ms;
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --ease-ios: cubic-bezier(0.32, 0.72, 0, 1);
  --ease-back: cubic-bezier(0.34, 1.56, 0.64, 1);
}
@media (prefers-reduced-motion: reduce) {
  :root {
    --dur-1: 0ms;
    --dur-2: 0ms;
    --dur-3: 0ms;
    --dur-4: 0ms;
    --dur-5: 0ms;
    --dur-6: 0ms;
  }
}
```

Rules:

- UI animations under 300 ms. Exits ~20% faster than entrances.
- List staggers 30–60 ms. Over 100 ms reads as a slideshow.
- Never `ease-in` on entrances. Never plain CSS `ease`/`ease-in-out` keywords in
  polished work — use cubic-beziers.
- Animate only `transform`, `opacity`, `filter`. Never `width`/`height`/`top`/
  `left`/`margin`/`padding`.
- Animated shadows: layer a pre-rendered shadow element and transition its
  opacity.
- `will-change: transform` only transiently; remove after the animation.
- View Transitions: `document.startViewTransition(() => updateDOM())` for SPA.
  `@view-transition { navigation: auto }` for MPA (same origin).

---

## Accessibility gates (WCAG 2.2 AA)

Non-negotiable:

- Semantic HTML first. Native `<button>`, `<a href>`, `<dialog>`, `<nav>`,
  `<main>`, `<label for>` paired with `<input id>`.
- Five Rules of ARIA — prefer native HTML; never change semantics unnecessarily;
  interactive ARIA must be keyboard-accessible; never put `role="presentation"`
  or `aria-hidden="true"` on focusable elements; every interactive element has
  an accessible name.
- Contrast: 4.5 : 1 body, 3 : 1 large, 3 : 1 non-text UI.
- Target size ≥ 24×24 CSS px (aim ≥ 44×44 on touch).
- Focus visible via `:focus-visible`. Indicator ≥ 2 CSS px perimeter at 3 : 1
  contrast.
- Dragging has a single-pointer alternative.
- Text spacing survives: line-height 1.5×, paragraph 2×, letter 0.12em, word
  0.16em.
- Reflow to 320 CSS px.
- Status messages without focus shift.
- Honour `prefers-reduced-motion`, `prefers-color-scheme`, `prefers-contrast`,
  `prefers-reduced-transparency`, `forced-colors: active`.

Test matrix: NVDA + Firefox/Chrome, VoiceOver + Safari, TalkBack + Chrome.
Automated tools catch 30–40% of issues — follow with manual keyboard and
screen-reader passes.

Full WCAG 2.2 criteria list in `references/accessibility.md`.

---

## Design tokens

Three tiers. Override only the semantic layer for themes.

| Tier             | Example                                   | Referenced from    |
| ---------------- | ----------------------------------------- | ------------------ |
| Primitive        | `color.blue.500 = #2563EB`                | Never from UI      |
| Semantic / alias | `color.action.primary → {color.blue.500}` | Components, themes |
| Component        | `button.primary.background.hover`         | The component only |

- Format: W3C DTCG JSON (`$value`, `$type`, `$description`, alias via
  `"{color.palette.blue.500}"`).
- Naming: `category.type.item.subitem.state`, readable right-to-left.
- Build pipeline: Style Dictionary (Amazon) or Terrazzo. Figma-side sync via
  Tokens Studio.

---

## Modern CSS — defaults in 2026

Use these without polyfill or feature query:

- Cascade layers: `@layer reset, base, tokens, layout, components, utilities;`
- Native nesting with `&`.
- Container queries: `@container` with `container-type: inline-size`, units
  `cqi`/`cqw`/`cqh`.
- `:has()`.
- Subgrid.
- View Transitions Level 1 (SPA).
- `color-mix()`, OKLCH, oklab, `light-dark()` with `color-scheme`.
- `@starting-style` + `transition-behavior: allow-discrete` for enter/exit from
  `display:none`.
- HTML Popover API (`popover`, `popovertarget`).
- `field-sizing: content`.
- `text-wrap: balance` on headings. `text-wrap: pretty` on paragraphs.
- `@property` for typed custom properties.
- `dvh` / `svh` / `lvh` viewport units.

Use with `@supports`: View Transitions Level 2 (MPA), CSS Anchor Positioning,
scroll-driven animations (`animation-timeline: scroll() | view()`). Do not use
`display: grid-lanes` masonry in production yet.

Responsive strategy: fluid type via `clamp()` (Utopia). Container queries for
component responsiveness. Logical properties (`margin-inline`, `padding-block`,
`inset-inline-start`) as the default. Grid for 2D structure, flex for 1D flows.

Full features list and engine support matrix in `references/css.md`.

---

## Component API principles

- Support both controlled and uncontrolled.
- Compound components over mega-prop APIs:
  `<Select><Select.Trigger/><Select.Content>…</Select.Content></Select>`.
- Polymorphism via `as` prop or Radix-style `asChild`.
- Variants with CVA: `variants`, `compoundVariants`, `defaultVariants`, and
  TypeScript `VariantProps`. Pair with `tailwind-merge`.
- Forward refs. Spread rest props.
- Accessibility is a default, not an option.

Behavior-only primitives to reach for:

| Stack                | Reach for                                              |
| -------------------- | ------------------------------------------------------ |
| React                | Radix Primitives; React Aria Components (deepest a11y) |
| Vue / Solid / Svelte | Ark UI (Zag.js state machines)                         |
| Svelte               | Melt UI or Bits UI                                     |
| Solid                | Kobalte or Corvu                                       |
| Positioning (any)    | Floating UI, or native CSS anchor positioning          |

---

## Platform HIGs — follow vs deviate

Follow strongly: native single-platform apps, apps competing with system apps
(mail, calendar, notes, music), enterprise productivity, anything leveraging
system capabilities (Share Sheet, Siri Shortcuts, Dynamic Island, Handoff).

Deviate: unified cross-platform brands where brand recognition > OS fidelity
(Spotify, Airbnb, Figma, Slack, Linear, Notion), content-canvas pro tools (IDEs,
design tools, DAWs).

Non-negotiable even when deviating: native scrolling physics, text selection,
input methods (including IME), right-click / long-press context menus, keyboard
shortcuts (⌘C/V/X/Z/A/F/N/W/T/S/,), focus rings, back gestures, accessibility
APIs, safe areas, and system-preference queries.

Current design languages (Apple Liquid Glass, Material 3 Expressive, Fluent 2)
detailed in `references/platforms.md`.

---

## Avoiding the AI look

Reject these tells:

- Purple-to-blue / indigo-to-violet hero gradients.
- Over-rounded corners (16–24 px on every element, especially small buttons).
- Glassmorphism with no semantic reason.
- Centred marketing template: hero + two buttons + three-card grid + testimonial
  wall + stats banner + repeated CTA.
- Unmodified Inter + Tailwind `indigo-500` / `slate-900`.
- Stock shadcn/ui with default radii and default colours.
- Aimless scroll-triggered fade-ins on every element.
- Inconsistent spacing with no underlying scale.
- Thin grey body text on white.
- All-caps micro-labels on every section.
- Generic Lucide-icon feature grids.
- "Trusted by" logo walls with fabricated logos.
- Aurora / glow / 3D-sphere hero backgrounds with no product connection.
- Stock-photo avatars in testimonials.
- Emoji section headers on serious products.

Antidotes:

- Start from a designed type scale with deliberate line-heights.
- Pick a considered sans (Söhne, Geist, ABC Diatype, Suisse International, Neue
  Haas Grotesk — Inter is fine but not mandatory). Pair with a mono (Geist Mono,
  JetBrains Mono, Söhne Mono, IBM Plex Mono).
- One accent colour semantically, in OKLCH. Not Tailwind indigo.
- Radius discipline: 0/2/4/6/8 only. Never 16+ on small elements. Match input
  radius to button radius.
- Gradients as atmosphere, not as buttons.
- Flush-left hierarchies over centred marketing blocks.
- 1 px hairline dividers in low-contrast neutrals, not heavy borders.
- Spacing derived from an 8 px (or 4 px) grid.
- Motion under 300 ms, `ease-out`, transform-only.
- Designed dark mode (`#0A0A0A` or `#0D0E12` base), not light-mode inversion.
- Real photography or real product screenshots over generic 3D-render heroes.

---

## End-of-build review checklist

Fail loudly on any "no":

- [ ] Squint test — does hierarchy survive blur?
- [ ] One primary action per screen.
- [ ] Spacing on a single token scale.
- [ ] 3–5 type sizes and 2–3 weights total.
- [ ] Colour used purposefully — accent only on interactive / brand.
- [ ] Platform primitives respected (scroll, selection, shortcuts, back).
- [ ] Contrast 4.5 : 1 body / 3 : 1 large / 3 : 1 non-text.
- [ ] Keyboard reachable. Focus visible.
- [ ] Screen-reader tested (NVDA or VoiceOver).
- [ ] `prefers-reduced-motion` honoured.
- [ ] Tap targets ≥ 44×44 on touch.
- [ ] Optimistic UI. Skeletons under 500 ms. Entrance animations ≤ 300 ms.
- [ ] Rams test: pick three elements, ask what breaks if each is removed. If
      nothing, remove.
- [ ] AI-look test: does it look like every other AI site this month?

Final filter, Rams principle 10: would the interface be worse without this? If
not clearly yes, remove it.

---

## References

- `references/canon.md` — Swiss / Bauhaus / Rams / Nielsen / Norman / Morville /
  typography anatomy / dark mode / design history.
- `references/frameworks.md` — Svelte, React, Vue, Astro, Solid, Qwik, htmx
  tradeoffs with current versions.
- `references/platforms.md` — Apple Liquid Glass, Material 3 Expressive, Fluent
  2 — tokens, type scales, motion, layouts.
- `references/accessibility.md` — WCAG 2.2 AA criteria in full, APCA,
  inclusive-design principles, assistive-tech test matrix.
- `references/css.md` — modern CSS features, engine support, architectures
  (Tailwind v4, shadcn/ui, Vanilla Extract, Panda, StyleX, CUBE, ITCSS).

External canon:

- Rams's ten principles — https://www.vitsoe.com/us/about/good-design
- Nielsen's ten heuristics —
  https://www.nngroup.com/articles/ten-usability-heuristics/
- Morville's UX Honeycomb — https://semanticstudios.com/user_experience_design/
- Laws of UX — https://lawsofux.com/
- Atomic Design — https://atomicdesign.bradfrost.com/
- W3C Design Tokens spec — https://tr.designtokens.org/format/
- WCAG 2.2 — https://www.w3.org/TR/WCAG22/
- ARIA Authoring Practices Guide — https://www.w3.org/WAI/ARIA/apg/
- Utopia fluid type — https://utopia.fyi/
- Vignelli Canon (free PDF) — https://www.vignelli.com/canon.pdf
- Animations.dev (Emil Kowalski) — https://animations.dev/
- Motion — https://motion.dev/
- Floating UI — https://floating-ui.com/
- shadcn/ui — https://ui.shadcn.com/
- Radix Primitives — https://www.radix-ui.com/primitives
- React Aria — https://react-spectrum.adobe.com/react-aria/
- Ark UI — https://ark-ui.com/
- Fluent 2 — https://fluent2.microsoft.design/
- IBM Carbon — https://carbondesignsystem.com/
- GitHub Primer — https://primer.style/
- Adobe Spectrum — https://spectrum.adobe.com/
