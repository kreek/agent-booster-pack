# Agent Booster Pack Whiteboard

Pi runtime companion for ABP whiteboarding and workflow completion. It enforces one user-facing question at a time while whiteboarding mode is active, and it asks for a stronger final summary after implementation if the agent does not explain why the change is better and what it enables next.

## Install

```sh
pi install npm:agent-booster-pack-whiteboard
```

Then in Pi:

```text
/reload
```

## Usage

Start whiteboarding mode manually:

```text
/abp:whiteboard design the import flow
```

Or invoke the ABP whiteboarding skill; the guard activates automatically:

```text
/skill:whiteboarding design the import flow
```

Stop enforcement:

```text
/abp:whiteboard-off
```

While active, assistant responses that ask more than one user-facing question are blocked and the agent is prompted to regenerate with exactly one decision question. Other uncertainties should be written as notes, not questions.

After implementation work that uses Pi's file-writing tools, the guard also checks the final assistant response. If the final response does not state what changed, why it is better than what came before, and what it enables going forward, the guard queues a follow-up prompt asking the agent to produce that final value reflection. If the agent cannot justify the change as an improvement, it must say why and name alternatives such as revising, reducing, reverting, or choosing a different approach.

## Test

```sh
npm test
```

## License

MIT — see `LICENSE`.
