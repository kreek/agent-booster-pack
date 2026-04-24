---
name: concurrency-patterns
description:
  Use when writing multi-threaded code, picking async/await vs threads vs
  actors, choosing lock types, preventing deadlocks, designing message-passing
  or channel-based systems, or handling backpressure. Also use when the user
  mentions race conditions, goroutines, virtual threads, the actor model, or
  asks why their async code is blocking.
---

# Concurrency Patterns

## Identity, State, Value

Decompose before coordinating:

- **Value** — immutable; safe to share freely.
- **Identity** — a name for a succession of values over time.
- **State** — the value of an identity at a point in time.

Locks become necessary only when these three are conflated. Replace mutable
places with values whenever you can; coordinate identities only when you must.

---

## Coordination Primitive Ladder

Pick the lowest rung that fits. Do not skip rungs without justification.

| Rung | Primitive                                 | Use when                                                 |
| ---- | ----------------------------------------- | -------------------------------------------------------- |
| 1    | Pure function over values                 | No shared identity — no coordination needed              |
| 2    | Atomic reference / CAS on immutable value | Single identity, independent updates                     |
| 3    | STM / transactional refs                  | Coordinated updates across multiple identities           |
| 4    | Channel (CSP)                             | Producer/consumer decoupling, pipelines, fan-in/fan-out  |
| 5    | Actor / supervised process                | Per-entity lifecycle and mailbox semantics required      |
| 6    | Lock (escape hatch)                       | None of the above fit; a place genuinely must be guarded |

---

## Lock Type Selection (escape hatch)

When a lock is unavoidable, pick the narrowest:

| Lock type             | Use when                                                 |
| --------------------- | -------------------------------------------------------- |
| **Mutex**             | Default. One writer, one reader at a time                |
| **RWMutex / RWLock**  | Profiled read-heavy contention; beware write starvation  |
| **Semaphore**         | Bounded concurrency (pools, rate limiters, spawn limits) |
| **Atomic operations** | Single-variable counters/flags                           |
| **Spinlock**          | Native code, sub-microsecond critical sections only      |

RWLock is often a pessimisation — `Arc<immutable T>` replaces many of its use
cases. Default to Mutex; upgrade only on profiling evidence.

---

## Deadlock Prevention: Global Lock Ordering

Acquire locks in a globally consistent order. Define the order at module or
system level and document it.

```
Locks: A, B, C

Rule: acquire in alphabetical order.

Thread 1: acquire A, then B  ✓
Thread 2: acquire A, then B  ✓ (blocks until Thread 1 releases)

Thread 1: acquire A, then B  ✗ (classic deadlock setup)
Thread 2: acquire B, then A  ✗
```

Additional rules:

- Never hold a lock while waiting for I/O.
- Never call user-provided callbacks while holding a lock.
- Use `trylock` with timeout as a diagnostic: if it fires, you have a deadlock.

---

## Share Values, Not Places

Shared mutable state is the root cause of most concurrency bugs. The strong
form: don't share memory — share immutable values. The weaker form (Go proverb):
share memory _by_ communicating.

**Rules:**

- Send values across threads/tasks; the receiver becomes the sole owner.
- Prefer channels over actors when the consumer identity doesn't matter — actors
  couple producer to a specific mailbox.
- Prefer immutable snapshots over locked reads when the reader tolerates
  staleness.

```go
// Go: channels for coordination
jobs := make(chan Job, 100)  // buffered channel

go func() {
    for _, j := range jobList {
        jobs <- j
    }
    close(jobs)
}()

for i := 0; i < workers; i++ {
    go func() {
        for job := range jobs {
            process(job)
        }
    }()
}
```

---

## Actors for Stateful Entities

Use actors when each entity (user session, order, game entity) has its own
lifecycle, state, and mailbox. The actor processes messages sequentially — no
locks, no shared state.

```
Client → [OrderActor: order-123 mailbox] → processes messages one at a time
                                         → state: {status, items, total}
```

**Caveat:** actors couple the producer to a specific consumer identity. Channels
are more primitive and support `select`/`alt`. Reach for actors only when
mailbox + supervision semantics are genuinely required.

**Success pattern:** "let it crash" + supervision trees. Don't try/catch
defensively; let faulty processes die and let a supervisor restart them with
clean state.

Frameworks: Akka (JVM), Orleans (.NET), Elixir/OTP (built-in), `xactor` (Rust),
`kameo` (Rust).

---

## Structured Concurrency

Every spawn must have a scope that owns it. Parent waits for children;
cancellation propagates down the tree; exceptions are aggregated. No orphan
tasks, no goroutine leaks.

Runtime support: Java `StructuredTaskScope`, Python Trio nurseries, Kotlin
`coroutineScope`, Swift `TaskGroup`.

```python
# Trio nursery: all tasks die with the scope
async with trio.open_nursery() as nursery:
    nursery.start_soon(fetch, url_a)
    nursery.start_soon(fetch, url_b)
# Both tasks guaranteed complete or cancelled here.
```

Avoid raw `go`, `asyncio.create_task`, or `tokio::spawn` without a governing
scope, a join, or a cancel token.

---

## Cancellation Is First-Class

- Cancellation propagates at checkpoints (`.await`, `await`, explicit yield).
  CPU-bound loops must poll a cancel token or yield.
- Clean up with `defer` / `finally` / RAII — never in the middle of the happy
  path.
- Never swallow `Cancelled` / `CancellationError`: re-raise after cleanup.
- Set timeouts at scope boundaries, not at every call site.

---

## CPU-Bound vs I/O-Bound Executors

Never run CPU-bound work on an async runtime or on a virtual-thread carrier — it
starves every other task.

| Work         | Executor                                                     |
| ------------ | ------------------------------------------------------------ |
| I/O-bound    | Async runtime / virtual threads / goroutines                 |
| CPU-bound    | Dedicated thread pool (Rayon, `ExecutorService`)             |
| Blocking FFI | `spawn_blocking` / `asyncio.to_thread`, bounded by semaphore |

---

## Function Colouring

In languages with `async/await` (Python, JS, Rust), async functions can only be
called from async functions. This splits the codebase in two.

**Rules for coloured runtimes:**

- Never block inside an async function. Tokio's rule of thumb: no more than
  ~10–100 µs of CPU between `.await` points.
- Offload blocking work: `spawn_blocking` (Tokio), `asyncio.to_thread` (Python).
- Don't mix sync and async in the same call stack without isolation.

**Colourless runtimes** (goroutines, JVM virtual threads, BEAM processes) remove
the colour constraint. Where a modern runtime offers them, prefer
thread-per-task over async/await.

---

## Backpressure Is Not Optional

Fast producer + slow consumer + unbounded queue = OOM. Always bound. The same
principle applies to:

- **Channels/queues** — bounded capacity; unbuffered is capacity 0.
- **Task spawning** — bounded by semaphore.
- **HTTP client pools** — bounded connections and wait queue.

```text
# Bad: unbounded queue — memory grows until the process falls over
jobs = UnboundedQueue()

# Good: bounded queue/channel — producer blocks, drops, or errors when full
jobs = BoundedQueue(max_size=100)
```

In Go, `make(chan Job)` is an unbuffered channel with capacity 0: it provides
maximum backpressure. `make(chan Job, 100)` is also bounded; it allows a burst
of 100 items before applying backpressure.

When the bound is hit, the producer must either:

1. **Block** and propagate backpressure upstream.
2. **Drop** with logging + metric (lossy workloads).
3. **Return an error** (synchronous callers).

Define the overflow policy explicitly before shipping.

---

## Work Queue Bulkheads per Latency Class

Don't let slow jobs block fast jobs. Separate pools per latency class:

```
HTTP requests     → [fast pool: 20 threads, timeout: 500ms]
Background jobs   → [slow pool: 5 threads, timeout: 30s]
Email sending     → [io pool:   10 threads, timeout: 10s]
```

Fast pools can be larger; slow pools should be smaller. A flood of slow jobs
cannot starve request handling.

---

## Common Async Pitfalls

| Pitfall                       | Symptom                            | Fix                                                  |
| ----------------------------- | ---------------------------------- | ---------------------------------------------------- |
| Blocking in async context     | All requests stall when one blocks | Use `spawn_blocking` / `to_thread`                   |
| Forgetting to await           | Silent no-op in Python/JS          | Linter rules: `asyncio-mode`, `no-floating-promises` |
| Spawning unbounded tasks      | OOM under load                     | Semaphore to limit concurrent spawns                 |
| Cancellation not handled      | Resources leaked on timeout        | `defer` / `finally` / RAII for cleanup               |
| Orphaned spawns               | Leaked goroutines/tasks            | Structured scope owns every spawn                    |
| Shared mutable state in tasks | Race conditions                    | Send values; or `Arc<Mutex<T>>` as last resort       |

---

## Canon

- _Are We There Yet?_ — identity/state/value decomposition.
  https://www.infoq.com/presentations/Are-We-There-Yet-Rich-Hickey/
- _Simple Made Easy_ — complecting identity, value, and time.
  https://www.infoq.com/presentations/Simple-Made-Easy/
- _The Value of Values_. https://www.infoq.com/presentations/Value-Values/
- _core.async Rationale_ — channels, bounded buffering, backpressure.
  https://clojure.github.io/core.async/rationale.html
- _Clojure Concurrency_ — atoms, refs, agents.
  https://clojure.org/reference/atoms
- JEP 444: Virtual Threads. https://openjdk.org/jeps/444
- JEP 453: Structured Concurrency. https://openjdk.org/jeps/453
- _Notes on structured concurrency, or: Go statement considered harmful_.
  https://vorpus.org/blog/notes-on-structured-concurrency-or-go-statement-considered-harmful/
- _Making Reliable Distributed Systems in the Presence of Software Errors_ —
  let-it-crash, supervision trees.
  https://erlang.org/download/armstrong_thesis_2003.pdf
- _Go Concurrency Patterns_ and _Go Proverbs_.
  https://go.dev/talks/2012/concurrency.slide — https://go-proverbs.github.io/
- Tokio: _Async in depth_ and `spawn_blocking`.
  https://tokio.rs/tokio/tutorial/async —
  https://docs.rs/tokio/latest/tokio/task/fn.spawn_blocking.html
- _Async: What is blocking?_. https://ryhl.io/blog/async-what-is-blocking/
- _What Color Is Your Function?_.
  https://journal.stuffwithstuff.com/2015/02/01/what-color-is-your-function/
