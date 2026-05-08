# Agent Booster Pack Whiteboard

Pi runtime companion for ABP whiteboarding. It enforces one user-facing question at a time while whiteboarding mode is active.

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

## Test

```sh
npm test
```

## License

MIT — see `LICENSE`.
