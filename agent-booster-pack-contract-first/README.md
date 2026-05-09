# agent-booster-pack-contract-first

The Interface Design Gate for [Pi](https://pi.dev), the terminal coding
agent.

When work appears to define or materially change a durable interface
between application components, the agent must stop before implementation
and present:

```text
Interface Design Gate

Current interface:
Proposed interface:
Why this boundary:
User decision:
```

The agent may propose the interface shape, but the user must approve,
revise, or rule it out before implementation code lands. The gate is a
soft runtime check — false positives can be allowed through.

This package includes both the runtime gate and the matching full
`contract-first` skill. The skill carries the doctrine; this package enforces
an explicit gate packet at tool-call time inside Pi.

## Install

Install Pi:

```sh
npm install -g @mariozechner/pi-coding-agent
pi
```

Install agent-booster-pack-contract-first:

```sh
pi install npm:agent-booster-pack-contract-first
```

Then in Pi:

```text
/reload
```

If you want the full ABP experience (general skills + runtime-owned skills + gates),
install the meta-package instead.

## What it does

The extension hooks two Pi events:

- **`before_agent_start`** — appends a system-prompt reminder so the agent
  knows to produce the gate packet (Current/Proposed/Why/User decision)
  whenever work touches a durable interface.
- **`tool_call`** — soft-blocks mutating tool calls (`edit`, `write`, and
  shell commands that match a write pattern like file redirects, `tee`,
  `sed -i`, `mv`, `cp`, `git apply`, etc.) after an explicit Interface
  Design Gate packet has been shown without a recent gate approval. In a
  UI session, the user is prompted to allow the action; without a UI, the
  call is blocked.

The runtime no longer infers interface intent from keywords. Semantic
classification belongs to the agent and ABP skills; the extension enforces
only the approval protocol once the agent opens the gate.

## Approving the gate

When the agent has produced the gate packet and you want to proceed,
respond with an approval phrase: `approve`, `approved`, `yes`, `looks
good`, `go ahead`, `ship it`, `implement it`, or `proceed`. Approval
applies to the latest gate prompt; a later gate prompt resets the
requirement.

To reject or revise, respond with: `reject`, `rejected`, `no`, `revise`,
`change it`, `not that`, `don't implement`, or `do not implement`.

## Test

```sh
npm test
```

## License

MIT — see `LICENSE`.
