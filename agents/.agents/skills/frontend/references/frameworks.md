# Framework tradeoffs — frontend-design

Versions and stances current as of April 2026. Consult before committing to a
stack.

---

## Svelte 5 + SvelteKit — default

Shipped 22 October 2024. Runes: `$state`, `$derived`, `$effect`, `$props`,
`$bindable`.

- Compile-time reactivity. No virtual DOM. Hello-world bundles in single-digit
  KB.
- SvelteKit: file-based routing (`+page.svelte`, `+page.server.ts`,
  `+layout.svelte`), SSR/SSG/edge/CSR per-route, form actions with progressive
  enhancement, typed `load` functions, adapters for Vercel, Cloudflare, Node,
  static hosts.
- Built-in animation primitives — `transition:fade|fly|slide|scale|blur`,
  `animate:flip` (FLIP built in), `crossfade` for shared-element morphs,
  `spring`/`tweened` stores.
- Scoped styles automatic. `$bindable` + types keep component APIs terse.

Tradeoffs:

- Smaller ecosystem than React. Bits UI, shadcn-svelte, Melt UI, Skeleton,
  Motion/GSAP/Lottie all work. Some libraries (notably rich-text editors) remain
  React-only.
- Smaller hiring pool than React.

Refs: https://svelte.dev/ · https://kit.svelte.dev/

---

## React 19 + Next.js 15+

React 19 shipped 5 December 2024. Adds Actions, `useActionState`,
`useFormStatus`, `useOptimistic`, `use()`, `ref` as a regular prop, stable
Server Components.

Next.js 15 ships Turbopack stable and the React Compiler.

Pick when:

- Team is already React.
- Hiring pool dictates.
- shadcn/ui + Radix + React Aria is explicitly desired.

Costs: more JS shipped than Svelte or Solid; sharp RSC/Client-Component
boundaries; hydration errors remain a common footgun.

Refs: https://react.dev/ · https://nextjs.org/

---

## Vue 3.5 + Nuxt 4

Reasonable middle ground. Strong in APAC enterprise.

- Vue 3.6 with **Vapor Mode** (direct DOM compilation, no virtual DOM) is beta
  as of February 2026. Expected stabilisation Q3–Q4 2026. Not production-ready
  yet.

Refs: https://vuejs.org/ · https://nuxt.com/

---

## Astro 5+

Right answer for marketing sites, blogs, documentation, content-dominant builds.

- Islands architecture ships zero JS by default.
- Embeds Svelte / React / Vue / Solid components side by side.
- Server Islands, Content Layer, native view transitions.

Refs: https://astro.build/

---

## Solid / SolidStart and Qwik / QwikCity

Pick when absolute performance or resumability matters more than ecosystem.

- Solid — fine-grained reactivity, JSX syntax, tiny bundles.
- Qwik — resumability over hydration.

Refs: https://www.solidjs.com/ · https://qwik.dev/

---

## htmx

Server-heavy CRUD apps with thin JS. HTML-over-the-wire.

Refs: https://htmx.org/

---

## Behavior-only primitive libraries

| Stack                  | Library                                                     |
| ---------------------- | ----------------------------------------------------------- |
| React                  | Radix Primitives — https://www.radix-ui.com/primitives      |
| React                  | React Aria Components — https://react-spectrum.adobe.com/   |
| React/Vue/Solid/Svelte | Ark UI — https://ark-ui.com/                                |
| Svelte                 | Melt UI — https://melt-ui.com/                              |
| Svelte                 | Bits UI — https://www.bits-ui.com/                          |
| Solid                  | Kobalte — https://kobalte.dev/                              |
| Solid                  | Corvu — https://corvu.dev/                                  |
| Any (positioning)      | Floating UI — https://floating-ui.com/                      |
| Any (positioning)      | Native CSS anchor positioning (preferred where it suffices) |

---

## Design-system catalogues to borrow from

| System               | Character                                                                                                                            |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| IBM Carbon           | 16-column grid, IBM Plex, enterprise. https://carbondesignsystem.com/                                                                |
| Shopify Polaris      | Merchant-focused. Polaris React deprecated Oct 2025 — use Polaris Web Components. https://polaris.shopify.com/                       |
| Atlassian            | Complex PM tools. https://atlassian.design/                                                                                          |
| GitHub Primer        | Mona Sans, restrained, code-adjacent. https://primer.style/                                                                          |
| Adobe Spectrum       | Cross-platform. React Aria + React Stately. https://spectrum.adobe.com/                                                              |
| Salesforce Lightning | Origin of "design token." https://www.lightningdesignsystem.com/                                                                     |
| Ant Design           | Comprehensive; harder to customise. https://ant.design/                                                                              |
| shadcn/ui            | Copy-paste catalog of Radix + Tailwind + CVA recipes. Install via CLI into your repo. Customise aggressively. https://ui.shadcn.com/ |
