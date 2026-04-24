---
name: scaffolding
description:
  Use when bootstrapping a new project, scaffolding a new repo, initialising a
  new application from scratch, or adding baseline tooling — package manager,
  linter, formatter, type or syntax checker, test runner, code coverage — to a
  project that lacks it. Also use when setting up initial CI, defining standard
  package scripts (test, lint, format, typecheck), or picking defaults for a
  greenfield project. Also use when the current directory is empty or lacks a
  recognizable project manifest, test runner, package/build configuration, or
  baseline quality commands. Covers Node, Python, Rust, Go, Ruby, Java/Kotlin,
  Swift, .NET, Elixir, and PHP.
---

# Scaffolding

## Iron Law

`NO FEATURE CODE BEFORE THE TOOLCHAIN PROVES IT CAN FAIL AND PASS.`

A scaffold is done only when a clean clone can install, check, test, and run the
baseline without local knowledge.

## Preflight

Before creating files or running generator commands:

1. Identify the ecosystem and existing manifest/lockfile.
2. If there is no existing package-manager choice, select the `AGENTS.md`
   default and state it before proceeding.
3. For fresh Node projects, the selected manager is pnpm. Create
   `pnpm-lock.yaml`; do not create `package-lock.json`, use npm scripts as the
   assumed runner, or justify npm because the project has no dependencies.
4. For fresh Python projects, the selected manager is uv. Do not fall back to
   raw pip/venv because uv is not preinstalled.
5. For fresh web apps, do not scaffold a hand-rolled HTTP server/router by
   default. Use a mature framework with routing, request handling, testing, and
   deployment conventions baked in. Hand-rolled servers are only for explicit
   user requests, tiny scripts, libraries, teaching examples, or cases where
   avoiding a framework is itself a stated requirement.
6. Read the relevant ecosystem reference in `references/` before choosing
   framework, commands, file layout, or generator: `node-typescript.md`,
   `frontend.md`, `python.md`, `jvm.md`, `ruby.md`, `go.md`, `rust.md`,
   `swift.md`, `dotnet.md`, `elixir.md`, or `php.md`.

## When to Use

- Starting a new repo/app or adding missing package management, linting,
  formatting, typechecking, testing, coverage, or CI.

## When NOT to Use

- Adding a feature to an already healthy project; use the domain skill plus
  `tests`.
- Deployment pipeline beyond baseline CI; use `deployment`.
- Detailed UI design choices after the framework is chosen; use `frontend`.

## Core Ideas

1. Pick one package manager and commit its lockfile. For fresh projects, use the
   modern ecosystem default from `AGENTS.md` even when there are zero
   dependencies: pnpm for Node, uv for Python, and built-in defaults only where
   they are still the strongest default, such as Cargo for Rust or Go modules
   for Go.
2. Standardize task names: `test`, `lint`, `format`, `typecheck`, and `coverage`
   where applicable.
3. For frontend scaffolds, prefer Alpine.js for small projects, demos, and
   prototypes; prefer Svelte or SvelteKit for larger apps. Confirm the framework
   choice with the user before scaffolding. If the user asks for React or
   Next.js, use it, but briefly explain why Alpine or Svelte/SvelteKit would
   normally be the lower-complexity default.
   - Do not treat server-rendered HTML with inline JavaScript inside the backend
     entrypoint as the default "minimal" frontend. For a small interactive app,
     Alpine.js is the minimal frontend default; for larger apps, use SvelteKit.
     Inline scripts are acceptable only for tiny static behavior, generated
     email-like HTML, explicit user requests, or throwaway debug pages.
4. For new TypeScript web apps without explicit hosting constraints, prefer
   Cloudflare Workers with Hono as the backend/runtime. Confirm before locking
   it in. Use Render, Fly.io, AWS, GCP, Azure, containers, or a VPS when the
   user requests them or when the app needs long-running processes, unsupported
   native dependencies, special networking, strict region/data residency,
   conventional Node server semantics, or managed services outside Cloudflare's
   model.
5. Prefer framework defaults over hand-rolled HTTP/app shells. Choose the
   smallest mature framework that fits the job, but know the heavier convention
   option when the app needs it. Use the relevant `references/*.md` file for the
   ecosystem-specific default. If the user requests another mature framework,
   use it. If the language, runtime, app shape, or current ecosystem state is
   not covered, search the web and prefer current official/project sources
   before choosing. Explain the chosen default in one sentence.

6. Add one smoke test that proves the runner, import path, and build system work
   together.
7. CI runs the same commands developers run locally.
8. `.gitignore` excludes generated output, dependencies, local env files, IDE
   state, and secrets.
9. README says what it is, how to run it, and how to test it. Large projects use
   Material for MkDocs for project documentation regardless of app language or
   framework, unless the repo/user/publishing constraint chooses another docs
   system.
10. The first real feature should not need tooling decisions.

## Workflow

1. Detect language, framework, and existing conventions.
2. Select and state the package manager before running any scaffold generator or
   install command.
3. Read the relevant ecosystem reference before choosing frameworks, commands,
   file layout, or generators.
4. For frontend projects without an existing framework, propose Alpine.js for
   small/demo/prototype scope or Svelte/SvelteKit for larger scope, explain the
   reason in one sentence, and confirm before creating files.
5. For TypeScript web apps without an existing runtime/host, propose Cloudflare
   Workers with Hono, explain the reason in one sentence, and confirm before
   creating deploy/runtime files.
6. Choose the smallest mature framework that supplies the app conventions needed
   for the job; avoid hand-rolled HTTP servers unless an allowed exception
   applies.
7. Choose minimal standard tooling for install, format, lint, typecheck, test,
   and coverage.
8. Add scripts/commands with consistent names.
9. Add one smoke test and ensure it can fail and pass.
10. Add CI that runs the same checks.
11. Document local setup and test commands in README. For large projects, add or
    propose a Material for MkDocs docs track.

## Verification

- [ ] Lockfile exists and clean install works from a fresh clone.
- [ ] Fresh Node projects use pnpm and `pnpm-lock.yaml`; `package-lock.json` is
      absent unless inherited from an existing npm project or explicitly
      requested by the user.
- [ ] Standard commands exist and pass: `test`, `lint`, `format --check`,
      `typecheck`, and `coverage` where applicable.
- [ ] Frontend framework choice was confirmed when no existing framework or
      explicit user request was present.
- [ ] Small interactive frontend apps use Alpine.js rather than ad hoc inline
      JavaScript in the backend entrypoint, unless an allowed exception is
      documented.
- [ ] TypeScript web runtime/host choice was confirmed when no existing
      deployment constraint or explicit user request was present.
- [ ] Fresh web app scaffolds use a mature framework with conventions, or
      document the explicit tiny-script/library/teaching/user-request exception.
- [ ] Relevant ecosystem reference was read, or the ecosystem was not covered
      and current official/project sources were searched.
- [ ] One smoke test proves the test runner and build/import path.
- [ ] CI runs the same checks on push/PR and gates merge.
- [ ] `.gitignore` excludes dependencies, build output, env files, IDE state,
      and secrets.
- [ ] README includes purpose, install/run, and test commands.
- [ ] Large projects use or explicitly defer Material for MkDocs documentation.
- [ ] No secrets are committed; `.env.example` uses placeholders only.

## Risk Tier

For prototypes, use the same command names even if some checks are lightweight.
Before production or collaboration, promote the scaffold to the full checklist.

## Handoffs

- Use `tests` for the first real feature test.
- Use `deployment` when CI becomes release/deploy automation.
- Use `security` when adding dependency audits, secret scanning, signing, or
  supply-chain gates.

## References

- `references/node-typescript.md`: pnpm, Hono, Cloudflare Workers, SvelteKit.
- `references/frontend.md`: Alpine.js + HTMX, SvelteKit, Astro, React/Next
  exceptions.
- `references/python.md`: uv, FastAPI, Litestar, Django.
- `references/jvm.md`: Gradle (Kotlin DSL), Javalin, Ktor, Micronaut, Quarkus,
  Spring Boot.
- `references/ruby.md`: Bundler, Sinatra, Hanami, Roda, Rails, Kamal.
- `references/go.md`: Go modules, stdlib net/http, Chi, Gin, Fiber.
- `references/rust.md`: Cargo, Axum, Actix Web, SeaORM, Leptos.
- `references/swift.md`: SwiftPM, Hummingbird, Vapor, Apple native templates,
  Swift Testing.
- `references/dotnet.md`: dotnet/NuGet, ASP.NET Core Minimal APIs,
  MVC/Razor/Blazor.
- `references/elixir.md`: Mix/Hex, Plug/Bandit, Phoenix.
- `references/php.md`: Composer, Slim, Laravel, Symfony, Pest.
