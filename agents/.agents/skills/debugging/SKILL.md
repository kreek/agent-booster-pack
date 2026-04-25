---
name: debugging
description:
  Use when investigating a bug, trying to reproduce a flaky issue, diagnosing a
  heisenbug, structuring a post-mortem, or deciding whether to use a debugger vs
  print-style instrumentation. Also use when the user is stuck on a problem and
  needs a systematic approach rather than random changes.
---

# Debugging

## Iron Law

`NO FIX WITHOUT ROOT-CAUSE EVIDENCE.`

## When to Use

- Investigating defects, flakes, heisenbugs, regressions, production
  incidents, unclear failures, or "stuck" debugging sessions.

## When NOT to Use

- Planned refactors with no failing behavior; use `refactoring`.
- Performance investigation where the symptom is slowness; use
  `performance`.
- Git-history regression search mechanics; pair with `git`.

## Core Ideas

1. Reproduce before fixing. State hypotheses so they can be confirmed
   or killed; change one variable per experiment.
2. Reduce the failing case until only the bug remains. Localize by
   boundary: data, service, integration, application, infrastructure.
3. Fix the root cause and add a guard test.
4. For incidents, produce blameless learning with owned follow-up
   actions — never "human error" as a root cause.

## Workflow

1. Capture the exact symptom: command, input, output, stack trace,
   timing, environment. Reproduce reliably or record why reproduction
   isn't yet possible.
2. After the third experiment, keep a short debug log. Form one
   hypothesis at a time, predict what else must be true, run the
   smallest experiment that confirms or refutes it.
3. Record the fix as a Proof Contract: root-cause claim, relevant data
   invariant, reproduction boundary, regression check, evidence. Fix
   only after evidence identifies the cause.
4. Add a regression test or operational guard before declaring fixed.

## Verification

- [ ] The bug reproduces on pre-fix code or non-reproducibility is
      documented.
- [ ] The root cause is named in one sentence and explains all observed
      symptoms.
- [ ] The fix is one atomic change aimed at that cause.
- [ ] A regression test or equivalent guard fails before the fix and
      passes after.
- [ ] Heisenbugs were verified with non-invasive observation or replay.
- [ ] Incident follow-ups have owners and deadlines.
- [ ] The root-cause and fix claims have proof evidence, or the fix is
      reported as unproven.

## Handoffs

- Use `proof` when a fix claim needs explicit evidence.
- Use `testing` for the regression test shape.
- Use `git` for `git bisect`, reflog recovery, or conflict-heavy
  debugging.
- Use `observability` when the right evidence must come from logs,
  metrics, traces, or incident timelines.

## References

- "A debugging manifesto":
  <https://jvns.ca/blog/2022/12/08/a-debugging-manifesto/>
- `rr`: <https://rr-project.org/>
- Google SRE Workbook, postmortem culture:
  <https://sre.google/workbook/postmortem-culture/>
