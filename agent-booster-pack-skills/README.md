# Agent Booster Pack — Skills

ABP skills packaged for [Pi](https://pi.dev), the terminal coding agent.
Helps Pi produce code that is well-organized, low in complexity and side
effects, and is secure and performant.

This package is **skills only** and carries the general ABP skills. Runtime-owned skills ship with their matching sibling packages:

- `agent-booster-pack-contract-first` — Interface Design Gate runtime plus the
  `contract-first` skill.
- `agent-booster-pack-proof` — proof-first red-green-refactor runtime plus the
  `proof` skill.
- `agent-booster-pack-whiteboard` — one-question whiteboarding runtime plus the
  `whiteboarding` skill.

The pack covers data modeling, code review, security, debugging, refactoring,
and more. The canonical skill source lives at
`agents/.agents/skills/` in the parent repository; `skills/` here is
built from that source at npm-pack time and is not committed.

> **Renamed from `pi-agent-booster-pack`.** The old name is deprecated;
> migrate to `agent-booster-pack-skills` for ongoing updates. The
> meta-package `agent-booster-pack` installs all four
> `agent-booster-pack-*` packages at once.

## Install

### From npm (recommended)

```sh
pi install npm:agent-booster-pack-skills
```

Then in Pi:

```text
/reload
```

For the full ABP experience (general skills + runtime-owned skills + gates), install
the meta-package instead:

```sh
pi install npm:agent-booster-pack
```

### From a local checkout

For development against the live source. Run the build first so the
skills exist in `agent-booster-pack-skills/skills/`:

```sh
cd /path/to/agent-booster-pack/agent-booster-pack-skills
npm run build
pi install /path/to/agent-booster-pack/agent-booster-pack-skills
```

Then in Pi:

```text
/reload
```

### Local development symlink

If you are iterating on skills and want a single command for build +
install:

```sh
cd /path/to/agent-booster-pack/agent-booster-pack-skills
npm run install-ext
```

This builds `skills/` and symlinks the working tree into
`~/.pi/agent/extensions/agent-booster-pack-skills`. Re-run
`npm run build` and `/reload` in Pi after editing skills.

> Note: `pi install git:` does not currently support installing a
> subdirectory of a repository, so pointing at the parent
> `agent-booster-pack` git URL will not work. Use the npm install
> (above) or a local checkout.

## What's included

The general ABP skills, grouped by the kind of engineering pressure they apply.

### Entry point

- `workflow` — choose the right ABP skills for the task, name what is
  being coupled, keep the work scoped, and connect completion claims to
  proof.

### Foundational design

- `domain-modeling` — domain data, fields, states, transitions, effects.
- `architecture` — module boundaries, domain locality, DDD tactical
  patterns.

### Correctness and change

- `code-review` — risk-focused review of diffs, branches, PRs.
- `debugging` — root-cause investigation.
- `refactoring` — behavior-preserving structure changes.
- `error-handling` — error types, propagation, retries, recovery.

### Safety gates

- `security` — auth, secrets, crypto, input validation, trust
  boundaries.
- `database` — schemas, migrations, queries, transactions, deletion
  semantics.
- `release` — version bumps, CHANGELOG, rollouts, rollbacks, feature
  flags.

### Production quality

- `observability` — logs, metrics, traces, dashboards, SLOs, alerts.
- `async-systems` — async work, queues, streams, ordering,
  backpressure.
- `performance` — latency, throughput, caching, allocation, stampede
  prevention.

### Public/user surfaces

- `api` — HTTP APIs, OpenAPI, idempotency, pagination, webhooks.
- `documentation` — READMEs, ADRs, runbooks, reference docs.
- `ui-design` — pages, components, interaction flows, responsive
  layout.
- `accessibility` — WCAG, semantic HTML, ARIA, keyboard navigation.

### Project workflow

- `git-workflow` — branch hygiene, commit splits, rebases, history
  recovery.
- `scaffolding` — new projects, baseline tooling, CI defaults.

## How it works

Pi reads `pi.skills` from this package's `package.json` and walks each
subdirectory under `skills/`. Each subdirectory is one skill, with a
`SKILL.md` that has YAML frontmatter (`name`, `description`) and a body
Pi loads when the skill description matches a task. No code runs from
this package.

The runtime gates that enforce ABP workflow phases live in the sibling
packages above. Install them separately if you want runtime
enforcement.

## Build pipeline

`skills/` is a build artifact, not a checked-in mirror.

- `scripts/build-skills.mjs` walks `../agents/.agents/skills/` and
  copies each skill subdirectory into `./skills/`.
- `npm run build` runs that script directly.
- `npm pack` and `npm publish` run it via the `prepack` lifecycle hook,
  so the published tarball always reflects the canonical source at the
  moment of publish.

This means there is exactly one place to author skills
(`agents/.agents/skills/` in the parent repo), and no chance of
`agent-booster-pack-skills/skills/` drifting from canon.

## Publishing

From inside `agent-booster-pack-skills/`:

```sh
npm publish
```

`prepack` runs `npm run build` automatically, so the tarball includes
the freshly-built `skills/` directory.

## License

MIT — see `LICENSE`.
