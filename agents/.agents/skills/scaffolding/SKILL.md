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

A scaffold is done only when a clean clone can install, check, test,
and run the baseline without local knowledge.

## When to Use

- Starting a new repo/app, or adding missing package management,
  linting, formatting, typechecking, testing, coverage, or CI.

## When NOT to Use

- Adding a feature to an already healthy project; use the domain
  skill plus `tests`.
- Deployment pipeline beyond baseline CI; use `deployment`.
- Detailed UI design choices after the framework is chosen; use
  `frontend`.

## Preflight

Before creating files or running generator commands:

1. Identify the ecosystem and existing manifest/lockfile. If no
   existing package-manager choice, select the `AGENTS.md` default
   and state it before proceeding.
2. Read the relevant `references/` ecosystem file before choosing
   framework, commands, file layout, or generator.
3. For fresh web apps, **don't** scaffold a hand-rolled HTTP
   server/router by default. Use a mature framework with routing,
   request handling, testing, and deployment conventions baked in.
   Hand-rolled servers are only for explicit user requests, tiny
   scripts, libraries, teaching examples, or cases where avoiding a
   framework is itself a stated requirement.

## Project-Specific Defaults

These are non-default defaults the pack prescribes:

- **Fresh Node**: pnpm + `pnpm-lock.yaml` (not npm + `package-lock.json`,
  even with zero dependencies).
- **Fresh Python**: uv (not raw pip/venv, even when uv isn't
  preinstalled).
- **Fresh TypeScript web app** (no explicit hosting constraint):
  Cloudflare Workers + Hono. Confirm before locking it in. Use Render,
  Fly.io, AWS, GCP, Azure, containers, or a VPS only when the user
  requests them or the app needs long-running processes, unsupported
  native deps, special networking, region/data residency, conventional
  Node server semantics, or managed services outside Cloudflare.
- **Fresh frontend, small/demo/prototype**: Alpine.js. **Larger app**:
  Svelte/SvelteKit. Confirm framework choice with the user before
  scaffolding. If the user asks for React or Next.js, use it but
  briefly explain why Alpine or Svelte/SvelteKit would normally be the
  lower-complexity default. Don't treat server-rendered HTML with
  inline JavaScript inside the backend entrypoint as the default
  "minimal" frontend.
- **Large project documentation**: Material for MkDocs by default,
  regardless of app language or framework, unless the repo/user/
  publishing constraint chooses another.

## Core Ideas

1. Pick one package manager and commit its lockfile. Use the modern
   ecosystem default from `AGENTS.md` even with zero dependencies;
   built-in defaults only where they're still strongest (Cargo for
   Rust, Go modules for Go).
2. Standardize task names: `test`, `lint`, `format`, `typecheck`,
   `coverage` where applicable.
3. Prefer framework defaults over hand-rolled HTTP/app shells. Choose
   the smallest mature framework that fits. If the language, runtime,
   app shape, or current ecosystem state isn't covered by the
   `references/`, search the web and prefer current official/project
   sources before choosing. Explain the chosen default in one
   sentence.
4. Add one smoke test that proves the runner, import path, and build
   system work together.
5. CI runs the same commands developers run locally. `.gitignore`
   excludes generated output, dependencies, local env files, IDE
   state, and secrets.
6. README says what it is, how to run it, and how to test it.
7. The first real feature should not need tooling decisions.

## Workflow

1. Detect language, framework, and existing conventions. Select and
   state the package manager before running any scaffold or install
   command. Read the relevant ecosystem reference.
2. For frontend without an existing framework, propose Alpine.js
   (small/demo) or Svelte/SvelteKit (larger), explain in one sentence,
   confirm before creating files. For TypeScript web apps without an
   existing runtime/host, propose Cloudflare Workers + Hono, confirm
   before creating deploy/runtime files.
3. Choose minimal standard tooling for install, format, lint,
   typecheck, test, and coverage. Add scripts/commands with consistent
   names. Add one smoke test and ensure it can fail and pass.
4. Add CI that runs the same checks. Document local setup and test
   commands in README. For large projects, add or propose Material
   for MkDocs.

## Verification

- [ ] Lockfile exists and clean install works from a fresh clone.
- [ ] Fresh Node projects use pnpm and `pnpm-lock.yaml`;
      `package-lock.json` is absent unless inherited or explicitly
      requested.
- [ ] Standard commands exist and pass: `test`, `lint`,
      `format --check`, `typecheck`, `coverage` where applicable.
- [ ] Frontend framework choice was confirmed when no existing
      framework or explicit user request was present; small
      interactive frontend apps use Alpine.js rather than ad hoc
      inline JavaScript in the backend entrypoint.
- [ ] TypeScript web runtime/host choice was confirmed when no
      existing deployment constraint or explicit user request was
      present.
- [ ] Fresh web app scaffolds use a mature framework with conventions,
      or document the explicit exception.
- [ ] Relevant ecosystem reference was read, or the ecosystem was not
      covered and current official/project sources were searched.
- [ ] One smoke test proves the test runner and build/import path.
- [ ] CI runs the same checks on push/PR and gates merge.
- [ ] `.gitignore` excludes dependencies, build output, env files,
      IDE state, and secrets; no secrets are committed; `.env.example`
      uses placeholders only.
- [ ] README includes purpose, install/run, and test commands.
- [ ] Large projects use or explicitly defer Material for MkDocs.

## Risk Tier

For prototypes, use the same command names even if some checks are
lightweight. Before production or collaboration, promote the scaffold
to the full checklist.

## Handoffs

- Use `tests` for the first real feature test.
- Use `deployment` when CI becomes release/deploy automation.
- Use `security` when adding dependency audits, secret scanning,
  signing, or supply-chain gates.

## References

- `references/node-typescript.md`: pnpm, Hono, Cloudflare Workers,
  SvelteKit.
- `references/frontend.md`: Alpine.js + HTMX, SvelteKit, Astro,
  React/Next exceptions.
- `references/python.md`: uv, FastAPI, Litestar, Django.
- `references/jvm.md`: Gradle (Kotlin DSL), Javalin, Ktor, Micronaut,
  Quarkus, Spring Boot.
- `references/ruby.md`: Bundler, Sinatra, Hanami, Roda, Rails, Kamal.
- `references/go.md`: Go modules, stdlib net/http, Chi, Gin, Fiber.
- `references/rust.md`: Cargo, Axum, Actix Web, SeaORM, Leptos.
- `references/swift.md`: SwiftPM, Hummingbird, Vapor, Apple native
  templates, Swift Testing.
- `references/dotnet.md`: dotnet/NuGet, ASP.NET Core Minimal APIs,
  MVC/Razor/Blazor.
- `references/elixir.md`: Mix/Hex, Plug/Bandit, Phoenix.
- `references/php.md`: Composer, Slim, Laravel, Symfony, Pest.
