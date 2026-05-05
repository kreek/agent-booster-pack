# Changelog

All notable changes to Agent Booster Pack are recorded here. The format
follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and
the project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- `scaffolding` now ships a `java/service-quarkus` Backstage stack template
  for native-ready JVM services with Quarkus REST, CDI, Gradle, JUnit 5,
  RestAssured, Panache, observability, auth, scheduler, and native-image
  choices.
- `workflow` now includes a version-verified implementation reference for
  version-sensitive framework, library, runtime, and platform work.
- `release` now includes a deprecation and migration reference covering
  advisory deprecation, compulsory migration, removal, and recovery proof.

### Changed

- BREAKING: Skills are consolidated to reduce Codex skill-list context
  pressure: `git` + `commit` -> `git-workflow`, `deployment` +
  `versioning` -> `release`, `concurrency` + `realtime` +
  `background-jobs` -> `async-systems`, `caching` -> `performance`,
  and `testing` -> `proof`.
- ABP routing doctrine is now described as quality-driven and risk-triggered:
  `workflow` is the entry point, `proof` is both the completion gate and a
  proof-work skill, and other skills are peers selected by quality concern.
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
- `documentation` now supports refining vague product ideas into problem,
  audience, smallest useful outcome, non-goals, assumptions, and proof before
  whiteboarding or implementation.
- `security`, `workflow`, `code-review`, and `refactoring` now make context
  trust and simplification guidance more concrete.

### Fixed

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
