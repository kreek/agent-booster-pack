# agent-booster-pack-contract-first

Manual Interface Design Gate workflow for [Pi](https://pi.dev), the terminal
coding agent.

Start the workflow when work defines or materially changes a durable interface
between application components:

```text
/abp:contract design the cache adapter
```

The agent must stop before implementation and present:

```text
Interface Design Gate

Current interface:
Proposed interface:
Why this boundary:
User decision:
```

The agent may propose the interface shape, but the user must approve, revise,
or rule it out before implementation code lands. The gate is manual by default:
it does not inject prompt text or block tool calls until `/abp:contract` starts
the workflow.

This package includes both the manual runtime workflow and the matching full
`contract-first` skill. The skill carries the doctrine; this package enforces
the explicit gate packet only while the workflow is active inside Pi.

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

If you want the full ABP experience (general skills + runtime-owned skills + commands),
install the meta-package instead.

## What it does

The extension registers two commands:

- **`/abp:contract [intent]`** — starts the Interface Design Gate workflow and
  asks the agent to produce the gate packet.
- **`/abp:contract-off`** — stops the workflow.

While active, the extension watches mutating tool calls (`edit`, `write`, and
shell commands that match a write pattern like file redirects, `tee`, `sed -i`,
`mv`, `cp`, `git apply`, etc.) after an explicit Interface Design Gate packet
has been shown without recent approval. In a UI session, the user is prompted to
allow the action; without a UI, the call is blocked.

The runtime no longer infers interface intent from keywords. Semantic
classification belongs to the agent and ABP skills; the extension enforces
only the approval protocol once the user starts the workflow and the agent
opens the gate.

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
