# Agent Booster Pack

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="assets/ABP_logo_header_dark.png">
    <source media="(prefers-color-scheme: light)" srcset="assets/ABP_logo_header_light.png">
    <img src="assets/ABP_logo_header_light.png" alt="Comic-style Agent Booster Pack header: a robot launching from a booster-pack package beside the headline 'Up-level your coding agents' and a panel describing practical guidance for simpler, evidence-backed, accessible, production-grade software.">
  </picture>
</p>

A portable set of high-leverage, general-purpose skills for leveling up coding
agents, with strong defaults for building, changing, testing, reviewing, and
operating web applications and services.

Agent Booster Pack distills my 25 years of software engineering experience, from
startups to large private and public sector organizations, into portable skills
for agents that understand the Agent Skills layout, including Codex, Claude
Code, Pi, Cursor, Gemini CLI, GitHub Copilot CLI, OpenCode, and Windsurf. It
raises engineering maturity by pushing agents toward simpler designs, explicit
data models, proven behavior, safer production systems, intuitive and accessible
interfaces, and clear, scoped changes a human can review and maintain.

In practice, ABP steers agents to:

- Get the data model right first: make values, states, and invariants explicit,
  limit side effects, and push state changes to the boundaries.
- Replace "looks right" with proof from tests, contracts, logs, and
  caller-visible checks.
- Plan past launch and harden beyond the MVP: observability, reliability,
  deployment safety, and rollback planning.
- Treat security, data safety, and accessibility as engineering requirements,
  not optional polish.
- Debug and change code from the root cause, not the symptom.
- Package work into scoped, reviewable changes a human can trust and maintain.

## Install

Prerequisites:

- Git.
- GNU Stow.

Install Stow if needed:

```sh
# macOS
brew install stow

# Debian / Ubuntu
sudo apt install stow

# Fedora
sudo dnf install stow
```

Fresh checkout and install:

```sh
git clone https://github.com/kreek/agent-booster-pack.git
cd agent-booster-pack
stow --target="$HOME" agents
./setup.sh
```

`stow --target="$HOME" agents` is the main install step. It links the repo's
`agents/` package into your home directory, so the checkout can live anywhere:

- `~/AGENTS.md`
- `~/.agents/skills/`
- `~/.agents/commands/`
- `~/.claude/CLAUDE.md`

`./setup.sh` is the compatibility step. It does not install Stow, clone the
repo, or merge instruction files. It adds tool-specific symlinks for agents that
do not rely only on `~/.agents/skills/`:

- `~/.claude/skills/` points at `~/.agents/skills/`
- `~/.codex/skills/<name>/` links each portable skill individually
- `~/.codeium/windsurf/skills/<name>/` links each skill when Windsurf is present

`./setup.sh` does **not** fan out command files to `~/.claude/commands/` or
`~/.codex/prompts/`. Modern agents register slash commands directly from each
skill's `SKILL.md` frontmatter, and the extra fan-out produced duplicate
`/<name>` entries in Claude Code's command list. If you previously installed
ABP and have stale symlinks under `~/.claude/commands/<name>.md` or
`~/.codex/prompts/<name>.md` that point at `~/.agents/commands/`, re-run
`./setup.sh` and they will be pruned automatically.

It also keeps the in-repo Claude Code plugin (`plugin/`) in sync with the
source-of-truth skills when `uv` is available. Published checkouts already ship
the plugin symlinks, so end-user installs do not need Python or uv.

## Install for Claude Code (namespaced)

The flat `~/.claude/skills/` symlink above gives Claude Code unprefixed slash
commands like `/frontend` and `/security`. To get the same behaviour Codex
already uses (`ABP:` prefix), install ABP as a Claude Code plugin instead:

```sh
# Inside Claude Code:
/plugin marketplace add kreek/agent-booster-pack
/plugin install abp@abp
```

Slash commands then namespace as `/abp:frontend`, `/abp:security`, `/abp:testing`,
etc. — the prefix protects against name clashes with built-in or third-party
plugin skills.

For local development against a working tree, point `/plugin install` at the
repo's `plugin/` directory:

```sh
/plugin install /path/to/agent-booster-pack/plugin
```

After installing the plugin, drop the legacy whole-directory symlink if you want
only the namespaced commands and no duplicates:

```sh
rm ~/.claude/skills        # only if it is a symlink to ~/.agents/skills
```

The plugin and the flat symlink can coexist — they will simply both appear in
`/help` listings, prefixed and unprefixed respectively.

`stow --target="$HOME" agents` does not merge files. If `~/AGENTS.md` already
exists as a real file, Stow will report a conflict instead of appending the
Agent Booster Pack instructions. Do not use `stow --adopt` unless you
intentionally want Stow to take ownership of that file.

For an existing personal `~/AGENTS.md`, merge deliberately:

1. Keep any personal or workplace-specific rules that are still current.
2. Add the skill index and priority rules from `agents/AGENTS.md`.
3. Preserve the ABP rule that local project `AGENTS.md` files are additive and
   more specific, but must not weaken safety, proof, validation, or
   user-change-preservation requirements.
4. Run `stow --target="$HOME" --ignore='^AGENTS\.md$' agents` so
   `~/.agents/skills/`, `~/.agents/commands/`, and `~/.claude/CLAUDE.md` are
   still linked while your existing `~/AGENTS.md` remains manually maintained.
5. Run `./setup.sh` so tool-specific compatibility links are created from those
   shared `~/.agents` links.

Maintainers with `uv` can optionally use `scripts/sync_agents_md.py` to test or
refresh a fenced ABP block in a personal `AGENTS.md`; that script is not part of
the end-user install path.

Codex discovers skills directly from `.agents/skills` / `~/.agents/skills`
and namespaces them as `ABP:<name>`; ABP no longer fans skills out to
`~/.codex/prompts`.

GitHub Copilot CLI, [Pi][pi-skills], Cursor, Gemini CLI, and OpenCode
auto-discover from `~/.agents/skills/`, so the `stow --target="$HOME" agents`
link is enough — no extra `setup.sh` wiring needed. Copilot also scans
`~/.copilot/skills` and `~/.claude/skills`; the pack deliberately leaves
`~/.copilot/skills` unlinked so skills are not registered twice. For
project-scoped Copilot skills, drop a `.github/skills/`, `.claude/skills/`, or
`.agents/skills/` directory in the repo itself.

## Skill System

Skills are progressive context: agents see only `name` and `description` until a
task triggers a skill, then load the matching `SKILL.md` for the sharper rule,
workflow, and proof check needed for the work in front of them.

You can invoke a skill directly when you want a specific lens, or make a
natural-language request and let the agent choose the relevant skills from their
descriptions.

The skill pack is deliberately not a checklist library. It is a set of
discipline-enforcing lenses, grouped by the kind of engineering pressure they
apply:

### Foundational design

- [`domain-design`][skill-domain-design]: domain data, state transitions,
  invariants, effects, module boundaries, and domain/feature locality.
- [`proof`][skill-proof]: explicit proof obligations for behavior, contracts,
  invariants, root causes, and refactor safety.

### Correctness and change

- [`code-review`][skill-code-review]: risk-focused review of diffs, branches, PRs,
  requested changes, and agent-generated code.
- [`testing`][skill-testing]: behavior-focused tests that prove caller-visible
  contracts without overspecifying implementation.
- [`debugging`][skill-debugging]: root-cause investigation for bugs, flakes,
  regressions, and unexplained symptoms.
- [`refactoring`][skill-refactoring]: structure changes that preserve behavior
  while improving clarity or migration paths.
- [`error-handling`][skill-error-handling]: error types, propagation, retries,
  remote-call timeouts, circuit breakers, recovery, crash boundaries, and
  user-facing messages.

### Safety gates

- [`security`][skill-security]: authentication, authorization, secrets,
  cryptography, input validation, and trust boundaries.
- [`database`][skill-database]: schemas, migrations, indexes, queries,
  transactions, transactional outbox, deletion semantics, and production data
  access.
- [`deployment`][skill-deployment]: CI/CD, rollout strategy, rollback paths,
  feature flags, and deploy-time coordination.

### Production quality

- [`observability`][skill-observability]: logs, metrics, traces, dependency
  health, health checks, dashboards, SLOs, alerts, and telemetry quality.
- [`realtime`][skill-realtime]: event streams, live updates, pub/sub,
  subscriptions, delivery guarantees, ordering, and replay.
- [`background-jobs`][skill-background-jobs]: async workers, schedulers,
  retries, job payloads, dead jobs, queue priority, and worker failure
  visibility.
- [`concurrency`][skill-concurrency]: async, threads, actors, channels, locks,
  cancellation, queues, and backpressure.
- [`performance`][skill-performance]: latency, throughput, p99s, CPU, memory,
  allocations, I/O, and resource saturation.
- [`caching`][skill-caching]: cache strategy, invalidation, stampede prevention,
  Redis, Memcached, CDNs, and stale data.

### Public/user surfaces

- [`api`][skill-api]: HTTP APIs, OpenAPI, status codes, pagination, idempotency,
  rate limits, versioning, and webhooks.
- [`documentation`][skill-documentation]: READMEs, ADRs, runbooks, reference
  docs, tutorials, and explanatory comments.
- [`frontend`][skill-frontend]: pages, components, interaction flows, responsive
  layout, visual design, and component states.
- [`accessibility`][skill-accessibility]: WCAG, semantic HTML, ARIA, keyboard
  navigation, focus, contrast, forms, and inclusive UI.

### Project and repo workflow

- [`git`][skill-git]: rebases, conflict resolution, bisects, history recovery,
  branch cleanup, and PR history.
- [`commit`][skill-commit]: working-tree grouping, commit splits, concise commit
  messages, and approved commits.
- [`versioning`][skill-versioning]: version bumps, CHANGELOG hygiene,
  deprecation policy, breaking-change classification, and release tags.
- [`scaffolding`][skill-scaffolding]: new projects, baseline tooling,
  package-manager defaults, test runners, linting, and CI. It includes
  opinionated defaults for TypeScript APIs on Cloudflare Workers with Hono,
  larger frontend apps with SvelteKit, quick-to-build typed Python APIs with
  FastAPI and the Python ecosystem, or high-performance Rust web services with
  Axum.

[skill-accessibility]: agents/.agents/skills/accessibility/SKILL.md
[skill-api]: agents/.agents/skills/api/SKILL.md
[skill-background-jobs]: agents/.agents/skills/background-jobs/SKILL.md
[skill-caching]: agents/.agents/skills/caching/SKILL.md
[skill-commit]: agents/.agents/skills/commit/SKILL.md
[skill-concurrency]: agents/.agents/skills/concurrency/SKILL.md
[skill-domain-design]: agents/.agents/skills/domain-design/SKILL.md
[skill-database]: agents/.agents/skills/database/SKILL.md
[skill-debugging]: agents/.agents/skills/debugging/SKILL.md
[skill-deployment]: agents/.agents/skills/deployment/SKILL.md
[skill-documentation]: agents/.agents/skills/documentation/SKILL.md
[skill-error-handling]: agents/.agents/skills/error-handling/SKILL.md
[skill-frontend]: agents/.agents/skills/frontend/SKILL.md
[skill-git]: agents/.agents/skills/git/SKILL.md
[skill-observability]: agents/.agents/skills/observability/SKILL.md
[skill-performance]: agents/.agents/skills/performance/SKILL.md
[skill-proof]: agents/.agents/skills/proof/SKILL.md
[skill-realtime]: agents/.agents/skills/realtime/SKILL.md
[skill-refactoring]: agents/.agents/skills/refactoring/SKILL.md
[skill-code-review]: agents/.agents/skills/code-review/SKILL.md
[skill-scaffolding]: agents/.agents/skills/scaffolding/SKILL.md
[skill-security]: agents/.agents/skills/security/SKILL.md
[skill-testing]: agents/.agents/skills/testing/SKILL.md
[skill-versioning]: agents/.agents/skills/versioning/SKILL.md
[pi-skills]: https://www.mintlify.com/badlogic/pi-mono/coding-agent/skills

## Authoring Rules

See the repo-root [`AGENTS.md`](AGENTS.md#skill-anatomy-enforced-by-the-validator)
for the canonical skill anatomy, authoring rules, and pack-versioning policy.

## Maintenance

After adding or renaming a skill:

```sh
./setup.sh
```

This reruns the per-agent symlink fan-out and the plugin sync (so
`plugin/skills/<new-name>` is created and stale links are pruned). The
`scripts/validate_skill_anatomy.py` script enforces the same drift check, so a
plugin out of sync with `agents/.agents/skills/` will fail validation.

Then update:

- `agents/AGENTS.md` so agents can route to it
- this README so humans understand the pack
- any neighboring skills' handoffs when routing changes
- `.claude-plugin/marketplace.json` per the pack-versioning rules in the
  repo-root [`AGENTS.md`](AGENTS.md#pack-versioning-marketplacejson) — the
  version in the canonical AGENTS.md block is what
  `scripts/sync_agents_md.py` shows users on update

Run the Python checks before publishing script updates:

```sh
uv run pytest
uv run ruff format --check .
uv run ruff check .
uv run refcheck . --no-color
```

Use `uv run ruff format .` only when you intend to rewrite Python formatting in
the repo. `refcheck` skips remote URLs unless `--check-remote` is passed, so the
default command validates local Markdown links and anchors deterministically.

## Remove

```sh
stow --target="$HOME" -D agents
```

Manual cleanup may still be needed for tool-specific symlinks under
`~/.claude/skills/`, `~/.codex/skills/`, and `~/.codeium/windsurf/skills/`. If you installed the Claude Code
plugin, also run `/plugin uninstall abp@abp` and (optionally)
`/plugin marketplace remove abp` from inside Claude Code.
