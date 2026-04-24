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
- `agents/.agents/skills/` — 18 portable skills, auto-discovered by every coding
  agent that honours the [agentskills.io](https://agentskills.io) open standard

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

`setup.sh` then fans out skills and commands to each agent. Two classes:

**Needs per-tool symlinks** (tool looks in its own home dir, not `~/.agents/`):

- `~/.claude/skills/` → `~/.agents/skills/` (whole-directory symlink)
- `~/.codex/skills/<name>/` — per-skill symlinks (preserves marketplace skills)
- `~/.codeium/windsurf/skills/<name>/` — per-skill, wired only if Windsurf is
  installed

**Auto-discovers from `~/.agents/skills/`** (no extra wiring — stow alone is
enough):

- Pi (`pi-mono`) — reads `~/.agents/skills/` natively
- Cursor — reads `~/.agents/skills/` natively
- Gemini CLI — reads `~/.agents/skills/` natively
- OpenCode — reads `~/.agents/skills/` natively

Commands fan out to `~/.claude/commands/` and `~/.codex/prompts/`.

## Remove

```sh
stow -D agents
```

Manual cleanup of `~/.claude/skills/`, `~/.codex/skills/`,
`~/.codeium/windsurf/skills/`, `~/.claude/commands/*`, and `~/.codex/prompts/*`
symlinks may be needed.

## Skills

| Skill                            | Tier | Trigger                                                                       |
| -------------------------------- | ---- | ----------------------------------------------------------------------------- |
| `data-first-design`              | 1    | data modelling, immutability, parse-don't-validate, illegal states            |
| `observability-for-services`     | 1    | logging, metrics, traces, SLOs, OTel                                          |
| `api-design`                     | 1    | REST, OpenAPI, versioning, errors, pagination, idempotency, auth              |
| `distributed-systems-resilience` | 1    | retries, timeouts, circuit breakers, sagas, outbox                            |
| `database-safety`                | 1    | migrations, EXPLAIN, isolation levels, N+1, soft delete                       |
| `security-review`                | 1    | auth, crypto, OWASP, secrets, supply chain                                    |
| `behavior-testing`               | 1    | describe/context/it, what not to test, mock at edges, spec-style              |
| `git-workflow-depth`             | 1    | rebase, bisect, split commits, PR descriptions                                |
| `documentation`                  | 1    | READMEs, ADRs, runbooks, Diátaxis, doc rot, code comments                     |
| `error-handling-patterns`        | 2    | Result/Either, error types, retry vs fail                                     |
| `caching-strategies`             | 2    | cache-aside, stampede prevention, invalidation                                |
| `concurrency-patterns`           | 2    | locks, backpressure, actors, async traps                                      |
| `performance-profiling`          | 2    | flame graphs, Amdahl, p99, micro-benchmark traps                              |
| `debugging-methodology`          | 2    | minimal repro, bisect, heisenbug, post-mortem                                 |
| `refactoring-safely`             | 3    | characterization tests, Mikado, strangler fig                                 |
| `deployment-and-cicd`            | 3    | pipelines, canary, feature flags, migration ordering                          |
| `frontend-design`                | 3    | Swiss/Bauhaus/Rams, OKLCH, WCAG 2.2, motion, design tokens, AI-look antidotes |
| `smart-commit`                   | —    | organizing dirty worktrees into clean commits                                 |

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
./setup.sh    # links it into ~/.codex/skills/ and any other per-tool paths
```

## Cross-agent compatibility

Skills use the [Agent Skills open standard](https://agentskills.io) (Dec 2025).
The YAML frontmatter works across Claude Code, Codex CLI, Pi, Cursor, Gemini
CLI, Windsurf, and OpenCode. Claude-specific fields (`allowed-tools`,
`when_to_use`, `paths`) are ignored by other agents per spec.

### Skill authoring

See [`SKILLS_BEST_PRACTICES.md`](SKILLS_BEST_PRACTICES.md) for the authoring
checklist — frontmatter shape, description trigger quality, progressive
disclosure via `references/`, directive-body style, and the pre-ship
verification list.
