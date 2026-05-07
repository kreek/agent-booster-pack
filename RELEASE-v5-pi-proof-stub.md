# pi-proof has moved

`pi-proof` is now `agent-booster-pack-proof`, built and published from
the [Agent Booster Pack monorepo](https://github.com/kreek/agent-booster-pack/tree/main/agent-booster-pack-proof).

## Install the new package

```sh
pi install npm:agent-booster-pack-proof
```

If you want the full ABP experience (skills + interface design gate +
proof gate), install the meta-package instead:

```sh
pi install npm:agent-booster-pack
```

## What changed

Nothing functional. Same proof-first red-green-refactor loop, same
test-framework parsers, same HUD, same `/proof` slash command. Only
the package name and source repo changed.

The npm `pi-proof@1.x` package keeps working for existing installs
but is deprecated; new versions ship under `agent-booster-pack-proof`.

## Why

ABP-on-Pi now ships as four sibling packages from one monorepo so
doctrine and runtime stay version-coupled, and so installing ABP is
one command (`pi install npm:agent-booster-pack`) instead of three.

See the [v5.0.0 changelog](https://github.com/kreek/agent-booster-pack/blob/main/CHANGELOG.md)
for full context.
