# TypeScript / Node review reference

Use when reviewing TypeScript or modern Node.js code in the diff.
Apply this alongside the main `code-review` skill workflow.

## Data-first bias (apply first)

JavaScript and TypeScript classes are easy to reach for; they're
rarely the right tool. The `data` skill's doctrine is canonical:

- Prefer `readonly` fields, `as const`, and discriminated unions over
  classes with mutable state.
- A class that wraps pure transformations and has no field state is a
  smell — convert to free functions in a module.
- `let` where `const` would do is a finding; the difference is
  intent.
- Parse at the boundary: validate untrusted input with Zod / Valibot
  / built-in schema once and let downstream code trust the type.
- Make illegal states unrepresentable: prefer
  `{ status: 'ok'; value: T } | { status: 'err'; error: E }`
  over a `T | null` plus a separate `error?: E`.

When in doubt, route to the `data` skill.

## Tooling that should be passing

- `pnpm tsc --noEmit` (or the project's typecheck script) — strict
  mode is the bar. `"strict": true` plus
  `"noUncheckedIndexedAccess": true`,
  `"noImplicitOverride": true`, and `"exactOptionalPropertyTypes": true`
  are the modern defaults; missing any of them in `tsconfig.json` is
  a finding worth raising.
- `pnpm biome check` (or ESLint + Prettier, depending on project) —
  formatting and lint must pass. New disable comments need a reason.
- `pnpm test` — narrow to the package under change.
- Lockfile (`pnpm-lock.yaml` / `package-lock.json` / `bun.lockb`)
  must be committed; review the diff between manifest and lockfile
  for surprises (transitive bumps, new sources).

## High-signal review checks

- **`any` and `as` casts**: `any` leaking across module boundaries
  defeats the type system. `as Foo` casts past `unknown` need a
  comment explaining why the compiler can't see what we can.
- **`unknown` discipline**: third-party JSON, `JSON.parse`, and
  network responses should hit the codebase as `unknown` and be
  parsed before use.
- **Exhaustive `switch`**: the default branch on a discriminated
  union should `assertNever(x)`. A missing default that compiles
  today silently grows brittle when a variant is added.
- **Promise handling**: floating promises (`asyncFn()` with no
  `await` and no `.catch`) are a memory leak / unhandled rejection
  waiting to happen. The `@typescript-eslint/no-floating-promises`
  rule should be on.
- **Error handling**: `Error` is the only thing you can `throw`
  safely in TS; throwing strings or objects breaks `instanceof`. New
  custom errors should subclass `Error` and set `name`.
- **ESM vs CJS**: a file using `import` syntax in a `commonjs`
  package, or `require()` in an `"type": "module"` package, is
  almost always a bug. `__dirname` in ESM does not exist; check for
  it.
- **Frameworks**: middleware ordering matters (Hono / Express /
  Fastify). Auth/CORS/rate-limit registered after the route they
  should protect is a Critical finding.
- **No `console.log` for production logs**: use the project logger
  (pino, winston, framework's). Stray `console.log` in committed
  code is a finding.
- **`process.env` access**: should be parsed once at startup into a
  typed config; scattered `process.env.X` reads with implicit
  string-or-undefined are bug bait.
- **Bundler / build artifacts**: `dist/` or `.next/` accidentally
  committed.

## Anti-patterns / red flags

- `as any` or `: any` in new code.
- `// @ts-ignore` without `@ts-expect-error` and a reason.
- `Promise<void>` returned but not awaited.
- `class FooService` with no instance fields, just methods.
- `let` for a value that is never reassigned.
- `throw "string"` or `throw { msg }`.
- `JSON.parse(req.body)` without a schema check.
- `console.log` in committed non-test code.
- `Math.random()` for anything security-sensitive (use
  `crypto.randomUUID` / `crypto.getRandomValues`).

## Sources

- TypeScript Do's and Don'ts:
  <https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html>
- Total TypeScript Strictness:
  <https://www.totaltypescript.com/tsconfig-cheat-sheet>
- typescript-eslint rules:
  <https://typescript-eslint.io/rules/>
- Node.js best practices:
  <https://github.com/goldbergyoni/nodebestpractices>
- Hono routing/middleware: <https://hono.dev/docs/>
