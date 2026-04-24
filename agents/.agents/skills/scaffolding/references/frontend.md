# Frontend

Use this before choosing frontend scaffolding for fresh projects.

## Defaults

- Small projects, demos, prototypes, and compact interactive tools: HTMX for
  server-driven interactivity paired with Alpine.js for local UI behaviour
  (dropdowns, modals, focus). Alpine-alone is fine for tiny toggles where no
  server round-trip is involved.
- Larger frontend apps or full-stack apps: SvelteKit. Current Svelte uses runes
  (`$state`, `$derived`, `$effect`) as the reactivity model; new scaffolds
  should adopt runes rather than the legacy implicit form.
- Content-heavy sites (marketing, blogs, docs): Astro.
- Generic product/tool UI visual baseline: Carbon-style grid, density,
  restraint, and IBM Plex where licensing/delivery allow.
- Do not hide an interactive app as server-rendered HTML with inline JavaScript
  inside the backend entrypoint.

## Choose

- HTMX + Alpine.js when the UI is mostly server-rendered HTML (Django, Rails,
  Laravel, Phoenix, Go templates) and interaction is request/response shaped.
- SvelteKit when routing, layouts, form actions, load functions, or full-stack
  conventions matter.
- Astro for marketing sites, blogs, docs, or content-heavy sites where JS ships
  only where strictly needed.
- React/Next.js when the user asks, an existing repo uses it, the team requires
  it, or a React-only ecosystem dependency is decisive. When chosen, the current
  default styling stack is Tailwind CSS + shadcn/ui; there is no separate
  style-config file to hand-craft.

## Minimum Scaffold

- A real frontend layer: server HTML plus HTMX attributes and Alpine islands for
  small apps, or a SvelteKit app for larger ones.
- Standard commands through the chosen package manager: `dev`, `test`, `lint`,
  `format`, and `typecheck` where applicable.
- One rendered smoke test or browser-level check for the main interaction.
- Accessibility handoff for controls, forms, focus, contrast, and semantic
  structure.

## Sources

- HTMX: https://htmx.org/docs/
- Alpine.js: https://alpinejs.dev/
- SvelteKit: https://svelte.dev/docs/kit
- Svelte runes: https://svelte.dev/docs/svelte/what-are-runes
- Astro: https://docs.astro.build/
- Tailwind CSS: https://tailwindcss.com/docs
- shadcn/ui: https://ui.shadcn.com/
- Carbon: https://carbondesignsystem.com/
