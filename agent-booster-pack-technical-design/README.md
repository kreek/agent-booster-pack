# Agent Booster Pack Technical Design

Pi runtime companion and matching full `technical-design` skill for ABP technical design. It enforces one user-facing question at a time while technical-design mode is active.

## Install

```sh
pi install npm:agent-booster-pack-technical-design
```

Then in Pi:

```text
/reload
```

## Usage

Start technical-design mode manually:

```text
/abp:technical-design design the import flow
```

Or invoke the ABP technical-design skill; the guard activates automatically:

```text
/skill:technical-design design the import flow
```

Stop enforcement:

```text
/abp:technical-design-off
```

While active, assistant responses that ask more than one user-facing question are blocked and the agent is prompted to regenerate with exactly one decision question. Other uncertainties should be written as notes, not questions.

## Test

```sh
npm test
```

## License

MIT — see `LICENSE`.
