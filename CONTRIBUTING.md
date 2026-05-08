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
  `# Title`, `## When to Use`, optional `## When NOT to Use`,
  `## Workflow`, `## Verification`, optional `## Tripwires`, `## Handoffs`,
  and a final `## References` if any names, books, or papers are cited.
- Keep skill descriptions concise (under ~100 words) and trigger-rich.
  Lead with verbs and named scenarios; avoid marketing language.
- Names of authors, books, papers, or external products belong in the
  `## References` section only, not in skill bodies or frontmatter.

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
