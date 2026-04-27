# Agent Booster Pack

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="assets/ABP_logo_header_dark.png">
    <source media="(prefers-color-scheme: light)" srcset="assets/ABP_logo_header_light.png">
    <img src="assets/ABP_logo_header_light.png" alt="Comic-style Agent Booster Pack header: a robot launching from a booster-pack package beside the headline 'Up-level your coding agents' and a panel describing practical guidance for simpler, evidence-backed, accessible, production-grade software.">
  </picture>
</p>

A portable skill library focused on engineering quality that helps coding agents create software that is effective, correct, safe, accessible, maintainable, and performant.

Agent Booster Pack is based on my 25 years of software engineering experience, from startups to large organizations. It offers portable skills for agents that use the Agent Skills layout, such as Codex, Claude Code, Pi, Cursor, Gemini CLI, GitHub Copilot CLI, OpenCode, and Windsurf. The pack helps agents follow workflows that lead to simpler designs, clear data models, reliable behavior, safer production systems, user-friendly interfaces, and changes that are easy for humans to review and maintain.

In practice, ABP guides agents to:

* Focus on the data model first: make values, states, and rules clear, limit side effects, and keep state changes at the edges of the system.
* Instead of relying on what seems correct, use tests, contracts, logs, and visible checks to prove your code works.
* Plan for more than just the launch and basic version. Focus on observability, reliability, safe deployment, and having a rollback plan.
* See security, data safety, and accessibility as essential parts of engineering, not just nice extras.
* Fix and update code by addressing the root cause, not just the symptoms.
* Organize your work into clear, reviewable changes that people can trust and maintain.

## Installation

Pick one installation method for each agent. Both the manual and plugin options
provide the same ABP skills, so using both for the same agent can cause
duplicate entries. Prefer the Claude Code plugin for Claude Code
and the Codex plugin for Codex because plugin installs provide package-level
namespacing. Use the manual install for agents that read `~/.agents/skills/`
or do not support plugins.

ABP keeps canonical skill names clean (`testing`, `security`,
`accessibility`, etc.) so plugin users get natural names like `/abp:testing`.
Manual installs use the flat Agent Skills directory layout, so another skill
pack with the same directory name can collide. `./setup.sh` asks before
replacing real directories or third-party symlinks, but package/plugin
installs are the safer distribution path when your agent supports them.
When the ABP Codex plugin is installed, `./setup.sh` removes legacy ABP-owned
links from `~/.codex/skills/` instead of recreating them. Codex can also
discover `~/.agents/skills/` directly, so do not keep both the shared manual
install and the Codex plugin enabled for Codex unless you want duplicate ABP
skills.

### Claude Code Plugin Install

Use this when you want Claude Code to load ABP as a namespaced plugin and show
skills as `/abp:<skill>`.

```sh
# Inside Claude Code:
/plugin marketplace add kreek/agent-booster-pack
/plugin install abp@abp
```

### Codex Plugin Install

Use this when you want Codex to install ABP from this repo's
[Codex marketplace metadata][codex-plugins].

```sh
codex plugin marketplace add kreek/agent-booster-pack
```

Then open Codex's plugin directory and install **Agent Booster Pack** from the
ABP marketplace.

### Manual Skills Installation

Use this method if your agent reads `~/.agents/skills/`, or if you want to share one skills directory across several tools. For example, I switch between Codex, Claude, and Pi, so installing ABP for all of them with one command is simpler.

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

Clone and run setup:

```sh
git clone https://github.com/kreek/agent-booster-pack.git
cd agent-booster-pack

./setup.sh
```

`./setup.sh` prints the actions it will take and asks for confirmation before
making changes.

ABP does not need to edit `~/AGENTS.md` or `~/.claude/CLAUDE.md`; agents
discover skills from the shared skill directory and load each `SKILL.md` only
when it is relevant. The [`workflow`][skill-workflow] skill is the entry point
that tells agents how to choose the right ABP skills for a task. The checkout
can live anywhere.

The manual install links:

- `~/.agents/skills/`

It also adds tool-specific links for agents that do not rely only on
`~/.agents/skills/` when those tools are installed:

- `~/.claude/skills/` points at `~/.agents/skills/`
- `~/.codex/skills/<name>/` links each portable skill individually, unless the
  ABP Codex plugin is installed; this legacy pruning does not disable Codex's
  direct discovery of `~/.agents/skills/`
- `~/.codeium/windsurf/skills/<name>/` links each skill when Windsurf is present

Pi, Cursor, Gemini CLI, OpenCode, GitHub Copilot CLI, and other tools can
auto-discover `~/.agents/skills/`. End-user installs do not need Python or uv.

## What Makes ABP Unique

ABP is designed to manage risk in software projects and guide agents to write production grade code. ABP treats the agent as a coding partner, not a replacement for people. Humans bring judgment, review, decision-making, and context to the process, so these skills guide agents to make clear, reviewable changes and provide evidence, instead of trying to take you out of the loop.

ABP assumes coding agents already know the basics of coding, planning, and using tools, and that syntax is handled by linters, formatters, type checkers, and test suites. The skills do not cover those areas. Instead, ABP works by adding focused skills that provide extra engineering support when needed, without changing agent internals.

ABP requires proof, not TDD. During exploratory iteration, agents can discover
the shape first, then attach tests, contracts, command output, or other
evidence before claiming the work is done.

For greenfield scaffolding, ABP uses editable [Backstage Software
Templates][backstage-templates] YAML files so teams can tune stack presets to
their preferences.

## Using ABP

Skills are progressive context: agents see only `name` and a concise
`description` until a task triggers a skill, then load the matching `SKILL.md`
for the sharper rule, workflow, and proof check needed for the work in front of
them.

You do not need to start from a special command. Make a natural-language
request, and the agent can use [`workflow`][skill-workflow] plus the narrower
skills needed for the work. You can also invoke a specific skill directly when
you want a particular lens, such as `documentation` for README work or
`code-review` for a diff. Some skills, such as `commit`, are intentionally
user-invoked workflows because they package repository state and should run only
when you ask for that action.

The skill pack is deliberately not a checklist library. It is a set of
discipline-enforcing lenses, grouped by the kind of engineering pressure they
apply:

### Entry point

- [`workflow`][skill-workflow]: choose the right ABP skills for the task, name
  what is being coupled, keep the work scoped, and connect completion claims to
  proof.

### Foundational design

- [`data-first`][skill-data-first]: any data modeling work, especially domain
  data, fields, states, allowed combinations, transitions, effects, and the
  first design pass after scaffolding when specs are clear.
- [`architecture`][skill-architecture]: module boundaries, domain/feature
  locality versus horizontal layers, DDD tactical patterns, and concerns that
  change independently.
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
- [`deployment`][skill-deployment]: release toil reduction, CI/CD checks,
  rollout plans, rollback notes, feature-flag plans, and deploy-time
  coordination; agents prepare, humans mutate shared environments.

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
  package-manager defaults, test runners, linting, and CI. Greenfield stack
  picks come from the typed template catalog described below.

#### Stack scaffolding via Backstage Software Templates

Greenfield stack picks live as editable [Backstage Software
Templates][backstage-templates] YAML files under
[`scaffolding/references/stacks/`][stacks-dir]. Tune those files to match
your preferred frameworks, databases, auth, background jobs, and
observability choices; `./setup.sh` links them rather than regenerating them.
Shared language defaults live in
[`scaffolding/references/language-defaults.md`][language-defaults].

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
[backstage-templates]: https://backstage.io/docs/features/software-templates/
[stacks-dir]: agents/.agents/skills/scaffolding/references/stacks/
[language-defaults]: agents/.agents/skills/scaffolding/references/language-defaults.md
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

This reruns the per-agent symlink fan-out for manual installs and refreshes
the generated `plugin/skills/` mirror used by packaged Claude Code and Codex
plugin installs.

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

### Local Plugin Development

Use these only when testing a local checkout as a plugin source. General users
should use the marketplace plugin install commands above.

For Claude Code:

```sh
/plugin install /path/to/agent-booster-pack/plugin
```

For Codex:

```sh
codex plugin marketplace add /path/to/agent-booster-pack
```

The Claude Code plugin uses `plugin/.claude-plugin/plugin.json`; the Codex
plugin uses `plugin/.codex-plugin/plugin.json`. Both load the generated skill
mirror under `plugin/skills/`. Edit canonical skills under
`agents/.agents/skills/`, then run `./setup.sh` to refresh the mirror.

## Remove

```sh
stow --target="$HOME" -D agents
```

Manual cleanup may still be needed for tool-specific symlinks under
`~/.claude/skills/`, `~/.codex/skills/`, and `~/.codeium/windsurf/skills/`. If
you installed the Claude Code plugin, also run `/plugin uninstall abp@abp` and
(optionally) `/plugin marketplace remove abp` from inside Claude Code. If you
installed the Codex plugin, remove it from Codex's plugin UI or marketplace
commands as well.
