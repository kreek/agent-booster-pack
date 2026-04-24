---
name: performance-profiling
description:
  Use when optimising performance, diagnosing slowness, reading flame graphs,
  deciding what to optimise, running micro-benchmarks, or when the user mentions
  profiling tools like pprof, py-spy, perf, async-profiler, or asks about tail
  latency, p99, allocation rate, or Amdahl's law.
---

# Performance Profiling

## Measure First, Optimise Second, Measure Again

Never optimise without profiling. You will guess wrong.

**Check Big-O before profiling.** `O(n²)` on growing `n` beats any micro-tune.
Fix algorithm or data structure first; profile the rest.

**Instrument end-to-end first.** Time every boundary (ingress, cache, DB,
downstream RPCs, egress) on a single request. Flame graphs localise hot
functions; stage-level timing localises the hot stage. Do stage-level before
function-level.

The process:

1. Define the performance target (p99 < 200ms, throughput > 10k req/s).
2. Reproduce the problem under realistic load.
3. Profile to find the bottleneck.
4. Change exactly one thing.
5. Measure again under the same conditions.
6. If the target is met, stop. Otherwise, go to step 3.

**One change, recorded.** One commit per optimisation; attach before/after
profile and target-metric delta. Reject changes with no measured win on the
target workload, however "obviously faster" they look.

**Premature optimisation is the root of all evil.** Optimise only what profiling
identifies as the bottleneck. The rest is wasted complexity.

---

## Flame Graphs

A flame graph visualises where a profiler spent its time. The x-axis is
population (how often a stack was sampled), the y-axis is stack depth. Wide bars
at the top are where time is being spent.

**Reading a flame graph:**

- Find the widest bar at the highest position — that's the bottleneck.
- Ignore narrow bars — they're not statistically significant.
- The bar at the bottom of a plateau with many identical children — that's the
  function doing all the work.

**On-CPU flame graphs:** show where CPU time is spent. For CPU-bound workloads.
**Off-CPU flame graphs:** show where threads are blocked (waiting for I/O,
locks, sleep). For I/O-bound and lock-contended workloads. Don't ignore off-CPU
— an application can be "slow" entirely due to off-CPU time.

**Tools:** | Runtime | Tool | |---|---| | Go | `pprof` — `go tool pprof`, or
`net/http/pprof` in process | | Python | `py-spy` (zero-overhead, attach to
running process) | | JVM | `async-profiler` (low overhead, JFR, JVMTI) | | Rust
| `cargo flamegraph`, `perf` | | Linux | `perf record` + `perf script` →
`flamegraph.pl` | | Node.js | `--prof` flag + `node --prof-process` |

**Continuous profiling in prod.** Prefer always-on eBPF profilers (Parca,
Pyroscope) over one-shot captures. Overhead <1%. Diff profiles across deploys to
attribute regressions.

**When sampling lies.** If work is spread across many small frames, or
optimising the widest bar produces no speedup, switch to causal profiling (Coz)
or A/B time the suspected path. Sampling shows where time is spent, not where a
speed-up would move end-to-end latency.

---

## Diagnosing CPU vs I/O vs Memory Bound

Before profiling, determine which resource is the bottleneck:

**CPU-bound:** CPU utilisation is high (>70%), and adding more CPU improves
throughput proportionally. Check with `top`/`htop`; on-CPU flame graph.

**CPU-bound red flags:** false sharing (hot atomics on the same 64-byte cache
line → pad), branch misprediction, unaligned access, cold-page faults. Check
with `perf stat -e cache-misses,branch-misses,LLC-load-misses`.

**I/O-bound:** CPU is low but threads are waiting. Check `iostat`, `dstat`,
off-CPU flame graph. Common causes: slow DB queries, network calls without
connection pooling, disk reads.

**Memory-bound:** high allocation rate causes GC pressure; throughput drops as
GC pauses increase. Check GC logs, allocation profiler (JFR
`jdk.ObjectAllocationInNewTLAB`, Go `pprof --alloc_objects`).

**Lock-bound:** threads waiting for each other. Off-CPU flame graph will show
lock contention. Check with `perf lock`, thread dumps.

---

## Amdahl's Law — Finding the Real Bottleneck

Amdahl's law: if `p` is the fraction of work that can be parallelised, and `s`
is the speedup of the parallel part, the overall speedup is bounded by
`1 / (1 - p)` as `s → ∞`.

**Implication:** the serial portion of your code is an absolute ceiling on
throughput. No amount of scaling or parallelisation can exceed it.

**Practical lesson:** find and eliminate serial bottlenecks first. If 10% of
your request handling is single-threaded (global lock, sequential step), you can
never scale beyond 10× regardless of how many machines you add.

---

## Latency Is a Distribution — Track p99 and p99.9

Never average latencies. Never average percentiles. Always report a
distribution; track p50, p95, p99, and p99.9 when the service composes with
fan-out ≥ 10.

A service with mean latency of 10ms might have p99 of 2s. That means 1 in 100
requests is terrible. At 1000 req/s, that's 10 users per second having a bad
experience.

**Always track:**

- p50 (median) — typical case
- p95 — the boundary of "normal" variation
- p99 — tail latency
- p99.9 — very tail latency (important for internal services that compose)

**Why tail latency matters for composed services:** if a service makes 100
parallel calls and each has p99 latency of 100ms, the overall p99 of the fan-out
is roughly `1 - (0.99)^100 ≈ 63%`. At scale, tail latency is your average
latency.

**Coordinated omission.** Load generators that wait for a slow response before
the next request silently drop bad samples. Use constant-rate generators (wrk2,
k6 `constant-arrival-rate`, Gatling `constantUsersPerSec`) or record
intended-send timestamps; store in HdrHistogram with an expected interval. Never
average percentiles across shards.

**Mitigation:** hedged requests (send duplicate requests after a delay, use the
first response), load balancing with latency awareness, timeout + retry.

---

## Micro-Benchmark Traps

Micro-benchmarks are easily misleading. Common traps:

**JIT warmup:** the JVM (and V8, .NET) JIT-compiles hot code paths at runtime. A
cold benchmark measures interpreted/unoptimised code. Always warm up before
measuring.

**Dead code elimination:** compilers can eliminate code that produces no
observable output. If your benchmark doesn't use the result, the compiler may
remove the computation entirely.

```java
// Bad: result unused, compiler may eliminate
for (int i = 0; i < N; i++) { sqrt(i); }

// Good: use the result
long sum = 0;
for (int i = 0; i < N; i++) { sum += sqrt(i); }
Blackhole.consume(sum);  // JMH
```

**Cache effects:** a benchmark that fits in L1 cache will look much faster than
production code operating on real data sizes.

**Isolated benchmarks miss interactions:** benchmarking a function in isolation
misses contention, GC pressure, and cache effects from adjacent code.

Use benchmark frameworks: JMH (JVM), `criterion` (Rust), `timeit` +
`pytest-benchmark` (Python), `testing.B` (Go). Profile production, not just
benchmarks. If a result isn't consumed (returned, Blackhole-d, volatile sink),
assume the compiler deleted it — verify with `-XX:+PrintCompilation` or the
framework's assembly dump.

---

## Allocation Rate in GC Languages

In GC languages (Java, Go, Python, Ruby, .NET), high allocation rate creates GC
pressure — the collector runs more frequently, causing pauses and throughput
loss.

**Finding allocations:**

- Java: JFR allocation profiler, async-profiler `-e alloc`
- Go: `pprof --alloc_objects` (count) and `--alloc_space` (bytes)
- Python: `tracemalloc`, `memray`

**Common high-allocation patterns to fix:**

- String concatenation in a loop → use a builder/buffer
- Creating a new object per request for something that could be pooled
- Unnecessary boxing (int → Integer in Java)
- Intermediate collections (`.filter().map().collect()` chains in Java Stream)

**Object pooling** for expensive-to-allocate objects: `sync.Pool` (Go), object
pools in Java. But measure first — pooling adds complexity and only helps when
allocation is the bottleneck.

**Bytes are not cost.** GC pause time and throughput are the metrics, not
allocation bytes. Confirm with GC logs (`-Xlog:gc*`, `GODEBUG=gctrace=1`) before
rewriting allocation sites.

---

## USE Method for Resource Saturation

For each resource (CPU, memory, disk, network, any queue):

- **Utilisation:** what percentage of time is it busy? (target: <70%)
- **Saturation:** is work queuing up? (run queue depth, lock wait queue)
- **Errors:** are error rates elevated?

High utilisation + high saturation = the bottleneck. High utilisation + low
saturation = healthy. Low utilisation + high saturation = something else is
gating the resource.

---

## Canon

- Pragmatic Programmer, "Algorithm Speed" —
  https://flylib.com/books/en/1.315.1.59/1/
- Gregg, flame graphs — https://www.brendangregg.com/flamegraphs.html
- Gregg, CPU flame graphs —
  https://www.brendangregg.com/FlameGraphs/cpuflamegraphs.html
- Gregg, USE method — https://www.brendangregg.com/usemethod.html
- Google SRE Book, monitoring distributed systems —
  https://sre.google/sre-book/monitoring-distributed-systems/
- Dean & Barroso, "Tail at Scale" —
  https://sre.google/static/pdf/calculus_of.pdf
- Tene, coordinated omission —
  https://groups.google.com/g/mechanical-sympathy/c/icNZJejUHfE/m/BfDekfBEs_sJ
- wrk2 — https://github.com/giltene/wrk2
- JMH benchmarking — https://shipilev.net/talks/devoxx-Nov2013-benchmarking.pdf
- Compiler blackholes —
  https://shipilev.net/jvm/anatomy-quarks/27-compiler-blackholes/
- Coz causal profiler — https://github.com/plasma-umass/coz
- False sharing —
  https://mechanical-sympathy.blogspot.com/2011/07/false-sharing.html
- Parca — https://www.parca.dev/
- Pyroscope eBPF —
  https://grafana.com/docs/pyroscope/latest/configure-client/grafana-alloy/ebpf/
