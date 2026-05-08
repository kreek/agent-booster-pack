# Agent Booster Pack

The full ABP experience for [Pi](https://pi.dev), in one install.

This is a **meta-package**: it installs the sibling ABP packages and adds the cross-cutting final value guard.

- [`agent-booster-pack-skills`](../agent-booster-pack-skills/) — the general
  ABP skills (data, security, debugging, refactoring, code review,
  accessibility, and more). Runtime-owned skills ship with their matching
  extension packages.
- [`agent-booster-pack-contract-first`](../agent-booster-pack-contract-first/)
  — Interface Design Gate runtime. Soft-blocks mutating tool calls
  when interface/contract intent appears in conversation without an
  approved gate packet. Includes the `contract-first` skill.
- [`agent-booster-pack-proof`](../agent-booster-pack-proof/) —
  proof-first red-green-refactor runtime. Enforces a failing test
  before production code lands. Includes the `proof` skill.
- [`agent-booster-pack-whiteboard`](../agent-booster-pack-whiteboard/) —
  whiteboarding conversation guard. Enforces one user-facing question at
  a time while ABP whiteboarding mode is active. Includes the
  `whiteboarding` skill.

The meta-package also includes two cross-cutting reflection gates:

- **Pre-Work Reflection Gate** soft-blocks the first mutating tool call of
  a turn until the agent's latest message explains the plan and why it's
  an improvement (single-file edits) or also names the alternatives
  considered (multi-file or mutating-bash changes). Once satisfied, the
  rest of the turn proceeds without re-prompting; the gate resets at the
  next user message.
- **Final Value Guard** prompts for a better final summary after durable
  file changes. One-file changes get a short one-sentence nudge; larger
  changes get a fuller reflection prompt.

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

That's it — all four siblings are now active. To disable a runtime
gate without uninstalling, see the relevant package's README.

## Migration from `pi-agent-booster-pack`

If you were on `pi-agent-booster-pack@4.x`, this package replaces it
and adds the two runtime gates. The old name is deprecated. Switch
your install to `agent-booster-pack` to stay current.

If you were on `pi-proof@1.x`, that's now `agent-booster-pack-proof`
and is included here. The old name is deprecated.

## License

MIT — see `LICENSE`.
