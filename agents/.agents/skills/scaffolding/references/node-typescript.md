# Node / TypeScript

Use this before scaffolding fresh Node or TypeScript projects.

## Defaults

- Package manager: pnpm. Create `pnpm-lock.yaml`; do not create
  `package-lock.json` unless the repo already uses npm or the user explicitly
  asks for npm.
- API/runtime default: Hono on Cloudflare Workers when there are no hosting
  constraints.
- Larger frontend/full-stack default: SvelteKit.
- Avoid raw Node app scaffolds. Use a framework with routing, request handling,
  testing, and deployment conventions.

## TypeScript execution

- Modern Node strips TypeScript natively for single-file scripts and simple CLIs
  — no flag, no loader needed. Reach for a bundler or `tsc` only when types,
  emit, declaration files, or non-`.ts` compile steps are genuinely required.
- When a TypeScript runner is still needed for dev loops or scripts with
  decorators/legacy TS features, use `tsx`. Do not reach for `ts-node`; it is no
  longer the modern default.
- For bundled builds, use the framework's bundler (Vite/SvelteKit, Wrangler)
  rather than hand-wiring esbuild/tsc.

## Choose

- Hono + Cloudflare Workers for APIs, small web apps, edge-first apps, demos,
  prototypes, and internal tools.
- SvelteKit when the frontend is the product, the app needs routing/layout
  conventions, or full-stack form/load conventions matter.
- React/Next.js only when the user asks, an existing repo uses it, or a
  React-only library/team constraint dominates.
- Render, Fly.io, AWS, GCP, Azure, containers, or VPS when the app needs
  long-running processes, unsupported native dependencies, special networking,
  strict region/data residency, conventional Node server semantics, or services
  outside Cloudflare's model.

## Minimum Scaffold

- `package.json` with `packageManager`, `scripts.test`, `scripts.lint`,
  `scripts.format`, `scripts.typecheck`, and relevant `dev`/`deploy` scripts.
- TypeScript config for app and tests.
- One smoke test through the framework boundary.
- If Workers: Wrangler config and Worker-safe environment access.
- If Hono on Workers: use Module Worker style and typed bindings when bindings
  exist.

## Sources

- pnpm: https://pnpm.io/
- Node TypeScript support: https://nodejs.org/learn/typescript/run-natively
- tsx: https://github.com/privatenumber/tsx
- Hono Workers: https://hono.dev/docs/getting-started/cloudflare-workers
- Cloudflare Workers Hono guide:
  https://developers.cloudflare.com/workers/framework-guides/web-apps/more-web-frameworks/hono/
- SvelteKit: https://svelte.dev/docs/kit
- Next.js: https://nextjs.org/docs
