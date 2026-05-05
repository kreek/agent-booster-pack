# Agent Booster Pack Evals

This eval suite benchmarks whether Codex behaves better when the Agent Booster
Pack is installed as a Codex plugin.

Bench runs compare:

- `codexBaseline`: Codex with an isolated, freshly-authed home and no plugins.
- `codexWithAbpSkills`: the same Codex model with the local repo registered
  as a codex plugin marketplace and the `abp@abp` plugin enabled — the same
  flow a real user gets after `codex plugin marketplace add`.

Suites:

- `smoke`: one cheap proof-first task for wiring checks.
- `core`: tasks for ABP's always-on and core design/correctness skills.
- `allSkills`: a larger suite intended to exercise every ABP skill listed in
  the README at least once.

Suite membership is defined in `eval/suites/*.yaml`. `eval.config.ts` owns
profile, Bench, judge, timeout, and budget policy only.

The suite uses deterministic hidden checks plus an LLM judge that scores
engineering maturity, proof quality, simplicity, and risk handling. Hidden
checks make sure the task still works even if the agent edits visible tests.
The judge runs by default; pass `--no-judge` for a fast, deterministic-only
run during local development.

Trial prompts and starter files are intentionally neutral: they describe the
product or maintenance task without naming ABP, skills, or the quality lens
being scored. Intended skill coverage lives in each trial manifest's
`features:` list so suite coverage has one source of truth without leaking
skill names into the agent-visible task.

## Setup

This package depends on the local `do-eval` checkout through
`package.json`:

```sh
cd eval
npm install
```

Set a model if the default is not what you want:

```sh
export ABP_EVAL_MODEL=gpt-5.4
```

Codex authentication is read from `CODEX_HOME/auth.json` when set, otherwise
from `~/.codex/auth.json`. Each run gets a temporary isolated Codex home.

## Commands

```sh
npm run list              # show profiles, suites, and bench configs
npm run view              # start the do-eval web UI on http://localhost:4242

npm run bench:smoke       # compare Codex baseline vs Codex + ABP
npm run bench:core        # compare the core suite
npm run bench:routing     # compare read-only routing behavior
npm run bench:all         # compare every skill
npm run bench:smoke -- --no-judge

npm run regression:smoke -- --profile codexWithAbpSkills
npm run trial -- proof-first-bugfix --profile codexBaseline

npm test                  # run eval harness tests
npm run typecheck         # type-check the eval harness
```

Use **Bench** for cross-profile comparisons: one suite, baseline Codex, and
Codex with ABP installed. Use **Regression** to inspect one profile's runs
over time. Use **Trial** to debug one task under one profile. The launcher card
in the do-eval UI defaults to **Bench** for this project via
`defaultLaunchType: "bench"` in `eval.config.ts`.

Results are written under `~/.cache/agent-booster-pack/eval/runs/` by default
(override with `ABP_EVAL_RUNS_DIR`). Trial workdirs live outside the repo to
keep codex's ancestor walk from auto-discovering ABP skills into the baseline
profile.
