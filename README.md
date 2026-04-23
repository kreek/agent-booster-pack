# agent-config

Public dotfiles for agent instruction files and skills. Managed with
[GNU Stow](https://www.gnu.org/software/stow/).

Pairs with [dotfiles](https://github.com/alastair/dotfiles) for editor and
terminal config.

## What's here

- `agents/AGENTS.md` — cross-agent global instructions (source of truth; read by
  Codex and Claude Code)
- `agents/.claude/CLAUDE.md` — thin Claude Code wrapper (`@../AGENTS.md` +
  Claude-specific extensions)
- `agents/.agents/commands/` — cross-agent slash commands (fanned out to each
  agent by `setup.sh`)
- `agents/.agents/skills/` — 17 portable skills (Claude Code, Codex, Pi,
  OpenCode)

## Install

```sh
# From this repo root
stow agents

# Then run setup to wire cross-agent symlinks
./setup.sh
```

`stow agents` creates:

- `~/AGENTS.md` → this repo (read by Codex and Claude Code)
- `~/.claude/CLAUDE.md` → this repo (Claude-specific extensions)
- `~/.agents/skills/` → this repo
- `~/.agents/commands/` → this repo

`setup.sh` then fans out skills and commands to each agent:

- `~/.claude/skills/` → `~/.agents/skills/` (whole-directory symlink)
- Per-skill symlinks inside `~/.codex/skills/` (preserves marketplace skills)
- Per-command symlinks into `~/.claude/commands/` and `~/.codex/prompts/`

## Remove

```sh
stow -D agents
```

Manual cleanup of `~/.claude/skills/`, `~/.codex/skills/`,
`~/.claude/commands/*`, and `~/.codex/prompts/*` symlinks may be needed.

## Skills

| Skill                            | Tier | Trigger                                                            |
| -------------------------------- | ---- | ------------------------------------------------------------------ |
| `data-first-design`              | 1    | data modelling, immutability, parse-don't-validate, illegal states |
| `observability-for-services`     | 1    | logging, metrics, traces, SLOs, OTel                               |
| `api-design-backend`             | 1    | REST, gRPC, OpenAPI, versioning, webhooks                          |
| `distributed-systems-resilience` | 1    | retries, timeouts, circuit breakers, sagas, outbox                 |
| `database-safety`                | 1    | migrations, EXPLAIN, isolation levels, N+1, soft delete            |
| `security-review`                | 1    | auth, crypto, OWASP, secrets, supply chain                         |
| `testing-strategy`               | 1    | mocks vs fakes, mutation testing, property-based testing           |
| `git-workflow-depth`             | 1    | rebase, bisect, split commits, PR descriptions                     |
| `documentation`                  | 1    | READMEs, ADRs, runbooks, Diátaxis, doc rot, code comments          |
| `error-handling-patterns`        | 2    | Result/Either, error types, retry vs fail                          |
| `caching-strategies`             | 2    | cache-aside, stampede prevention, invalidation                     |
| `concurrency-patterns`           | 2    | locks, backpressure, actors, async traps                           |
| `performance-profiling`          | 2    | flame graphs, Amdahl, p99, micro-benchmark traps                   |
| `debugging-methodology`          | 2    | minimal repro, bisect, heisenbug, post-mortem                      |
| `refactoring-safely`             | 3    | characterization tests, Mikado, strangler fig                      |
| `deployment-and-cicd`            | 3    | pipelines, canary, feature flags, migration ordering               |
| `smart-commit`                   | —    | organizing dirty worktrees into clean commits                      |

## Adding a new skill

```sh
mkdir agents/.agents/skills/my-skill
cat > agents/.agents/skills/my-skill/SKILL.md << 'EOF'
---
name: my-skill
description: Use when [trigger]. [What it does]. [Key capabilities].
---

# My Skill
EOF

stow agents   # picks up the new directory
./setup.sh    # links it into ~/.codex/skills/
```

## Cross-agent compatibility

Skills use the [Agent Skills open standard](https://agentskills.io) (Dec 2025).
The YAML frontmatter works across Claude Code, Codex CLI, Pi, Cursor, Gemini
CLI, Windsurf, and OpenCode. Claude-specific fields (`allowed-tools`,
`when_to_use`, `paths`) are ignored by other agents per spec.
