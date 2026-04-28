---
name: scaffolding
description: Use for scaffolding, new projects, package setup, quality tooling, CI, and repo structure.
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
  skill plus `proof`.
- Release pipeline beyond baseline CI; use `release`.
- Detailed UI design choices after the framework is chosen; use
  `ui-design`.

## Preflight

Before creating files or running generator commands:

1. Identify the ecosystem and existing manifest/lockfile. If no
   existing package-manager choice, select the `AGENTS.md` default
   and state it before proceeding.
2. Read `references/language-defaults.md` for the language's
   cross-cutting stance (runtime, tooling posture, deprecated
   conventions to avoid), then look up the relevant Backstage
   Template under `references/stacks/<language>/` for framework,
   axes, and `metadata.links` to authoritative docs.
3. For web work, classify the request before choosing files:
   local prototype/spike, new app scaffold, or production-bound app.
   Static HTML/CSS/JS is acceptable for a local throwaway prototype or
   isolated demo. Say when you are taking that path and name the
   likely upgrade framework if work continues.
4. For fresh web apps, don't scaffold a hand-rolled HTTP
   server/router by default. Use a mature framework with routing,
   request handling, testing, and deployment conventions baked in.
   Hand-rolled servers are only for explicit user requests, tiny
   scripts, libraries, teaching examples, or cases where avoiding a
   framework is itself a stated requirement.

## Project-Specific Defaults

For greenfield app scaffolding, match the request to a stack preset
in `references/stacks/index.yaml`. Each preset names required and optional
axes (backend, frontend, database, background jobs) and the tooling
that goes with the stack. Confirm the preset and the required
choices with the user before creating files.

For documentation tooling on a large project, default to Material
for MkDocs unless the repo/user/publishing constraint chooses
another, regardless of app language or framework.

Package-manager defaults (pnpm, uv, bundler, cargo, etc.) come from
`AGENTS.md` and apply even with zero dependencies.

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
4. Prefer established, boring technology. Use built-in platform
   features when they are sufficient; add packages when they remove
   real complexity or supply mature conventions the project needs.
5. Add one smoke test that proves the runner, import path, and build
   system work together.
6. CI runs the same commands developers run locally. `.gitignore`
   excludes generated output, dependencies, local env files, IDE
   state, and secrets.
7. Create `.env.example` (committed) and `.env` (gitignored) from day
   one, even when there are no secrets yet. Both start with a header
   comment explaining the pattern: `.env` is for local-dev secrets
   only, never committed; `.env.example` lists the keys the app reads
   with placeholder values; production secrets come from a secrets
   manager, not this file. Loading mechanism follows the language
   default (Node `--env-file`, `python-dotenv` via `uv`, `direnv`,
   etc.) — pick one and document it in the README.
8. README says what it is, how to run it, and how to test it.
9. The first real feature should not need tooling decisions.

## Workflow

1. Detect language, framework, and existing conventions. Select and
   state the package manager before running any scaffold or install
   command. Read `references/language-defaults.md` for the
   cross-cutting stance and the relevant template under
   `references/stacks/<language>/` for stack picks.
2. For web work, state whether this is a prototype, scaffold, or
   production-bound app. Match the request to a stack preset in
   `references/stacks/index.yaml`, name the preset and any required choices
   (database, hosting adapter, etc.), and confirm with the user
   before creating runtime/deploy files.
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
- [ ] Web work was classified as prototype, scaffold, or
      production-bound app before files were created. Prototype mode
      was named explicitly and included an upgrade path.
- [ ] A stack preset from `references/stacks/index.yaml` was matched and
      named, and its required choices were confirmed with the user
      before runtime/deploy files were created. Where no preset
      fit, the explicit fallback was named.
- [ ] Fresh web app scaffolds use a mature framework with
      conventions, not a hand-rolled HTTP server or inline JS in a
      backend entrypoint.
- [ ] Relevant ecosystem reference was read, or the ecosystem was not
      covered and current official/project sources were searched.
- [ ] One smoke test proves the test runner and build/import path.
- [ ] CI runs the same checks on push/PR and gates merge.
- [ ] `.gitignore` excludes dependencies, build output, env files,
      IDE state, and secrets; no secrets are committed.
- [ ] `.env.example` exists with a header comment explaining the
      pattern and lists every key the app reads with placeholder
      values only. `.env` is gitignored and never committed, even
      when empty. README names the loader (`--env-file`, dotenv,
      direnv, etc.).
- [ ] README includes purpose, install/run, and test commands.
- [ ] Large projects use or explicitly defer Material for MkDocs.

## Risk Tier

For prototypes, use the same command names even if some checks are
lightweight. Before production or collaboration, promote the scaffold
to the full checklist.

## Handoffs

- Use `data-first` immediately after scaffolding when specs are clear
  and the next step is feature/domain data modeling.
- Use `proof` for the first real feature test.
- Use `release` when CI becomes release/deploy automation.
- Use `security` when adding dependency audits, secret scanning,
  signing, or supply-chain gates.

## References

- `references/stacks/index.yaml`: Backstage Software Template
  catalog of named stack presets (lightweight + larger backend per
  language, plus TypeScript fullstack/static-site/frontend).
  Each template carries its own `metadata.links` to authoritative
  framework / runtime / tooling docs.
- `references/language-defaults.md`: cross-cutting language and
  runtime stances that apply beyond any single template (uv
  philosophy, modern `net/http` ServeMux, K2 Kotlin compiler,
  Native AOT limits and F#-specific dynamic-code constraints,
  Phoenix on Bandit, deps.edn for Clojure, etc.). Languages
  mirror the catalog under `references/stacks/`.
