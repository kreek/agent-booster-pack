---
name: performance
description: >-
  Use for performance work: slowness, profiling, flame graphs,
  micro-benchmarks, latency, p99, allocation rate, pprof, py-spy, perf, and
  async-profiler.
---

# Performance

## Iron Law

`MEASURE BEFORE OPTIMISING. MEASURE AGAIN BEFORE KEEPING THE CHANGE.`

## When to Use

- Diagnosing slowness, optimizing latency/throughput/allocation,
  reading profiles, designing benchmarks, investigating p99/p99.9, or
  deciding whether a performance change is worth it.

## When NOT to Use

- Concurrency correctness without measured slowness; use
  `concurrency`.
- Database query safety without profiling context; use `database`.
- Caching design; use `caching`.

## Core Ideas

1. Name the target metric before changing code.
2. Use a realistic workload and identical before/after conditions.
3. Optimize the measured bottleneck, not the suspicious-looking code.
4. Tail latency matters; averages hide user pain.
5. CPU, off-CPU, memory, allocation, I/O, lock contention, and
   network wait are different problems.
6. Micro-benchmarks prove local mechanics, not end-to-end wins.
7. Keep complexity only when the measured gain justifies it.

## Workflow

1. Define the metric: p99 latency, throughput, CPU time, allocation
   rate, memory, or error budget impact. Capture baseline with
   production-shaped data and concurrency.
2. Profile to find the dominant bottleneck. Make one change.
3. Re-measure under the same conditions. Check adjacent regressions:
   memory, error rate, tail latency, CPU, maintainability.

## Verification

- [ ] Target metric is named and user/business relevance is clear.
- [ ] Baseline and after measurements use the same workload and
      environment; raw results or profile artifacts are saved.
- [ ] Only one performance change is measured per commit.
- [ ] Off-CPU and allocation behavior were considered where relevant.
- [ ] Load generator avoids coordinated omission for latency work.
- [ ] Adjacent metrics did not regress enough to erase the win.
- [ ] Added complexity is justified by measured improvement.

## Handoffs

- Use `database` for query plans, indexes, and migration risk.
- Use `observability` for production validation and continuous
  profiling.
- Use `caching` only after measurement shows repeated expensive work
  or I/O.

## References

- Flame graphs: <https://www.brendangregg.com/flamegraphs.html>
- USE method: <https://www.brendangregg.com/usemethod.html>
- Coordinated omission:
  <https://groups.google.com/g/mechanical-sympathy/c/icNZJejUHfE/m/BfDekfBEs_sJ>
