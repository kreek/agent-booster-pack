# Changelog

All notable changes to Agent Booster Pack are recorded here. The format
follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and
the project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [9.10.2] (2026-05-15)

### Removed

- The `proof`, `review`, and `workflow` slash-command wrappers (in
  `plugin/commands/` and the canonical `agents/.agents/commands/`).
  Claude Code already exposes each skill as its own slash command, so
  the wrappers showed up as duplicate `/proof`, `/review`, and
  `/workflow` entries. Trigger the skills directly instead.
- Symlink generator and skill-anatomy validator branches that mirrored
  and checked the deleted command files, plus their tests.

## [9.10.1] (2026-05-15)

### Fixed

- Stop hook crash under Claude Code (`Cannot find module
  '/scripts/proof-reminder.mjs'`). The Codex hooks file
  (`plugin/hooks/hooks.json`, which uses the Codex-only
  `${CODEX_PLUGIN_ROOT}` placeholder) sat on the path Claude Code
  auto-discovers, so Claude Code loaded it alongside the correct inline
  hook from `.claude-plugin/plugin.json` and the unsubstituted
  placeholder collapsed to an absolute `/scripts/...` path. Moved the
  Codex hooks file to `plugin/.codex-plugin/hooks.json` and updated the
  Codex plugin manifest reference, leaving Claude Code with only the
  working `${CLAUDE_PLUGIN_ROOT}`-based hook.

## [9.10.0] (2026-05-15)

### Added

- Light-touch end-of-turn proof reminder hook on the Claude Code and Codex
  plugin (`Stop` event). Interrupts once per task when production code
  changed and the agent has not named proof, pointing at the `abp:proof`
  skill. Honors `stop_hook_active` to avoid infinite loops; idempotent per
  session via a state file at `~/.abp-proof-gate-state.json`
  (override with `ABP_PROOF_GATE_STATE_FILE`). Skips silently on
  docs/config-only diffs, clean trees, non-git directories, and when the
  agent has already named proof in its last message. Codex users must
  enable `[features] hooks = true` in `~/.codex/config.toml`.
- Narrow `agents/AGENTS.md` carve-out permitting completion-gate hooks
  that ride on the host's native turn-end event and inject skill-aligned
  reminders only.

## [9.9.0] (2026-05-15)

### Changed

- BREAKING: Renamed the `technical-design` skill, `/skill:technical-design`
  invocation, Pi guard command `/abp:technical-design`, and
  `agent-booster-pack-technical-design` runtime package to `specify`,
  `/skill:specify`, `/abp:specify`, and
  `agent-booster-pack-specify`. Specify keeps the design-before-code
  conversation guard, routes durable interfaces through `contract-first`, and
  captures the agreed result as an ADR, RFC, tech spec, or note.
- Workflow guidance now separates work-location choices by branch state: on
  `main`/`master`, create a new branch or create a separate worktree and
  branch; on topic branches with distinct work, continue here, branch from
  this branch, or create a separate worktree from main. It also requires
  explicit compatibility decisions for public renames/removals, treats release
  prep as separate from implementation approval, and defers `release` to
  explicit release-prep requests or post-implementation/code-review checks so
  startup routing cannot silently expand into npm/version/changelog work.
- Renamed the `data-first` skill to `domain-modeling`. The new
  `contract-first` skill (Pi Interface Design Gate) owns the temporal
  "first" position in the workflow; `data-first` was always a doctrine
  about data shapes, invariants, parsing, and effect isolation rather
  than ordering, so the name now matches what the skill teaches.
  Cross-references in canonical skills, AGENTS, README, the npm package
  README, and the eval harness have been updated. The plugin mirror at
  `plugin/skills/` is regenerated from canonical.
- Promoted the workflow-only official-source rule into a canonical
  `official-source-check` skill. `workflow`, `agents/AGENTS.md`, and README
  now route framework, library, runtime, SDK, browser, cloud, and platform
  checks through that skill instead of hiding the rule in a reference file.

## [5.1.0] (2026-05-08)

### Added

- `scaffolding` now ships a `java/service-quarkus` Backstage stack template
  for native-ready JVM services with Quarkus REST, CDI, Gradle, JUnit 5,
  RestAssured, Panache, observability, auth, scheduler, and native-image
  choices.
- `workflow` now includes a version-verified implementation reference for
  version-sensitive framework, library, runtime, and platform work.
- `workflow` now includes a simple-not-easy doctrine reference for avoiding
  ceremony, over-broad skill loading, and hidden coupling disguised as safety.
- `data-first` now ships a `complecting.md` reference: a smell catalog with
  AST-level signals (mutable field + reader + writer = state/identity/value
  braid; switch-on-tag braids who/what; ORM lazy associations braid object
  and relational semantics; setter/getter pairs; mutating builders;
  singletons; pass-through parameters; etc.) and the smallest disentangling
  move per smell. Cross-cited by `code-review` for diff sweeps.
- `refactoring` now ships a `connascence.md` reference: the Page-Jones /
  Weirich axes (Name → Type → Meaning → Position → Algorithm → Execution →
  Timing → Identity) with strength, locality, and degree dimensions, used
  to score whether a refactor weakens coupling, reduces degree, or
  tightens locality. Cross-cited by `architecture` and `code-review`.
- `workflow` now ships a `vocabulary-map.md` reference: a crosswalk from
  SOLID, Clean Architecture, Hexagonal / Ports & Adapters, and DDD
  vocabulary into the ABP simplicity-shaped implementation, so the agent
  meets the user's dialect at design time rather than asserting a
  competing one at PR review. Cross-cited by `architecture`, `data-first`,
  `refactoring`, and `code-review`.
- `release` now includes a deprecation and migration reference covering
  advisory deprecation, compulsory migration, removal, and recovery proof.
- New Pi runtime package `agent-booster-pack-contract-first@1.0.0` hosts
  the Interface Design Gate as a soft runtime check that pauses
  mutating tool calls when interface/contract intent appears without
  an approved gate packet. Pairs with the `whiteboarding` and
  `workflow` skills.
- New meta-package `agent-booster-pack` (Pi-installable) depends on
  `agent-booster-pack-skills`, `agent-booster-pack-contract-first`, and
  `agent-booster-pack-proof`. One-command install for the full ABP-on-Pi
  experience.
- `agent-booster-pack-whiteboard` now includes a Pi final-response guard that
  asks agents to explain what changed, why it is better than what came before,
  and what it enables next after implementation work.

### Changed

- BREAKING (Pi): `pi-agent-booster-pack` is renamed to
  `agent-booster-pack-skills`@5.0.0 and is skills-only — Pi runtime
  extensions live in sibling packages now. The old
  `pi-agent-booster-pack` npm name is deprecated pointing at the new
  name; existing installs keep working until upgrade.
- BREAKING (Pi): `pi-proof` is renamed to `agent-booster-pack-proof`@2.0.0
  and is now built/published from this monorepo at
  `agent-booster-pack-proof/` instead of the standalone `kreek/pi-proof`
  repo. The old `pi-proof` npm name is deprecated pointing at the new
  name; package contents are functionally unchanged.
- BREAKING: Skills are consolidated to reduce Codex skill-list context
  pressure: `git` + `commit` -> `git-workflow`, `deployment` +
  `versioning` -> `release`, `concurrency` + `realtime` +
  `background-jobs` -> `async-systems`, `caching` -> `performance`,
  and `testing` -> `proof`.
- ABP routing doctrine is now described as quality-driven and risk-triggered:
  `workflow` is the entry point, `proof` is both the completion gate and a
  proof-work skill, and other skills are peers selected by quality concern.
- ABP now treats durable interfaces as contract/API sign-off gates: agents
  must design the boundary, propose the contract, and get user approval
  before implementation continues. In practice this means more pause/approve
  loops than 4.12.0 — expect agents to stop on any new exported type, prop,
  schema, endpoint, or migration that crosses a module boundary. Internal-only
  exports and one-module refactors do not trip the gate.
- Adds `whiteboarding` skill: a mandatory pre-code artifact that maps current
  and proposed contracts (function signatures, schemas, events, CLI, config,
  types) and surfaces resolved decisions and open questions before any
  non-trivial change. `architecture` is now downstream of `whiteboarding`.
- Versioning guidance now treats optional additive public-surface changes as
  minor unless they force existing callers to change or accept new semantics;
  this guidance now lives in `release`.
- Workflow completion guidance now requires agents to explain what they changed,
  why it improves on the previous state, and/or what it enables next.
- Git workflow guidance now recommends a separate worktree when parallel
  work is expected, or when an in-flight branch has work that overlaps
  with or should stay separate from a new task; this guidance now lives
  in `git-workflow`.
- Skill frontmatter descriptions may now be up to 120 characters each, with a
  2,000-character pack-wide description budget enforced by the validator.
- `api` now treats continuation tokens such as cursors, page tokens, sync
  tokens, and resume tokens as caller input and requires explicit
  invalid-token behavior instead of silent position fallback.
- `workflow` now includes a documentation check in the completion loop, and
  `documentation` clarifies when explanatory comments should capture
  non-obvious why/how context without encouraging comment-count targets.
- ABP doctrine now explicitly says skills ride on host harnesses rather than
  replacing browser control, delegation, tool use, memory, planning, or
  system-prompt orchestration.
- `workflow` now separates internal ABP skill routing from user-facing
  readiness notes, so agents translate skills into domain lenses and exclude
  product scope instead of listing irrelevant tools.
- `documentation` now supports refining vague product ideas into problem,
  audience, smallest useful outcome, non-goals, assumptions, and proof before
  whiteboarding or implementation.
- `security`, `workflow`, `code-review`, and `refactoring` now make context
  trust and simplification guidance more concrete.
- Eval commands now use the Pi Do Eval **Bench**, **Regression**, and
  **Trial** vocabulary; the duplicate experiment command/scripts and config
  surface were removed.
- ABP eval suites now use Pi Do Eval's file-backed `eval/suites/*.yaml`
  workflow; `eval.config.ts` is limited to profile, Bench, judge, timeout,
  and budget policy.
- ABP eval trial metadata now lives in `eval/trials/*/trial.yaml`; generic
  Trial, Regression, and Bench runner code is provided by Pi Do Eval instead
  of project-local TypeScript.

### Fixed

- `agent-booster-pack` now exposes its dependency skills and runtime extensions
  through its Pi manifest, so `pi install npm:agent-booster-pack` activates the
  skills, Interface Design Gate, proof-first runtime, and whiteboarding guard in
  one install.
- `./setup.sh` now prunes legacy ABP-owned `~/.codex/skills/` links when the
  ABP Codex plugin is installed and warns that Codex can still duplicate ABP
  via direct `~/.agents/skills/` discovery if both install paths stay enabled.

## [2.2.0] (2026-04-26)

### Added

- `workflow` master entrypoint skill: load on every software
  engineering task, identify the risk profile, and select the narrower
  ABP skills that apply.
- Acceptance-clarity and branch-hygiene gates in the `workflow` skill
  flow, with matching tripwires.
- Requirements and acceptance criteria coverage in the `documentation`
  skill, plus a new `references/requirements-and-acceptance.md`.
- Codex plugin packaging under `plugin/.codex-plugin/`.
- API evolution reference in the `api` skill.
- `data-first` and `architecture` skills (extracted from the prior
  `domain-design` skill).
- `ui-design` skill (replacing the prior `frontend` skill).
- Skill anatomy validator at `scripts/validate_skill_anatomy.py` and
  pre-commit hook at `.githooks/pre-commit`.
- `LICENSE` (MIT), `CONTRIBUTING.md`, `SECURITY.md`, and this
  `CHANGELOG.md`.
- `license` and `keywords` fields in the Claude plugin manifests so
  marketplace listings have complete metadata.
- Release script at `scripts/release.sh` to bump every manifest
  version, promote `[Unreleased]` in the changelog, run validators,
  commit, and tag in one pass.

### Changed

- README repositioned: ABP is presented as ambient; agents use
  `workflow` automatically rather than via a `/`-style command.
- Documentation skill description and triggers expanded to cover
  PRDs, specs, user stories, and acceptance criteria.

### Removed

- `domain-design` skill (split into `data-first` and `architecture`).
- `frontend` skill (replaced by `ui-design`).
- `scripts/sync_agents_md.py` and its tests (replaced by the anatomy
  validator workflow).
