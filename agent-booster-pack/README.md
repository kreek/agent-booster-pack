# Agent Booster Pack

The full collaborative ABP experience for [Pi](https://pi.dev), in one install.

This is a **meta-package**: it installs the sibling ABP packages. Proof is the
only default active runtime. The other ABP workflows are manual commands that
stay quiet until the user starts them.

- [`agent-booster-pack-skills`](../agent-booster-pack-skills/) — the general
  ABP skills (collaborative routing, data, security, debugging, refactoring,
  official-source checks, code review, accessibility, and more). Runtime-owned
  skills ship with their matching extension packages.
- [`agent-booster-pack-contract-first`](../agent-booster-pack-contract-first/)
  — manual Interface Design Gate workflow. Includes the `contract-first` skill.
- [`agent-booster-pack-proof`](../agent-booster-pack-proof/) —
  proof-first red-green-refactor runtime. Enforces a failing test
  before production code lands. Includes the `proof` skill.
- [`agent-booster-pack-specify`](../agent-booster-pack-specify/) —
  manual Specify conversation guard. Design-partner mode for architecture,
  domain, durable-interface, and other multi-boundary decisions; enforces one
  user-facing decision question at a time while ABP Specify mode is active.
  Includes the `specify` skill.

The meta-package also includes manual commands:

- **`/abp:branch`** checks Git isolation when the user asks. It prompts on
  protected branches, dirty non-topic branches, and branches with unmerged
  commits.
- **`/abp:prework [intent]`** asks the agent to state plan, why, and
  alternatives before edits. It does not block tool calls.
- **Code Review Runtime** registers `/review [target]` and
  `/abp:review [target]`, where `target`
  defaults to `working-tree` and may be `staged`, `branch`, or a Git rev
  range. It starts an active review session, asks the agent to use the
  `code-review` skill, and exposes `review_complete`. The legacy
  `review_check` tool still works for step-by-step progress.
- **Final Value Guard** automatically asks for a stronger close-out after
  changed turns, scaled to the size of the change. `/abp:final-value [intent]`
  can request the same reflection manually.

If you want only some of the four, install them individually instead
of this meta-package. See each package's README for details.

## Install

```sh
pi install npm:agent-booster-pack
```

Then in Pi:

```text
/reload
```

That's it. Proof is active as the default runtime. The other ABP workflows are
available as manual commands.

## Migration from `pi-agent-booster-pack`

If you were on `pi-agent-booster-pack@4.x`, this package replaces it
and changes most ABP runtime behavior from automatic gates to manual commands.
The old name is deprecated. Switch your install to `agent-booster-pack` to
stay current.

If you were on `pi-proof@1.x`, that's now `agent-booster-pack-proof`
and is included here. The old name is deprecated.

## License

MIT — see `LICENSE`.
