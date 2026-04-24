---
name: debugging-methodology
description:
  Use when investigating a bug, trying to reproduce a flaky issue, diagnosing a
  heisenbug, structuring a post-mortem, or deciding whether to use a debugger vs
  print-style instrumentation. Also use when the user is stuck on a problem and
  needs a systematic approach rather than random changes.
---

# Debugging Methodology

## The Scientific Method Applied

Effective debugging is hypothesis-driven, not intuition-driven.

1. **Observe:** what exactly is the symptom? (Error message, incorrect output,
   latency spike) Be precise.
2. **Hypothesise:** what is the simplest explanation? Form one hypothesis at a
   time.
3. **Predict:** if this hypothesis is correct, what else should be true?
4. **Test:** run the smallest experiment that confirms or refutes the
   prediction.
5. **Update:** if confirmed, you've found it. If refuted, eliminate this
   hypothesis and repeat.

- **Fix the problem, not the blame.** Whose code it is does not matter.
- **Fix the root cause, not the symptom.** If you cannot explain _why_ the fix
  works, you've hidden the bug, not found it.

**Common mistake:** making multiple changes at once. You lose the ability to
know which change fixed it, and you may introduce new bugs.

---

## Prove, Don't Assume

Every bug hunt fails at an unverified assumption.

- Suspect your own code first. OS, compiler, stdlib, and popular libraries are
  almost never broken.
- Read the actual stack trace and error; don't paraphrase in your head.
- Verify each assumption with a command or assertion, not inspection: "X is
  non-null" → log/assert. "Branch runs" → counter. "Row looks like Y" → `SELECT`
  it, don't trust the ORM.
- If an assumption can't be verified cheaply, treat it as unknown.

---

## Rubber-Duck Before Escalating

Trigger: stuck >15 minutes, about to ask a human, or about to open a new file
unrelated to the current hypothesis. Write (don't just think) a line-by-line
explanation of what the suspect code is supposed to do and what you observe.
Name every assumption. The bug usually falls out mid-sentence.

---

## Keep a Debug Log

For investigations longer than ~3 experiments, keep a running log
(`| # | Hypothesis | Experiment | Result | Eliminates? |`) so you don't re-run
experiments or lose track of what's left to try.

---

## Minimal Reproduction as the Meta-Skill

Before investigating, **reduce the problem to its minimum reproducible form**.

A minimal reproduction:

- Fails in the same way as the original bug.
- Contains no code unrelated to the bug.
- Is small enough to read in one sitting.

Why it matters:

- The act of reducing often reveals the bug.
- It gives you a fast feedback loop.
- It makes the bug shareable for help or bug reports.
- It excludes confounding variables.

Reduction process: start from the failing case. Remove pieces one at a time. If
removing a piece makes it pass, it was necessary — put it back. Repeat until you
cannot remove anything without making it pass.

When manual reduction is slow or the input is large, automate:

- Input: `creduce` (C/C++), `shrinkray`, Hypothesis `@given` shrinker, or a
  hand-rolled `ddmin`.
- History: `git bisect run <script>`.
- Config: bisect feature flags / env vars the same way.

Stop when further removal makes the failure disappear — that's the 1-minimal
case.

---

## Binary Search Everywhere

Binary search is the universal debugging tool. Halve the search space at every
step.

**`git bisect` for regressions:** (see `git-workflow-depth` skill for full
detail)

```bash
git bisect start
git bisect bad HEAD
git bisect good v2.1.0
git bisect run ./test-regression.sh
```

**Binary search in code:** comment out half the code (or add an early return).
Still fails? The bug is in the first half. Passes? The bug is in the second
half.

**Binary search in inputs:** if a large input triggers the bug, try half the
input. Narrow the input until it's minimal.

**Binary search in time:** if a bug appears "after a while," add timestamps to
narrow when it occurs.

---

## Tracer Bullets for Distributed Systems

When you can't attach a debugger (distributed system, production-only bug,
timing-sensitive issue), use tracer bullets: add logging or metrics at strategic
points to triangulate where the request diverges from the expected path.

```python
logger.info("payment_started", trace_id=trace_id, order_id=order_id)
# ... code ...
logger.info("payment_charge_called", trace_id=trace_id, amount=amount)
# ... code ...
logger.info("payment_completed", trace_id=trace_id, charge_id=charge_id)
```

With structured logging and a trace_id, you can follow one request across all
services. See `observability-for-services` skill.

**Log the decision, not just the path:** "skipping email — user opted out" is
more useful than "email not sent."

---

## printf Debugging vs Debugger — When to Use Which

| Situation                                    | Prefer                                           |
| -------------------------------------------- | ------------------------------------------------ |
| Fast-moving loop or recursive function       | printf/logging (debugger pauses are too slow)    |
| Production system, can't attach debugger     | Structured logging with trace_id                 |
| Timing-sensitive bug (races, timing)         | Logging (debugger changes timing, hides the bug) |
| Complex object state to inspect              | Debugger (interactive exploration is faster)     |
| Single-threaded, can reproduce locally       | Debugger                                         |
| Third-party library call failing             | Debugger (step into the library)                 |
| Bug depends on past state you no longer have | `rr` + `reverse-continue`                        |

**Rule:** if adding print statements changes whether the bug occurs, you have a
Heisenbug (see below). Switch to a non-invasive observation method.

---

## Heisenbug Strategies

A Heisenbug is a bug that disappears or changes behaviour when you try to
observe it. Common causes:

**Timing:** the bug is a race condition. Observation (print, debugger) changes
timing.

- Use `rr` (Mozilla's record-and-replay debugger) — records execution
  deterministically, replay for debugging.
- Use `Pernosco` (cloud-hosted rr for collaborative debugging).
- Use sanitisers: ThreadSanitizer (TSan) for race conditions, AddressSanitizer
  (ASan) for memory errors, MemorySanitizer (MSan) for uninitialised reads.

**`rr` workflow for corruption/state bugs:** `rr record` → `rr replay` →
watchpoint on the bad value → `reverse-continue` to the write that caused it.
For flaky races: `rr record --chaos`.

**Resource contention:** the extra observation code changes allocation or GC
behaviour.

- Reduce the test case. If the bug disappears with a smaller input, the root
  cause is resource-related.

**Optimisation:** the compiler optimises away the bug in release mode, or the
debugger disables optimisations.

- Test in the same build mode as production.
- Check for undefined behaviour (use UBSan in C/C++).

**Order-dependent state:** the bug depends on execution order that
instrumentation changes.

- Log entry/exit of all relevant functions with timestamps.
- Look for state that persists between test runs (DB rows, temp files, global
  variables).

---

## Blameless Post-Mortem (Google SRE Structure)

The goal of a post-mortem is to learn and prevent recurrence — not to assign
blame. Blameless post-mortems produce better outcomes because people share
information honestly.

**Structure:**

**Summary (2–3 sentences):** What failed, for how long, what was the impact.

**Timeline:** chronological sequence of events with timestamps. Include: when
the problem started, when it was detected, what actions were taken, when it was
resolved.

**Root cause(s):** "5 Whys" analysis. Not "the server crashed" but "the server
crashed because the memory limit was reached because..." Trace back to the
proximate cause and contributing systemic causes. 5 Whys anchors on one chain;
with multiple contributing factors, add a fishbone diagram or fault tree.

**Impact:** quantified. Users affected, requests failed, revenue lost, SLO burn.

**Contributing factors:** what made this possible? (Missing monitoring, unclear
runbook, confusing config, insufficient testing).

**Action items:** each item has an owner, a deadline, and is tracked.
Categories:

- Mitigate recurrence (fix the immediate cause)
- Detect sooner (improve alerting/monitoring)
- Prevent (address systemic cause)

**Do not:** name individuals, use language like "human error" as a root cause
(it's always a system design problem), or let action items go unassigned.

---

## Isolate-by-Layer Procedure

For a bug in a layered system, eliminate layers from the bottom up:

1. **Data layer:** is the data in the DB correct? Query directly.
2. **Service layer:** does the service return the correct result when called
   directly (curl, postman)?
3. **Integration layer:** does the integration between services work? Check the
   message in the queue.
4. **Application layer:** is the frontend rendering the correct data it
   receives?

Once you know which layer is wrong, focus investigation there. Do not debug the
frontend if the API is returning wrong data.

---

## Canon

- Kernighan & Pike, _The Practice of Programming_, Ch. 5 —
  https://www.cs.princeton.edu/~bwk/tpop.webpage/debugging.html
- Hunt & Thomas, _The Pragmatic Programmer_ tips — https://pragprog.com/tips/
- Delta debugging / `ddmin` — https://en.wikipedia.org/wiki/Delta_debugging ·
  Evans, _A debugging manifesto_ —
  https://jvns.ca/blog/2022/12/08/a-debugging-manifesto/
- `rr` — https://rr-project.org/ · Rubber-duck debugging —
  https://rubberduckdebugging.com/ · Google SRE Workbook _Postmortem Culture_ —
  https://sre.google/workbook/postmortem-culture/
