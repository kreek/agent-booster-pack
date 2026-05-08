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

## Core Ideas

1. Pick one package manager and commit its lockfile. Use the modern
   ecosystem default from `AGENTS.md` (pnpm/uv/etc.) even with zero
   dependencies; only fall back to built-ins where they are still
   strongest (Cargo for Rust, Go modules for Go).
2. Standardize task names: `test`, `lint`, `format`, `typecheck`,
   `coverage` where applicable. CI runs the same commands developers
   run locally.
3. Satisfy named artifacts literally before applying ecosystem
   preferences. If the request names `tsconfig.json`, `package.json`,
   `pyproject.toml`, CI, README, or another concrete file, create or
   update that artifact unless you explicitly ask to substitute it.
4. A `typecheck` script must run a type checker or the repo's
   established equivalent and must consume the config file added for
   it. Syntax-only checks such as `node --check` are lint/smoke
   checks, not typechecks.
5. For fresh web apps, use a mature framework with routing, request
   handling, testing, and deployment conventions baked in. Hand-rolled
   HTTP servers are only for explicit user requests, tiny scripts,
   libraries, teaching examples, or cases where avoiding a framework
   is itself a stated requirement.
6. If the language, runtime, app shape, or ecosystem state isn't
   covered by `references/`, search current official sources before
   choosing; explain the chosen default in one sentence.
7. Add one smoke test that proves the runner, import path, and build
   system work together. The first real feature should not need
   tooling decisions.
8. README says what it is, how to run it, and how to test it.

## Workflow

1. Detect language, framework, and existing conventions. Select and
   state the package manager before running any scaffold or install
   command (use the `AGENTS.md` default if no existing choice). Read
   `references/language-defaults.md` for the cross-cutting stance and
   the relevant template under `references/stacks/<language>/` for
   stack picks.
2. For web work, classify the request: local prototype/spike, new app
   scaffold, or production-bound app. Static HTML/CSS/JS is acceptable
   for a throwaway prototype — say so explicitly and name the likely
   upgrade framework if work continues. For greenfield apps, match the
   request to a stack preset in `references/stacks/index.yaml` and
   confirm the preset and required choices (database, hosting adapter,
   etc.) before creating runtime/deploy files.
3. Choose minimal standard tooling for install, format, lint,
   typecheck, test, and coverage. Add scripts/commands with consistent
   names. For each requested script or config file, map requirement →
   artifact → command before calling the scaffold done.
4. Add one smoke test and ensure it can fail and pass.
5. Add CI that runs the same checks. Document local setup and test
   commands in README. Hand off documentation system choice (Material
   for MkDocs by default for large projects) to `documentation`.

## Verification

- [ ] **Package management**: lockfile exists; clean install works
      from a fresh clone; fresh Node projects use pnpm and
      `pnpm-lock.yaml` (no `package-lock.json` unless inherited or
      requested); relevant ecosystem reference was read, or current
      official sources were searched when not covered.
- [ ] **Command surface**: standard commands exist and pass (`test`,
      `lint`, `format --check`, `typecheck`, `coverage` where
      applicable); each command consumes the config file added for
      it; typecheck is not only a syntax check.
- [ ] **Requested artifacts**: named artifacts exist by their
      requested names, or a substitution was explicitly approved.
- [ ] **Web classification**: prototype/scaffold/production-bound was
      named before files were created; prototypes name an upgrade
      path; greenfield apps matched a stack preset (or named the
      fallback) with required choices confirmed; fresh web app
      scaffolds use a mature framework, not a hand-rolled HTTP server
      or inline JS in a backend entrypoint.
- [ ] **Smoke test + CI**: one smoke test proves the runner and
      build/import path; CI runs the same checks on push/PR and gates
      merge.
- [ ] **Hygiene**: `.gitignore` excludes deps, build output, env
      files, IDE state, and secrets; no secrets are committed;
      `.env.example` uses placeholders only; README includes purpose,
      install/run, and test commands.
- [ ] **Docs system**: documentation tooling for large projects was
      handed off to `documentation` (Material for MkDocs by default)
      or explicitly deferred.

## Risk Tier

For prototypes, use the same command names even if some checks are
lightweight. Before production or collaboration, promote the scaffold
to the full checklist.

## Tripwires

| Trigger | Do this instead | False alarm |
|---|---|---|
| "A nearby config file is equivalent" | Use the requested file name, or ask before substituting. | The repo already uses the nearby config as its source of truth. |
| "`node --check` proves typecheck" | Treat it as syntax/lint smoke; wire `typecheck` to the real type checker or established equivalent. | The ecosystem has no type checker and the limitation is stated. |
| "The commands passed, so setup is done" | Verify requirement -> artifact -> command mapping for every named setup requirement. | Pure script rename with no requested artifact. |

## Handoffs

- Use `domain-modeling` immediately after scaffolding when specs are clear
  and the next step is feature/domain data modeling.
- Use `proof` for the first real feature test.
- Use `release` when CI becomes release/deploy automation.
- Use `security` when adding dependency audits, secret scanning,
  signing, or supply-chain gates.

## References

- `references/stacks/index.yaml`: Backstage Software Template catalog
  of stack presets (per-language backend + TypeScript fullstack/
  static-site/frontend). Each template carries `metadata.links` to
  authoritative docs.
- `references/language-defaults.md`: cross-cutting language and
  runtime stances beyond any single template; languages mirror the
  catalog under `references/stacks/`.
