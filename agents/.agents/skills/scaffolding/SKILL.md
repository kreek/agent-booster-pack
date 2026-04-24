---
name: scaffolding
description:
  Use when bootstrapping a new project, scaffolding a new repo, initialising a
  new application from scratch, or adding baseline tooling — package manager,
  linter, formatter, type or syntax checker, test runner, code coverage — to a
  project that lacks it. Also use when setting up initial CI, defining standard
  package scripts (test, lint, format, typecheck), or picking defaults for a
  greenfield project. Covers Node, Python, Rust, Go, Ruby, Java/Kotlin, Swift,
  .NET, Elixir, and PHP.
---

# Scaffolding

## Iron Law

`NO FEATURE CODE BEFORE THE TOOLCHAIN PROVES IT CAN FAIL AND PASS.`

A scaffold is done only when a clean clone can install, check, test, and run the
baseline without local knowledge.

## When to Use

- Starting a new repo/app or adding missing package management, linting,
  formatting, typechecking, testing, coverage, or CI.

## When NOT to Use

- Adding a feature to an already healthy project; use the domain skill plus
  `behavior-testing`.
- Deployment pipeline beyond baseline CI; use `deployment-and-cicd`.
- Framework-specific UI design choices; use `frontend-design`.

## Core Ideas

1. Pick one package manager and commit its lockfile.
2. Standardize task names: `test`, `lint`, `format`, `typecheck`, and `coverage`
   where applicable.
3. Add one smoke test that proves the runner, import path, and build system work
   together.
4. CI runs the same commands developers run locally.
5. `.gitignore` excludes generated output, dependencies, local env files, IDE
   state, and secrets.
6. README says what it is, how to run it, and how to test it.
7. The first real feature should not need tooling decisions.

## Workflow

1. Detect language, framework, and existing conventions.
2. Choose minimal standard tooling for install, format, lint, typecheck, test,
   and coverage.
3. Add scripts/commands with consistent names.
4. Add one smoke test and ensure it can fail and pass.
5. Add CI that runs the same checks.
6. Document local setup and test commands in README.

## Verification

- [ ] Lockfile exists and clean install works from a fresh clone.
- [ ] Standard commands exist and pass: `test`, `lint`, `format --check`,
      `typecheck`, and `coverage` where applicable.
- [ ] One smoke test proves the test runner and build/import path.
- [ ] CI runs the same checks on push/PR and gates merge.
- [ ] `.gitignore` excludes dependencies, build output, env files, IDE state,
      and secrets.
- [ ] README includes purpose, install/run, and test commands.
- [ ] No secrets are committed; `.env.example` uses placeholders only.

## Risk Tier

For prototypes, use the same command names even if some checks are lightweight.
Before production or collaboration, promote the scaffold to the full checklist.

## Handoffs

- Use `behavior-testing` for the first real feature test.
- Use `deployment-and-cicd` when CI becomes release/deploy automation.
- Use `security-review` when adding dependency audits, secret scanning, signing,
  or supply-chain gates.
