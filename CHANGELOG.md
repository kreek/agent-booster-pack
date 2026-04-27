# Changelog

All notable changes to Agent Booster Pack are recorded here. The format
follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and
the project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- Git workflow guidance now recommends a separate worktree when parallel
  work is expected, or when an in-flight branch has work that overlaps
  with or should stay separate from a new task.

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
