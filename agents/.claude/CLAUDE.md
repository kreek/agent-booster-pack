@../AGENTS.md

## Claude Code

### Plan Mode
Enter Plan Mode before changes touching more than 3 files, schema/migration work, or auth changes. Write a short plan, wait for confirmation, then execute.

### Subagents
Spawn a subagent (via the Agent tool) for:
- Open-ended codebase exploration spanning many files
- Research that would otherwise consume excessive context
- Tasks that can run in parallel without dependencies

### Memory
Auto-memory lives at `~/.claude/projects/*/memory/`. Write a memory when you learn a non-obvious preference, project constraint, or cross-session fact. Read `MEMORY.md` at the start of relevant sessions.

### Skills
Skills live in `~/.claude/skills/` (symlinked from `~/.agents/skills/`). Prefer triggering the relevant skill over re-deriving its playbook from scratch.

### MCP Servers
- `manifest` (localhost:17010): document purpose here when known.
