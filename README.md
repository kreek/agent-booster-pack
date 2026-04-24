# Coding Agent Booster Pack

A portable set of high-leverage skills for leveling up coding agents.

This is the source of truth for how coding agents should reason, change code,
prove correctness, and package work across Codex, Claude Code, and other agents
that understand the Agent Skills layout. Each skill is opened only when the task
calls for it; the right draw gives the agent a sharper rule, workflow, and proof
check for the work in front of it.

The core philosophy is:

- data first: design values, states, invariants, and effects before abstractions
- proof first: every meaningful engineering claim needs evidence
- behavior first: tests enter through the boundary a caller actually uses
- safety first: security, data loss, deploy risk, and production reliability
  outrank style and local habit
- small changes: one root cause, one logical behavior, one clean commit

## Repository Shape

- `agents/AGENTS.md` is the global instruction file and skill index.
- `agents/.agents/skills/` contains portable skills for engineering judgment,
  proof obligations, testing, safety, production quality, UX, and workflow.
- `agents/.agents/commands/` contains cross-agent command prompts where a tool
  still supports command fan-out.
- `agents/.claude/CLAUDE.md` is a thin Claude Code wrapper around `AGENTS.md`.
- `setup.sh` wires skills and commands into tool-specific locations.

## Install

```sh
stow agents
./setup.sh
```

`stow agents` links the shared instruction and skill roots:

- `~/AGENTS.md`
- `~/.agents/skills/`
- `~/.agents/commands/`
- `~/.claude/CLAUDE.md`

`setup.sh` adds tool-specific compatibility links:

- `~/.claude/skills/` points at `~/.agents/skills/`
- `~/.codex/skills/<name>/` links each portable skill individually
- `~/.codeium/windsurf/skills/<name>/` links each skill when Windsurf is present
- `~/.claude/commands/<name>.md` links command prompts
- `~/.codex/prompts/<name>.md` is kept for legacy Codex prompt-command support

Codex now discovers skills directly from `.agents/skills` / `~/.agents/skills`;
do not rely on `~/.codex/prompts` for slash commands in current Codex CLI.

## Skill System

Skills are progressive context. Agents see only `name` and `description` until a
skill triggers, then load the matching `SKILL.md`, and only read references or
run scripts when the skill asks for them.

The skill pack is deliberately not a checklist library. It is a set of
discipline-enforcing lenses:

| Area                      | Skills                                                                                              |
| ------------------------- | --------------------------------------------------------------------------------------------------- |
| Foundational design       | `data-first-design`, `proof-driven-engineering`                                                     |
| Correctness and change    | `behavior-testing`, `debugging-methodology`, `refactoring-safely`, `error-handling-patterns`        |
| Safety gates              | `security-review`, `database-safety`, `deployment-and-cicd`, `distributed-systems-resilience`       |
| Production quality        | `observability-for-services`, `concurrency-patterns`, `performance-profiling`, `caching-strategies` |
| Public/user surfaces      | `api-design`, `documentation`, `frontend-design`                                                    |
| Project and repo workflow | `scaffolding`, `git-workflow-depth`, `smart-commit`                                                 |

The most important addition is `proof-driven-engineering`: if an agent asserts a
behavior, invariant, contract, root cause, or refactor-safety claim, it must
name the proof obligation and evidence. Missing evidence is reported as
unproven, not complete.

## Authoring Rules

Every skill should be short, directive, portable, and hard to skip:

- Use portable frontmatter: `name` plus a trigger-focused `description`.
- Put discriminating trigger words in the description; the body loads only after
  the skill triggers.
- State one Iron Law near the top when the skill has a non-negotiable rule.
- Include `When to Use` and `When NOT to Use` so neighboring skills do not blur
  together.
- Use imperative workflow steps; do not write background essays.
- Require evidence in `Verification`; unchecked proof obligations mean the work
  is reported as unproven.
- Use `Handoffs` to route to neighboring skills instead of duplicating their
  bodies.
- Put deterministic or fragile checks in `scripts/` so agents run them instead
  of re-deriving them.
- Put deeper reference material in `references/`; keep each referenced file one
  hop from `SKILL.md`.
- Delete stale or duplicative prose instead of preserving it as "context."

## Maintenance

After adding or renaming a skill:

```sh
./setup.sh
```

Then update:

- `agents/AGENTS.md` so agents can route to it
- this README so humans understand the pack
- any neighboring skills' handoffs when routing changes

Run the markdown check before publishing broad doc updates:

```sh
pnpm format:check
```

Use `pnpm format` only when you intend to rewrite all markdown formatting in the
repo.

## Remove

```sh
stow -D agents
```

Manual cleanup may still be needed for tool-specific symlinks under
`~/.claude/skills/`, `~/.codex/skills/`, `~/.codeium/windsurf/skills/`,
`~/.claude/commands/`, and `~/.codex/prompts/`.
