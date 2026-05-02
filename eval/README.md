# Agent Booster Pack Evals

This eval suite benchmarks whether Codex behaves better when the Agent Booster
Pack is installed as a Codex plugin.

The experiments compare:

- `codexBaseline`: Codex with an isolated, freshly-authed home and no plugins.
- `codexWithAbpSkills`: the same Codex model with the local repo registered
  as a codex plugin marketplace and the `abp@abp` plugin enabled — the same
  flow a real user gets after `codex plugin marketplace add`.

Suites:

- `smoke`: one cheap proof-first task for wiring checks.
- `core`: tasks for ABP's always-on and core design/correctness skills.
- `allSkills`: a larger suite intended to exercise every ABP skill listed in
  the README at least once.

The suite uses deterministic hidden checks plus an LLM judge that scores
engineering maturity, proof quality, simplicity, and risk handling. Hidden
checks make sure the task still works even if the agent edits visible tests.
The judge runs by default; pass `--no-judge` for a fast, deterministic-only
run during local development.

Trial prompts are intentionally neutral: they describe the product or
maintenance task without naming ABP, skills, or the quality lens being scored.
Skill coverage lives in `eval.config.ts` and the scorer.

## Setup

This package currently depends on the local `pi-do-eval` checkout:

```sh
cd eval
npm install
```

By default the runner loads:

```text
../../pi-extensions/pi-do-eval/src/lib/eval/index.ts
```

Override that with `PI_DO_EVAL_SOURCE` if your checkout lives elsewhere.

Set a model if the default is not what you want:

```sh
export ABP_EVAL_MODEL=gpt-5.4
```

Codex authentication is read from `CODEX_HOME/auth.json` when set, otherwise
from `~/.codex/auth.json`. Each run gets a temporary isolated Codex home.

## Commands

```sh
npm run list                       # show trials, suites, experiments
npm run experiment:smoke           # run baseline vs ABP on the smoke suite
npm run experiment:core            # run baseline vs ABP on the core suite
npm run experiment:routing         # compare read-only routing behavior
npm run experiment:all             # run baseline vs ABP across every skill
npm run experiment                 # alias for the codex-abp experiment
npm run experiment -- --no-judge   # skip the judge for a faster dev run

npm run bench:smoke                # bench mode for one suite
npm run eval -- run routing --profile codexWithAbpSkills
npm run eval -- run smoke --profile codexWithAbpSkills
npm run eval -- run --trial proof-first-bugfix --profile codexBaseline

npm test
npm run typecheck
```

The launcher card in the pi-do-eval UI defaults to the **Bench** tab for this
project (set via `defaultLaunchType: "bench"` in `eval.config.ts`) — that's
where the cross-profile comparison view lives. The **Regression** sidebar tab
shows each profile's runs over time as a separate timeline, since two
profiles with different layers can't share a single drift line.

Results are written under `~/.cache/agent-booster-pack/eval/runs/` (override
with `ABP_EVAL_RUNS_DIR`). The in-repo `eval/runs/` is a symlink into that
cache so the pi-do-eval UI can serve them. Trial workdirs live outside the
repo to keep codex's ancestor walk from auto-discovering ABP skills into the
baseline profile.
