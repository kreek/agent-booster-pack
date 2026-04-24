---
name: debugging-methodology
description:
  Use when investigating a bug, trying to reproduce a flaky issue, diagnosing a
  heisenbug, structuring a post-mortem, or deciding whether to use a debugger vs
  print-style instrumentation. Also use when the user is stuck on a problem and
  needs a systematic approach rather than random changes.
---

# Debugging Methodology

## Iron Law

`NO FIX WITHOUT ROOT-CAUSE EVIDENCE.`

If the change only makes the symptom disappear, the bug is hidden, not fixed.

## When to Use

- Investigating defects, flakes, heisenbugs, regressions, production incidents,
  unclear failures, or "stuck" debugging sessions.

## When NOT to Use

- Planned refactors with no failing behavior; use `refactoring-safely`.
- Performance investigation where the symptom is slowness; use
  `performance-profiling`.
- Git-history regression search mechanics; pair with `git-workflow-depth`.

## Core Ideas

1. Reproduce before fixing.
2. Change one variable per experiment.
3. State hypotheses so they can be confirmed or killed.
4. Reduce the failing case until only the bug remains.
5. Localize by boundary: data, service, integration, application,
   infrastructure.
6. Fix the root cause and add a guard test.
7. For incidents, produce blameless learning with owned follow-up actions.

## Workflow

1. Capture the exact symptom: command, input, output, stack trace, timing,
   environment.
2. Reproduce reliably or record why reproduction is not yet possible.
3. Keep a short debug log after the third experiment.
4. Form one hypothesis and predict what else must be true.
5. Run the smallest experiment that confirms or refutes it.
6. Record the fix as a Proof Contract: root-cause claim, relevant data
   invariant, reproduction boundary, regression check, evidence.
7. Fix the root cause only after evidence identifies it.
8. Add a regression test or operational guard before declaring fixed.

## Verification

- [ ] The bug reproduces on pre-fix code or the non-reproducibility is
      documented.
- [ ] The root cause is named in one sentence and explains all observed
      symptoms.
- [ ] The fix is one atomic change aimed at that cause.
- [ ] A regression test or equivalent guard fails before the fix and passes
      after it.
- [ ] The debug log has no unresolved hypotheses that affect the fix.
- [ ] Heisenbugs were verified with non-invasive observation or replay.
- [ ] Incident follow-ups have owners and deadlines; no "human error" root
      cause.
- [ ] The root-cause and fix claims have proof evidence, or the fix is reported
      as unproven.

## Handoffs

- Use `proof-driven-engineering` when a fix claim needs explicit evidence.
- Use `behavior-testing` for the regression test shape.
- Use `git-workflow-depth` for `git bisect`, reflog recovery, or conflict-heavy
  debugging.
- Use `observability-for-services` when the right evidence must come from logs,
  metrics, traces, or incident timelines.

## References

- Julia Evans, "A debugging manifesto":
  <https://jvns.ca/blog/2022/12/08/a-debugging-manifesto/>
- `rr`: <https://rr-project.org/>
- Google SRE Workbook, postmortem culture:
  <https://sre.google/workbook/postmortem-culture/>
