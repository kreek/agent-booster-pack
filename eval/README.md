# Agent Booster Pack Evals

This eval suite gates ABP changes against regressions and, when a new
comparison run is wanted, benchmarks whether Codex behaves better when the
Agent Booster Pack is installed as a Codex plugin.

**Default workflow: regression.** ABP-vs-baseline behaviour is established;
routine change-validation runs `regression` against `codexWithAbpSkills`
only and compares scores against history. Bench (cross-profile comparison)
is reserved for periodic re-baselining or when claiming a directional win
against unaided Codex.

Profiles:

- `codexBaseline`: Codex with an isolated, freshly-authed home and no
  plugins. Used by bench only.
- `codexWithAbpSkills`: the same Codex model with the local repo registered
  as a codex plugin marketplace and the `abp@abp` plugin enabled — the same
  flow a real user gets after `codex plugin marketplace add`. The default
  profile for regression.

Suites:

- `smoke`: one cheap read-only routing task for wiring checks.
- `core`: tasks for ABP's always-on and core design/correctness skills.
- `allSkills`: a larger suite intended to exercise every ABP skill listed in
  the README at least once.
- `largeProject`: one larger project-style task for cross-file reasoning and
  end-to-end proof.
- `regressionCheck`: trials known to have regressed under ABP; rerun after
  fixes to confirm they landed.

Suite membership is defined in `eval/suites/*.yaml`. `eval.config.ts` owns
profile, Bench, judge, timeout, and budget policy only.

The suite uses an LLM judge for qualitative output: engineering maturity,
proof quality, simplicity, and risk handling. Deterministic scoring is limited
to objective evidence such as forbidden file writes, profile isolation,
plugin activation, and executable tests/checks when the trial prompt asks for
code. Hidden implementation checks make sure the task still works even if the
agent edits visible tests. The judge runs by default; pass `--no-judge` only
when you want to inspect objective harness checks without qualitative scoring.

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
export ABP_EVAL_MODEL=gpt-5.3-codex
export ABP_EVAL_JUDGE_MODEL=gpt-5.3-codex
export ABP_EVAL_REASONING_EFFORT=low
```

By default, both eval workers and the judge use `gpt-5.5` with medium
reasoning effort. Codex worker effort is passed through
`model_reasoning_effort`; the judge receives the same value as its thinking
setting.

Codex authentication is read from `CODEX_HOME/auth.json` when set, otherwise
from `~/.codex/auth.json`. Each run gets a temporary isolated Codex home.

## Commands

```sh
npm run list              # show profiles, suites, and bench configs
npm run view              # start the do-eval web UI on http://localhost:4242

# Regression — the default workflow. Runs codexWithAbpSkills only.
npm run regression:check  # the two trials known to have regressed
npm run regression:core   # always-on and core design/correctness skills
npm run regression:smoke  # cheap routing wiring check
npm run regression:all    # full ABP-only sweep

npm run trial -- proof-first-bugfix --profile codexWithAbpSkills

# Bench — cross-profile comparison. Reserved for re-baselining.
npm run bench:smoke       # compare Codex baseline vs Codex + ABP
npm run bench:core
npm run bench:routing
npm run bench:large
npm run bench:all

npm test                  # run eval harness tests
npm run typecheck         # type-check the eval harness
```

Use **Regression** for routine ABP change-validation: one profile (ABP),
one suite, score against history. Use **Bench** when a fresh
ABP-vs-baseline comparison is needed (every release, or when claiming
a directional win against unaided Codex). Use **Trial** to debug one
task under one profile.

Results are written under `~/.cache/agent-booster-pack/eval/runs/` by default
(override with `ABP_EVAL_RUNS_DIR`). Trial workdirs live outside the repo to
keep codex's ancestor walk from auto-discovering ABP skills into the baseline
profile.
