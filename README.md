# Agent Booster Pack

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="assets/ABP_logo_header_dark.png">
    <source media="(prefers-color-scheme: light)" srcset="assets/ABP_logo_header_light.png">
    <img src="assets/ABP_logo_header_light.png" alt="Comic-style Agent Booster Pack header: a robot launching from a booster-pack package beside the headline 'Up-level your coding agents' and a panel describing practical guidance for simpler, evidence-backed, accessible, production-grade software.">
  </picture>
</p>

A portable skill library for using coding agents to write more effective,
correct, safe, accessible, maintainable, and performant software.

Agent Booster Pack distills my 25 years of software engineering experience, from
startups to large private and public sector organizations, into portable skills
for agents that understand the Agent Skills layout, including Codex, Claude
Code, Pi, Cursor, Gemini CLI, GitHub Copilot CLI, OpenCode, and Windsurf. It
raises engineering maturity by giving agents a workflow for simpler designs,
explicit data models, proven behavior, safer production systems, intuitive and
accessible interfaces, and clear, scoped changes a human can review and
maintain.

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

## How ABP Is Different

ABP is built for risk management in human-in-the-loop software work. The goal is
straightforward: help agent-written code meet the high bar for production use. It
treats the agent as a coding partner, not a human replacement. Humans are good
at judgment, review, tradeoffs, ownership, and bringing the full context needed
to make choices during iteration, so the skills steer agents toward scoped
changes, explicit evidence, and reviewable decisions instead of trying to remove
you from the loop.

It also assumes coding agents already know how to code. Planning is built in,
and syntax should be handled by linters, formatters, type checkers, and test
suites. Skills do not need to handle those things. ABP works with coding agents
through progressive enhancement: focused skills add the missing engineering pressure
at the moment it matters, without trying to rewire the agent's internals.

## Install

Choose one install path per agent. The manual path and plugin paths all expose
the same ABP skills, so installing both for the same agent can create duplicate
skill entries or slash commands. Use the Claude Code plugin for Claude Code, the
Codex plugin for Codex, and the manual skills install for agents that read
`~/.agents/skills/` or do not have a plugin install path.

### Manual Skills Install

Use this when your agent reads `~/.agents/skills/`, or when you want one shared
skills directory for multiple tools. e.g., I bounce between Codex, Claude, and Pi
so it's easier to install ABP for them all with one command.

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

Clone and link the shared skills:

```sh
git clone https://github.com/kreek/agent-booster-pack.git
cd agent-booster-pack

stow --target="$HOME" --ignore='^AGENTS\.md$' --ignore='^\.claude/CLAUDE\.md$' agents
```

ABP does not need to edit `~/AGENTS.md` or `~/.claude/CLAUDE.md`; agents
discover skills from the shared skill directory and load each `SKILL.md` only
when it is relevant. The [`workflow`][skill-workflow] skill is the entry point
that tells agents how to choose the right ABP skills for a task. The checkout
can live anywhere.

The manual install links:

- `~/.agents/skills/`
- `~/.agents/commands/`

Run the local link helper only when you use a tool that needs compatibility
symlinks:

```sh
./setup.sh
```

`./setup.sh` adds tool-specific links for agents that do not rely only on
`~/.agents/skills/`:

- `~/.claude/skills/` points at `~/.agents/skills/`
- `~/.codex/skills/<name>/` links each portable skill individually
- `~/.codeium/windsurf/skills/<name>/` links each skill when Windsurf is present

Pi, Cursor, Gemini CLI, OpenCode, GitHub Copilot CLI, and other tools that
auto-discover `~/.agents/skills/` do not need `./setup.sh`. End-user installs do
not need Python or uv.

### Claude Code Plugin Install

Use this when you want Claude Code to load ABP as a namespaced plugin and show
skills as `/abp:<skill>`.

```sh
# Inside Claude Code:
/plugin marketplace add kreek/agent-booster-pack
/plugin install abp@abp
```

For local development against a working tree, add the repo directory as a local
plugin source:

```sh
/plugin install /path/to/agent-booster-pack/plugin
```

The plugin uses `plugin/.claude-plugin/plugin.json` and loads the shared skills
from `plugin/skills/`, which are symlinks back to the canonical
`agents/.agents/skills/` files.

### Codex Plugin Install

Use this when you want Codex to install ABP from this repo's
[Codex marketplace metadata][codex-plugins].

```sh
codex plugin marketplace add kreek/agent-booster-pack
```

Then open Codex's plugin directory and install **Agent Booster Pack** from the
ABP marketplace.

For local development against a working tree, add the repo directory as a local
marketplace source:

```sh
codex plugin marketplace add /path/to/agent-booster-pack
```

The plugin uses `plugin/.codex-plugin/plugin.json` and loads the shared skills
from `plugin/skills/`, which are symlinks back to the canonical
`agents/.agents/skills/` files.

## Using ABP

Skills are progressive context: agents see only `name` and `description` until a
task triggers a skill, then load the matching `SKILL.md` for the sharper rule,
workflow, and proof check needed for the work in front of them.

You do not need to start from a special command. Make a natural-language
request, and the agent can use [`workflow`][skill-workflow] plus the narrower
skills needed for the work. You can also invoke a specific skill directly when
you want a particular lens, such as `documentation` for README work or
`code-review` for a diff. Some skills are intentionally user-invoked workflow
commands, such as `commit`, because they package repository state and should run
only when you ask for that action.

The skill pack is deliberately not a checklist library. It is a set of
discipline-enforcing lenses, grouped by the kind of engineering pressure they
apply:

### Entry point

- [`workflow`][skill-workflow]: choose the right ABP skills for the task, keep
  the work scoped, and connect completion claims to proof.

### Foundational design

- [`data-first`][skill-data-first]: data shapes, state transitions, invariants,
  effects, and parse-at-boundary discipline.
- [`architecture`][skill-architecture]: module boundaries, domain/feature
  locality versus horizontal layers, and DDD tactical patterns.
- [`proof`][skill-proof]: explicit proof obligations for behavior, contracts,
  invariants, root causes, refactor safety, and completion claims.

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
- [`ui-design`][skill-ui-design]: pages, components, interaction flows, responsive
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
[skill-architecture]: agents/.agents/skills/architecture/SKILL.md
[skill-data-first]: agents/.agents/skills/data-first/SKILL.md
[skill-database]: agents/.agents/skills/database/SKILL.md
[skill-debugging]: agents/.agents/skills/debugging/SKILL.md
[skill-deployment]: agents/.agents/skills/deployment/SKILL.md
[skill-documentation]: agents/.agents/skills/documentation/SKILL.md
[skill-error-handling]: agents/.agents/skills/error-handling/SKILL.md
[skill-ui-design]: agents/.agents/skills/ui-design/SKILL.md
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
[skill-workflow]: agents/.agents/skills/workflow/SKILL.md
[codex-plugins]: https://developers.openai.com/codex/plugins/build
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

- `agents/AGENTS.md` when the repo-maintainer skill index changes
- `workflow` when the skill changes how ABP should route broad tasks
- this README so humans understand the pack
- any neighboring skills' handoffs when routing changes
- `.claude-plugin/marketplace.json` per the pack-versioning rules in the
  repo-root [`AGENTS.md`](AGENTS.md#pack-versioning-marketplacejson--pluginjson)
- `.agents/plugins/marketplace.json` and `plugin/.codex-plugin/plugin.json`
  when Codex plugin metadata or packaged skill content changes

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

Maintainers can enable the repo-local pre-commit guard after setup:

```sh
git config core.hooksPath .githooks
```

The hook blocks commits on `main`/`master`, checks the staged diff, and runs the
repo validation commands relevant to staged files. It is a deterministic safety
net for any coding agent that uses Git; it does not replace the `proof` skill's
requirement to show acceptance evidence before claiming work is done.

## Remove

```sh
stow --target="$HOME" -D agents
```

Manual cleanup may still be needed for tool-specific symlinks under
`~/.claude/skills/`, `~/.codex/skills/`, and `~/.codeium/windsurf/skills/`. If you installed the Claude Code
plugin, also run `/plugin uninstall abp@abp` and (optionally)
`/plugin marketplace remove abp` from inside Claude Code.
