# AGENTS.md

This file provides guidance to coding agents (Claude Code, Codex, Cursor, and
others that read `AGENTS.md`) when working with code in this repository.

The skill-pack doctrine in [`agents/AGENTS.md`](agents/AGENTS.md) (priority
rules, proof obligations, code-and-data discipline, user-change
preservation) also governs work in this repo. Read it alongside this
file; the two are additive.

## What this repo is

Agent Booster Pack is a portable skill pack for coding agents (Claude Code,
Codex, Cursor, Copilot, Gemini CLI, OpenCode, Pi, Windsurf). It ships
prose (`SKILL.md` files plus a few maintenance helpers), not application code.
Most edits are to skill bodies, the top-level `AGENTS.md` index, or the
`README.md`. There is no application build or service to run; tests cover
repo maintenance helpers, plugin packaging, and extension packages.

## Source of truth and mirrors

- **Canonical skills**: `agents/.agents/skills/<name>/SKILL.md`. Every skill
  lives here; siblings may add `agents/`, `references/`, and `scripts/`.
- **Top-level index**: `agents/AGENTS.md`. Lists every skill with a one-line
  trigger for repo-maintainer reference. Normal ABP use relies on skill
  frontmatter, plugin metadata, and the `workflow` skill; users do not need to
  install or merge system instruction files.
- **Claude Code plugin mirror**: `plugin/skills/<name>` contains generated
  copies of canonical skills from `agents/.agents/skills/<name>`.
  `.claude-plugin/marketplace.json` points Claude Code at the `plugin/` root,
  where `plugin/.claude-plugin/plugin.json` exposes namespaced
  `/abp:<skill>` slash commands.
- **Codex plugin package**: `.agents/plugins/marketplace.json` points Codex at
  the `plugin/` root, and `plugin/.codex-plugin/plugin.json` exposes the same
  generated skill mirror to Codex as a plugin. Keep the Codex marketplace and
  manifest in sync with Claude plugin packaging.
- **Install layout**: `agents/` is a GNU Stow package. `./setup.sh` is the
  one-click local installer: it explains the actions, asks for approval, runs
  Stow to link the shared skills under `~/.agents/`, fans those out to
  per-tool locations, prunes manual Codex links when the ABP Codex plugin is
  installed, and re-runs the plugin-sync. System `AGENTS.md` / `CLAUDE.md`
  files are not part of ABP installation.

When you add, rename, or delete a skill, the canonical file under
`agents/.agents/skills/` is the only place to write. Everything else is
regenerated.

## Common commands

```sh
# Re-run the local installer and per-tool fan-out after a
# skill is added / renamed / removed. Idempotent.
./setup.sh

# Refresh the generated plugin skill mirror.
node scripts/generate-plugin-symlinks.mjs

# Validate every SKILL.md against the playbook anatomy (frontmatter,
# required sections, no inline expert attribution), plugin/ drift, and
# Codex plugin marketplace/manifest shape. Run this before publishing
# skill changes.
node scripts/validate-skill-anatomy.mjs

# Validate local Markdown links and anchors. Remote URL checks are omitted by
# default so this stays deterministic for local development.
uv run refcheck . --no-color

# Self-test the validator itself (uses a tmp dir of fixtures).
node scripts/validate-skill-anatomy.mjs --self-test

# Repo-owned tests.
npm test
```

There is no product application test suite; repo-level Vitest, the anatomy
validator, and `refcheck` are maintenance checks. Treat clean Vitest,
`validate-skill-anatomy.mjs`, and `refcheck` commands as the bar for script
changes.

## Validation scope and token discipline

Run the narrowest check that proves the touched surface first. Broaden only
when the changed files require it or the narrow check exposes cross-package
risk.

- Pi runtime extension changes under `agent-booster-pack/extensions/` or
  `agent-booster-pack/test/`: run `cd agent-booster-pack && npm test`.
- Canonical skill prose changes: run `node scripts/validate-skill-anatomy.mjs`
  and targeted `cmp` checks for the changed skill mirrors. Use root `npm test`
  only when sibling package mirrors, packaging scripts, or repo tests changed.
- Markdown link/doc-wide changes: run `uv run refcheck . --no-color` only when
  links or broad docs moved. Do not run it for ordinary runtime or narrow skill
  edits.
- Release/package metadata changes: run the release/package checks that match
  the edited manifests, locks, or plugin metadata. Do not treat implementation
  approval as approval to add release-prep edits.
- After compaction, read only the files needed for the current slice. Avoid
  replaying long session history, broad diffs, or full validators to rebuild
  context unless the next action depends on them.

If a command prints hundreds of lines, stop repeating it. Summarize the failed
check and switch to a narrower command or exact file inspection.

## Skill anatomy (enforced by the validator)

Every `SKILL.md` must have:

- Frontmatter with kebab-case `name:` and a trigger-focused `description:`
  no longer than 120 characters, and the pack-wide canonical description total
  must stay under 2,000 characters, because agents may load every description
  before selecting a skill body.
- Required sections: `## When to Use`, `## When NOT to Use`,
  `## Verification`.
- Optional section: `## Tripwires` when a skill has known agent failure modes.
  Use a table with `Trigger`, `Do this instead`, and `False alarm` columns.
  Phrase rows as implementation intentions, not scolding: when this shortcut
  thought appears, take this concrete next action. Do not add tripwires as
  anatomy filler; omit the section when no row pays for its tokens.
- No inline `per <Expert Name>` attribution outside a `## References` or
  `## Canon` section: move citations there.
- Put references to people, books, talks, papers, videos, and YouTube links in
  `## References`, `## Canon`, or a `references/` file, not in frontmatter or
  the steering body. Skill bodies should spend tokens on agent behavior, not
  provenance.

Plus the README's authoring rules: keep skills short and directive. A
`SKILL.md` is steering context, not a book: every paragraph competes with the
repo, diff, user request, and proof evidence for the agent's attention. The
body should answer only when to use the skill, what rule/workflow to follow,
and how to verify the result. Lead with an Iron Law when one exists, route to
neighbours via `Handoffs` instead of duplicating their bodies, push
deterministic checks into `scripts/`, and move nuance, citations, examples, and
deep ecosystem notes into targeted `references/` files that are loaded only
when needed.

Write skill prose in short, plain sentences. Prefer concrete verbs and familiar
words. If a sentence needs rereading, split it. If a heading names an abstract
process, rewrite it as the action the agent should take. Do not use ornate or
literary phrasing when direct engineering language will do.

For `agents/.agents/skills/code-review/references/<language>.md`, do not
duplicate anything a linter, formatter, type checker, syntax checker, or
compiler already catches. Those files should focus on high-signal review risks:
semantic bugs, unsafe edge cases, framework traps, missing proof, and patterns
that automated tooling routinely misses. Make language advice conditional on
the repo's declared runtime, framework, and compatibility policy; never suggest
syntax or libraries that would break supported versions. When naming testing
expectations, steer toward the ecosystem's behavior/spec-flavored test library
when one is available, such as RSpec for Ruby or Vitest/Jest `describe`/`it`
suites for TypeScript, because review evidence should describe caller-visible
behavior.

## When skill changes ripple

Adding or renaming a skill needs four updates, in order:

1. Canonical files under `agents/.agents/skills/<name>/` (and a test that
   the body satisfies the validator's required sections).
2. `agents/AGENTS.md`: add the routing line under the right grouping
   (Foundational Design / Safety Gates / Correctness And Change Control /
   Production Quality / Communication And UX / Workflow) for maintainer
   reference.
3. `README.md`: update the human-facing skill list and its
   `[skill-<name>]:` reference link at the bottom.
4. `workflow`: update the meta-skill only when the new or renamed skill changes
   the broad ABP routing workflow.
5. `./setup.sh` to regenerate `plugin/skills/<name>` and refresh or prune
   per-agent manual-install links. The validator's drift check fails CI/local
   runs if step 5 is skipped.

Neighbouring skills may need their `Handoffs` updated when routing
changes. Do not duplicate skill prose between files.

## Pack versioning (`marketplace.json` / `plugin.json`)

The pack publishes a single semantic version in
`.claude-plugin/marketplace.json` (both `metadata.version` and the
`plugins[0].version`), `plugin/.claude-plugin/plugin.json`, and
`plugin/.codex-plugin/plugin.json`. Bump all of them together when canonical
content changes so plugin managers see the same package version.

| Bump | Trigger |
|---|---|
| **major** (X.0.0) | Skill renamed or removed; an Iron Law or non-negotiable rule reversed; `agents/AGENTS.md` priority order rearranged; anything that changes what agents will refuse vs accept |
| **minor** (1.X.0) | New skill added; new reference file under `references/`; new section in an existing `SKILL.md`; doctrine clarified or strengthened without reversal; new tooling expectation that's strictly additive |
| **patch** (1.0.X) | Typos, link fixes, formatting, internal re-flow that doesn't change meaning |

Bump in the same PR as the canonical edit; both `version` fields move
together. Pre-1.0 (`0.x.y`) is reserved for early development and
follows the same shape, but minor bumps may carry breaking changes;
the pack is past that and should not regress to it.

## Conventions specific to this repo

- No commits to `main`. Use `feature/`, `fix/`, `refactor/`, `chore/`
  branches.
- Markdown, JavaScript, and TypeScript are the repo-owned languages. Use
  Vitest for repo-owned JS/TS tests and `refcheck` for local Markdown link
  validation. Keep Markdown prose manually formatted; do not add a docs
  formatter.
- Do not add author-attribution trailers (`Co-Authored-By`,
  `Generated by`) to commits.
