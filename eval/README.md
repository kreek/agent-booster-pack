# Agent Booster Pack Evals

This eval suite benchmarks whether Codex behaves better when the Agent Booster
Pack skills are available as a project layer.

The experiments compare:

- `codexBaseline`: Codex with an isolated home and no ABP layer.
- `codexWithAbpSkills`: the same Codex model with `agents/.agents/skills`
  copied into the trial workdir at `.codex/skills`.

Suites:

- `smoke`: one cheap proof-first task for wiring checks.
- `core`: tasks for ABP's always-on and core design/correctness skills.
- `allSkills`: a larger suite intended to exercise every ABP skill listed in
  the README at least once.

The suite uses deterministic hidden checks plus optional judge scoring. The
hidden checks make sure the task still works even if the agent edits visible
tests.

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
npm run list
npm run experiment:smoke
npm run experiment:core
npm run experiment:all
npm run experiment
npm run experiment -- --judge
npm run bench:smoke
npm run bench:core
npm run bench:all
npm run eval -- bench smoke
npm run eval -- run smoke --profile codexWithAbpSkills
npm run eval -- run --trial proof-first-bugfix --profile codexWithAbpSkills
npm test
npm run typecheck
```

Results are written under `~/.cache/agent-booster-pack/eval/runs/` (override
with `ABP_EVAL_RUNS_DIR`). The in-repo `eval/runs/` is a symlink into that
cache so the pi-do-eval UI can serve them. Trial workdirs live outside the
repo to keep codex's ancestor walk from auto-discovering ABP skills into the
baseline profile.
