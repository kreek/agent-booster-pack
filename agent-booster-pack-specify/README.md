# Agent Booster Pack Specify

Pi runtime companion and matching full `specify` skill for ABP Specify: Design before code. It enforces one user-facing question at a time while Specify mode is active.

## Install

```sh
pi install npm:agent-booster-pack-specify
```

Then in Pi:

```text
/reload
```

## Usage

Start Specify mode manually:

```text
/abp:specify design the import flow
```

Or invoke the ABP Specify skill; the guard activates automatically:

```text
/skill:specify design the import flow
```

Stop enforcement:

```text
/abp:specify-off
```

While active, assistant responses that ask more than one user-facing question are blocked and the agent is prompted to regenerate with exactly one decision question. Other uncertainties should be written as notes, not questions.

## Test

```sh
npm test
```

## License

MIT — see `LICENSE`.
