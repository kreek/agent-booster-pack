# Agent Booster Pack

The full ABP experience for [Pi](https://pi.dev), in one install.

This is a **meta-package**: it has no code of its own. Installing it
pulls in four independently-developed packages:

- [`agent-booster-pack-skills`](../agent-booster-pack-skills/) — the 21
  ABP skills (data, proof, security, debugging, refactoring, code
  review, accessibility, and more). The skill content is
  harness-portable; this package is the Pi distribution surface.
- [`agent-booster-pack-contract-first`](../agent-booster-pack-contract-first/)
  — Interface Design Gate runtime. Soft-blocks mutating tool calls
  when interface/contract intent appears in conversation without an
  approved gate packet. Pairs with the `whiteboarding` and `workflow`
  skills.
- [`agent-booster-pack-proof`](../agent-booster-pack-proof/) —
  proof-first red-green-refactor runtime. Enforces a failing test
  before production code lands. Pairs with the `proof` skill.
- [`agent-booster-pack-whiteboard`](../agent-booster-pack-whiteboard/) —
  whiteboarding and workflow completion conversation guard. Enforces one
  user-facing question at a time while ABP whiteboarding mode is active,
  and prompts for final value reflection after implementation work.
  Pairs with the `whiteboarding` and `workflow` skills.

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
