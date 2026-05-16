# Contributing

Thanks for your interest in Agent Booster Pack. This file covers what you
need to know before opening a PR.

## Project conventions

- Read [`AGENTS.md`](AGENTS.md) and [`agents/AGENTS.md`](agents/AGENTS.md)
  before authoring or editing skills. They define the engineering
  defaults the skill bodies assume.
- Skills live under `agents/.agents/skills/<name>/SKILL.md`. The
  `plugin/skills/` tree is symlinked from there; edit the canonical
  copy only.
- Each skill must conform to the anatomy enforced by
  `scripts/validate-skill-anatomy.mjs`: frontmatter (name + description),
  `# Title`, `## When to Use`, `## When NOT to Use`, `## Verification`,
  optional `## Tripwires`, and any other sections the skill needs.
  Use the section ownership rules in `AGENTS.md` when choosing where content
  belongs.
- Keep skill descriptions concise (120 characters or fewer) and trigger-rich.
  Lead with verbs and named scenarios; avoid marketing language.
- Names of authors, books, papers, or external products belong in the
  `## References` section only, not in skill bodies or frontmatter.

## Skill body template

Use this order unless the skill has a clear reason to omit an optional section.
Insert skill-specific contract or template sections after `## Core Ideas` and
before `## Workflow`.

```md
---
name: kebab-case-name
description: Use when <trigger-focused scenarios>.
---

# Skill Title

## Iron Law

One non-negotiable rule, if the skill has one.

## When to Use

- Routing triggers only.

## When NOT to Use

- Routing exclusions and neighboring-skill handoffs only.

## Core Ideas

1. Durable judgment rules and mental models.
2. No ordered workflow steps, commands, examples, or completion checks.

## Workflow

1. Ordered actions the agent should take.
2. Apply Core Ideas without re-explaining them.

## Before Saying Done

1. Final completion gate, only when the skill needs one.
2. Latest request, final artifact/diff check, freshest proof, honest status.

## Verification

- [ ] Checks that audit the skill's output.
- [ ] No new doctrine appears here.

## Tripwires

- Take the concrete corrective action when the high-probability shortcut
  appears.
- Prefer positive instructions over negated warnings; move rare exceptions to
  references.

## Handoffs

- Use `neighbor-skill` when that skill owns the unresolved concern.

## References

- Deeper examples, recipes, citations, and ecosystem detail.
```

## Branching and commits

- Branch per change: `feature/`, `fix/`, `refactor/`, `chore/`, `docs/`.
- Never commit directly to `main` or `master`. The `.githooks/pre-commit`
  hook enforces this once enabled.
- Imperative-mood commit subjects, ≤72 characters, explain *why* not
  *what*. No AI-attribution trailers (`Co-Authored-By`,
  `Generated-by`, etc.).

## Local checks

Run before opening a PR:

```sh
make test
uv run refcheck . --no-color
node scripts/validate-skill-anatomy.mjs
```

The validator checks all 21 skills, the `plugin/skills/` symlinks, and
the Codex plugin manifest in one pass.

To enable the pre-commit hook locally:

```sh
git config core.hooksPath .githooks
```

## Pull requests

- One logical change per PR. Rebase onto the current `main` before
  opening.
- Reference any related issue and explain the engineering motivation.
  PR descriptions should make tradeoffs visible.
- New skills require: a clear risk profile, named tripwires, a
  verification checklist, and at least one handoff to an existing
  skill.

## Reporting bugs

Open an issue with: a short title, the agent runtime in use, the skill
involved, the prompt or scenario that reproduces the behavior, and the
observed vs. expected outcome.

## Security

Security disclosures go through the channel described in
[`SECURITY.md`](SECURITY.md), not public issues.

## After adding or renaming a skill

Run:

```sh
./setup.sh
```

This refreshes the per-agent symlink fan-out for manual installs and regenerates
the `plugin/skills/` mirror used by the Claude Code and Codex plugin builds. Pi
npm packages rebuild their `skills/` directories at `npm pack` time via each
package's `scripts/build-skills.mjs`; those bundles are gitignored.

Then update, as relevant:

- [`agents/AGENTS.md`](agents/AGENTS.md) — repo-maintainer skill index.
- [`workflow`](agents/.agents/skills/workflow/SKILL.md) — when routing for broad
  tasks changes.
- [`README.md`](README.md) — the human-facing skill list.
- Neighboring skills' `## Handoffs` sections — when the routing graph changes.
- [`.claude-plugin/marketplace.json`](.claude-plugin/marketplace.json) — per
  the pack-versioning rules in [`AGENTS.md`](AGENTS.md#pack-versioning-marketplacejson--pluginjson).
- [`.agents/plugins/marketplace.json`](.agents/plugins/marketplace.json) and
  [`plugin/.codex-plugin/plugin.json`](plugin/.codex-plugin/plugin.json) —
  when Codex plugin metadata or packaged skill content changes.
- `agent-booster-pack*/package.json` — when Pi package metadata, composition,
  or versions change.

## Local plugin development

For testing a local checkout as a plugin source. End users should use the
marketplace install commands in the README.

Claude Code:

```sh
/plugin install /path/to/agent-booster-pack/plugin
```

Codex:

```sh
codex plugin marketplace add /path/to/agent-booster-pack
```

The Claude Code plugin reads `plugin/.claude-plugin/plugin.json`; the Codex
plugin reads `plugin/.codex-plugin/plugin.json`. Both load the generated skill
mirror under `plugin/skills/`. Edit canonical skills under
`agents/.agents/skills/`, then run `./setup.sh` to refresh the mirror.
