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

1. The user owns scaffold choices. The agent recommends options in
   priority order, then waits for approval before creating files,
   installing packages, or running generators. Decide project kind,
   language/runtime, deployment assumption, and framework/template
   with the user; then wire the chosen setup.
2. Initialize git before feature code in fresh scaffolds, create a
   `.gitignore`, and keep generated artifacts out of tracked state.
   ABP review, proof, and refactoring skills rely on diffs and commit
   boundaries to preserve change control.
3. Pick one package manager and commit its lockfile. Use the modern
   ecosystem default from `AGENTS.md` (pnpm/uv/etc.) even with zero
   dependencies; only fall back to built-ins where they are still
   strongest (Cargo for Rust, Go modules for Go).
4. Standardize task names: `test`, `lint`, `format`, `typecheck`,
   `coverage` where applicable. CI runs the same commands developers
   run locally.
5. Satisfy named artifacts literally before applying ecosystem
   preferences. If the request names `tsconfig.json`, `package.json`,
   `pyproject.toml`, CI, README, or another concrete file, create or
   update that artifact unless you explicitly ask to substitute it.
6. A `typecheck` script must run a type checker or the repo's
   established equivalent and must consume the config file added for
   it. Syntax-only checks such as `node --check` are lint/smoke
   checks, not typechecks.
7. For fresh web apps, use a mature framework with routing, request
   handling, testing, and deployment conventions baked in. Hand-rolled
   HTTP servers are only for explicit user requests, tiny scripts,
   libraries, teaching examples, or cases where avoiding a framework
   is itself a stated requirement.
8. If the language, runtime, app shape, or ecosystem state isn't
   covered by `references/`, search current official sources before
   choosing; explain the chosen default in one sentence.
9. Add one smoke test that proves the runner, import path, and build
   system work together. The first real feature should not need
   tooling decisions.
10. README says what it is, how to run it, and how to test it.

## Workflow

1. Detect language, framework, existing conventions, and git state.
2. If Pi offers `/abp:scaffold`, run it for new scaffold work before
   presenting the gate. It also activates when the user invokes
   `/skill:scaffolding` or makes an explicit fresh app/project request.
3. Before creating scaffold files, installing packages, or running generators,
   present a **Scaffold Decision Gate** and wait for explicit user approval.
   Include: project intent, project kind, language/runtime, deployment
   assumption, framework/template, quality baseline, files and commands, and
   this user decision menu:
   1. Approve — create files / install packages / run generators
   2. Refine — change the scaffold plan
   3. Cancel — stop scaffolding
4. Offer choices in order of importance: language/runtime first, then
   deployment assumption, then framework/template, then framework-local
   choices. Recommend one option and name the tradeoff. Use a Backstage
   template when one fits; otherwise name the fallback stack.
5. For fresh scaffolds, initialize git and `.gitignore` before feature code,
   unless the user or environment blocks it. If skipped, say why.
6. Select one package manager before running scaffold or install commands.
   Use the repo or ecosystem default.
7. For web work, classify the target as prototype, new app scaffold, or
   production-bound app. Match greenfield apps to a stack preset when one fits.
8. Add standard commands for install, format, lint, typecheck, test, and
   coverage where applicable. Map each requested artifact to its command.
9. Add one smoke test that can fail and pass.
10. Add CI that runs the same checks. Document local setup and test commands in
   README.

## Verification

- [ ] **Decision gate**: before scaffold mutation, the gate offered Approve,
      Refine, and Cancel choices, and the user approved project kind,
      language/runtime, deployment assumption, and framework/template; the gate
      named the quality baseline, files, and commands, or the request already
      specified every material setup choice.
- [ ] **Change control**: git repository exists for fresh scaffolds;
      `.gitignore` is present before generated artifacts are created;
      the initial scaffold can be reviewed with `git diff` / committed
      in coherent checkpoints, or the user/environment explicitly
      blocked git initialization.
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
- [ ] **Web classification**: prototype/scaffold/production-bound was named
      before files were created; greenfield apps matched a stack preset or
      named the fallback; fresh web app scaffolds use a mature framework unless
      the user asked otherwise.
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
| "The commands passed, so setup is done" | Verify the requirement -> artifact -> command mapping for every named setup requirement. | Pure script rename with no requested artifact. |
| "Git can be added later" | Initialize git and `.gitignore` before feature code so ABP can review diffs, preserve checkpoints, and avoid tracking generated artifacts. | User explicitly forbids git or the target is inside an existing parent repo/submodule policy. |
| "I'll pick the stack and start generating" | In Pi, run `/abp:scaffold`; then present the Scaffold Decision Gate and get approval for setup choices first. | The user already specified every material setup choice and only the mechanical wiring remains. |
| "If this looks good, I can scaffold" | Offer Approve, Refine, and Cancel choices before mutating scaffold files or running scaffold commands. | The user already gave clear approval after seeing the gate. |

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
