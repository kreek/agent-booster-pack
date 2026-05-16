# Agent Booster Pack

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="assets/ABP_logo_header_dark.png">
    <source media="(prefers-color-scheme: light)" srcset="assets/ABP_logo_header_light.png">
    <img src="assets/ABP_logo_header_light.png" alt="Comic-style Agent Booster Pack header: a robot launching from a booster-pack package beside the headline 'Up-level your coding agents' and a panel describing practical guidance for simpler, evidence-backed, accessible, production-grade software.">
  </picture>
</p>

Agent Booster Pack (ABP) is a portable skill library for coding agents. It
works with Codex, Claude Code, Pi, Cursor, Gemini CLI, GitHub Copilot CLI,
OpenCode, and Windsurf via the Agent Skills layout, and nudges agents toward
simpler, evidence-backed, secure, accessible, production-grade work.

**ABP rides on the host harness; it does not replace it.** The skills name
engineering risks and proof obligations. The harness uses its own browser,
memory, planning, sub-agent, and tool surfaces to satisfy them. Drawn from 25
years of software engineering across startups and large organizations.

## What ABP guides agents to do

- Keep humans in the loop when choices shape contracts, data, boundaries, or
  long-lived behavior.
- Use AI to improve the developer's mental model, not to replace it.
- Model data first: make values, states, and rules clear; limit side effects;
  keep state changes at the edges.
- Show their work: prove behavior with tests, contracts, logs, or visible
  checks rather than relying on what seems correct.
- Treat security, data safety, and accessibility as essential, not extras.
- Plan beyond launch: invest in observability, reliability, safe deployment,
  and a rollback plan.
- Organize work into clear, reviewable changes humans can trust and maintain.

## Install

Pick the install for your agent. Most users want the packaged install for
their primary tool; use the manual install only if you switch between several
agents or use one without plugin support.

### Codex

```sh
codex plugin marketplace add kreek/agent-booster-pack
```

Then open `/plugins` in Codex, select **Agent Booster Pack**, and install. To
update later, run `codex plugin marketplace upgrade abp` and reinstall from
`/plugins`.

### Claude Code

Inside Claude Code:

```text
/plugin marketplace add kreek/agent-booster-pack
/plugin install abp@abp
```

### Pi

Pi is modular: ABP for Pi ships as a meta package plus four separable
packages. Only the proof runtime is active by default. The other workflow
runtimes install manual commands and stay quiet until you start them.

```sh
# Everything: skills + proof runtime + manual workflow commands
pi install npm:agent-booster-pack

# Or pick parts:
pi install npm:agent-booster-pack-skills            # general skills only
pi install npm:agent-booster-pack-proof             # proof runtime + skill
pi install npm:agent-booster-pack-contract-first    # Interface Design Gate
pi install npm:agent-booster-pack-specify           # Design-partner mode
```

After installing, run `/reload` inside Pi to activate.

### Manual (multi-agent or unsupported plugins)

Use this if your agent reads `~/.agents/skills/`, or if you want one skill
directory shared across Codex, Claude, Pi, and others.

Prerequisites: Git, GNU Stow (`brew install stow`, `apt install stow`, or
`dnf install stow`).

```sh
git clone https://github.com/kreek/agent-booster-pack.git
cd agent-booster-pack
./setup.sh
```

`setup.sh` prints the actions it will take and confirms before changing
anything. It links `~/.agents/skills/` and adds tool-specific links for
Claude (`~/.claude/skills/`), Codex (`~/.codex/skills/<name>/`, unless the
Codex plugin is installed), and Windsurf (`~/.codeium/windsurf/skills/<name>/`)
when those tools are present.

Pi, Cursor, Gemini CLI, OpenCode, GitHub Copilot CLI, and other tools
auto-discover `~/.agents/skills/`. End-user installs do not need Python or
uv.

## Skills

24 skills, grouped by the engineering pressure they apply. Open a skill for
its triggers, principles, workflow, and verification.

| Skill | Group | Use when |
|---|---|---|
| [`workflow`][skill-workflow] | Always-on routing and proof | Choosing the working mode, scoped skill set, and proof plan. |
| [`contract-first`][skill-contract-first] | Always-on routing and proof | Durable interfaces need approval before implementation lands. |
| [`proof`][skill-proof] | Always-on routing and proof | Behavior, contracts, invariants, root causes, or completion claims need evidence. |
| [`specify`][skill-specify] | Foundational design | Architecture or design decisions need human collaboration before code changes. |
| [`domain-modeling`][skill-domain-modeling] | Foundational design | Data, states, invariants, allowed combinations, transitions, or effects need shaping. |
| [`architecture`][skill-architecture] | Foundational design | Module boundaries, bounded contexts, or independently changing concerns need design. |
| [`code-review`][skill-code-review] | Correctness and change | Diffs, branches, PRs, requested changes, or generated code need review. |
| [`debugging`][skill-debugging] | Correctness and change | Bugs, flakes, regressions, or symptoms need root-cause investigation. |
| [`refactoring`][skill-refactoring] | Correctness and change | Structure changes must preserve behavior while improving clarity. |
| [`error-handling`][skill-error-handling] | Correctness and change | Error types, propagation, retries, timeouts, crash boundaries, or recovery need design. |
| [`official-source-check`][skill-official-source-check] | Correctness and change | Current external framework, runtime, SDK, browser, cloud, or platform behavior matters. |
| [`security`][skill-security] | Safety gates | Auth, secrets, crypto, input validation, dependency trust, or trust boundaries are in scope. |
| [`database`][skill-database] | Safety gates | Schemas, migrations, indexes, queries, transactions, or production data access are in scope. |
| [`release`][skill-release] | Safety gates | Approved release prep, versioning, changelogs, rollout, or rollback work is in scope. |
| [`observability`][skill-observability] | Production quality | Logs, metrics, traces, health checks, dashboards, alerts, or telemetry need work. |
| [`async-systems`][skill-async-systems] | Production quality | Async tasks, workers, queues, streams, ordering, delivery, or backpressure are in scope. |
| [`performance`][skill-performance] | Production quality | Latency, throughput, p99s, CPU, memory, I/O, caching, or resource saturation matters. |
| [`api`][skill-api] | Public/user surfaces | HTTP APIs, OpenAPI, status codes, pagination, idempotency, versioning, or webhooks are in scope. |
| [`documentation`][skill-documentation] | Public/user surfaces | READMEs, ADRs, runbooks, tutorials, reference docs, or comments are requested or approved. |
| [`ui-design`][skill-ui-design] | Public/user surfaces | Pages, components, interaction flows, responsive layout, or visual design need work. |
| [`accessibility`][skill-accessibility] | Public/user surfaces | WCAG, semantic HTML, ARIA, keyboard, focus, contrast, forms, or inclusive UI are in scope. |
| [`commit`][skill-commit] | Project and repo workflow | Reviewed work needs staging, logical commit grouping, or a right-sized commit message. |
| [`git-workflow`][skill-git-workflow] | Project and repo workflow | Branch hygiene, rebases, conflicts, bisects, history recovery, force-push decisions, or GitHub CLI are in scope. |
| [`scaffolding`][skill-scaffolding] | Project and repo workflow | New projects, baseline tooling, package-manager defaults, test runners, linting, or CI need setup. |

Greenfield stack picks live as editable
[Backstage Software Templates][backstage-templates] YAML files under
[`scaffolding/references/stacks/`][stacks-dir]. Edit them to match your
preferred frameworks, databases, auth, jobs, and observability. Shared
language defaults are in [`language-defaults.md`][language-defaults].

## How routing works

ABP routing is **collaboration-aware, quality-driven, and risk-triggered**.
Quality is the goal; risk is the signal that a quality concern matters enough
to change the next action; working mode determines how much human involvement
that action needs.

The four working modes are **Direct** (mechanical work on autopilot), **Guided**
(default — normal feature/bug/refactor), **Design-partner** (architecture,
domain, durable-interface decisions), and **Review-only** (critique without
edits). When a durable interface is in scope, the agent stops at the
contract/API and high-level plan and asks for approval before implementation
continues.

See [`workflow`][skill-workflow] for the full routing model, durable-interface
definition, and required sign-off artifacts.

## What makes ABP unique

ABP is designed to improve engineering quality by routing agents toward the
risks and human decisions that matter for the task. Three properties
distinguish it:

**Skills, not orchestration.** ABP names engineering risk and proof
obligations; it does not replace the host harness's browser, memory,
planning, sub-agent, or tool surfaces. The doctrine adds focused engineering
support without changing agent internals.

**Graduated user involvement.** ABP leans into human collaboration rather
than maximum automation. Mechanical work proceeds quickly; architecture and
durable interfaces slow down for approval; review requests stay read-only.
This is a skill pack for users who want to stay part of the coding process —
especially architecture and design.

**Proof, not test-first.** Behavior-changing claims need evidence, but the
order is yours: agents can discover shape first, then attach tests,
contracts, command output, or other evidence before claiming work is done.

The high-level lens is Rich Hickey's "Simple Made Easy": complexity is the
enemy. ABP pushes agents toward designs that separate concerns, make state
and effects explicit, and remain simple enough to understand, change, and
prove.

ABP assumes coding agents already know the basics of coding, planning, and
tool use, and that syntax is handled by linters, formatters, type checkers,
and test suites. The skills do not cover those areas.

## Evaluation

ABP ships an eval suite under [`eval/README.md`](eval/README.md) that
benchmarks Codex with and without the ABP plugin against shared engineering
tasks. The current smoke trial shows a +17 lift on the proof-first bugfix
task; an LLM judge adds engineering-maturity, proof-quality, simplicity, and
risk-handling scores on top of deterministic hidden tests.

## Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md) for project conventions, the skill
authoring template, branching and commit rules, local checks, and the
maintenance steps to run after adding or renaming a skill. Skill authoring
rules and pack-versioning policy live in
[`AGENTS.md`](AGENTS.md#skill-anatomy-enforced-by-the-validator).

## Uninstall

For the manual install:

```sh
stow --target="$HOME" -D agents
```

Manual cleanup may still be needed for tool-specific symlinks under
`~/.claude/skills/`, `~/.codex/skills/`, and `~/.codeium/windsurf/skills/`.

If you installed the Claude Code plugin, run `/plugin uninstall abp@abp`
(and optionally `/plugin marketplace remove abp`) from inside Claude Code.
For the Codex plugin, remove it from Codex's plugin UI or marketplace
commands.

[skill-accessibility]: agents/.agents/skills/accessibility/SKILL.md
[skill-api]: agents/.agents/skills/api/SKILL.md
[skill-specify]: agents/.agents/skills/specify/SKILL.md
[skill-contract-first]: agents/.agents/skills/contract-first/SKILL.md
[skill-async-systems]: agents/.agents/skills/async-systems/SKILL.md
[skill-architecture]: agents/.agents/skills/architecture/SKILL.md
[skill-domain-modeling]: agents/.agents/skills/domain-modeling/SKILL.md
[skill-database]: agents/.agents/skills/database/SKILL.md
[skill-debugging]: agents/.agents/skills/debugging/SKILL.md
[skill-documentation]: agents/.agents/skills/documentation/SKILL.md
[skill-error-handling]: agents/.agents/skills/error-handling/SKILL.md
[skill-ui-design]: agents/.agents/skills/ui-design/SKILL.md
[skill-commit]: agents/.agents/skills/commit/SKILL.md
[skill-git-workflow]: agents/.agents/skills/git-workflow/SKILL.md
[skill-observability]: agents/.agents/skills/observability/SKILL.md
[skill-performance]: agents/.agents/skills/performance/SKILL.md
[skill-proof]: agents/.agents/skills/proof/SKILL.md
[skill-release]: agents/.agents/skills/release/SKILL.md
[skill-refactoring]: agents/.agents/skills/refactoring/SKILL.md
[skill-official-source-check]: agents/.agents/skills/official-source-check/SKILL.md
[skill-code-review]: agents/.agents/skills/code-review/SKILL.md
[skill-scaffolding]: agents/.agents/skills/scaffolding/SKILL.md
[skill-security]: agents/.agents/skills/security/SKILL.md
[skill-workflow]: agents/.agents/skills/workflow/SKILL.md
[backstage-templates]: https://backstage.io/docs/features/software-templates/
[stacks-dir]: agents/.agents/skills/scaffolding/references/stacks/
[language-defaults]: agents/.agents/skills/scaffolding/references/language-defaults.md
