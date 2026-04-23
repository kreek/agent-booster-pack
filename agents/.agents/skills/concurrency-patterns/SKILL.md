---
name: concurrency-patterns
description: Use when writing multi-threaded code, picking async/await vs threads vs actors, choosing lock types, preventing deadlocks, designing message-passing or channel-based systems, or handling backpressure. Also use when the user mentions race conditions, goroutines, virtual threads, the actor model, or asks why their async code is blocking.
---

# Concurrency Patterns

## Lock Type Selection

Choose the narrowest lock that satisfies your requirement:

| Lock type | Use when |
|---|---|
| **Mutex** | One writer, one reader at a time; general case |
| **RWMutex / RWLock** | Many concurrent readers, infrequent writers |
| **Semaphore** | Limiting concurrent access to N (e.g. connection pool, rate limiter) |
| **Spinlock** | Very short critical sections where context-switch cost > wait time; use only in performance-critical native code |
| **Atomic operations** | Single-variable updates (counters, flags); no lock needed |

Default to Mutex. Upgrade to RWLock only if profiling confirms read contention. Spinlocks are almost never appropriate in application code.

---

## Deadlock Prevention: Global Lock Ordering

The only reliable way to prevent deadlocks from circular lock acquisition is to **always acquire locks in a globally consistent order**.

```
Locks: A, B, C

Rule: acquire in alphabetical order.

Thread 1: acquire A, then B  ✓
Thread 2: acquire A, then B  ✓ (blocks until Thread 1 releases)

Thread 1: acquire A, then B  ✗ (classic deadlock setup)
Thread 2: acquire B, then A  ✗
```

Define the order at the module or system level and document it. If you ever find yourself acquiring locks in different orders in different code paths, you have a deadlock waiting to happen.

Other deadlock rules:
- Never hold a lock while waiting for I/O.
- Never call user-provided callbacks while holding a lock.
- Use `trylock` with timeout as a diagnostic: if it fires, you have a deadlock.

---

## Function Colouring and Colourless Alternatives

Bob Nystrom's "What Color Is Your Function" problem: in languages with `async/await`, async functions can only be called from async functions. This viral coloring splits the codebase into two worlds that don't compose cleanly.

**Colourless concurrency models:**
- **Goroutines** (Go): any function can spawn a goroutine; no colour distinction. Lightweight threads multiplexed on OS threads.
- **JVM Virtual Threads** (Java 21+): blocking a virtual thread is cheap; no need to mark functions async. Structured concurrency via `StructuredTaskScope`.
- **Erlang/Elixir processes**: each process is independent; message passing is universal. No colour problem.

When using coloured concurrency (async/await in Python, JS, Rust):
- Don't block inside async functions. Blocking in async context blocks the executor thread for all other coroutines.
- Use `asyncio.to_thread()` (Python) or `spawn_blocking` (Tokio/Rust) to offload blocking work.
- Don't mix sync and async code in the same call stack without isolation.

---

## Message Passing Over Shared Memory

**Shared mutable state** is the root cause of most concurrency bugs. Every piece of shared state is a potential race condition.

**Prefer message passing:** send values between threads/goroutines via channels. The sender gives up ownership; the receiver is the only actor with access.

```go
// Go: channels for coordination
jobs := make(chan Job, 100)  // buffered channel

// Producer
go func() {
    for _, j := range jobList {
        jobs <- j
    }
    close(jobs)
}()

// Consumer pool
for i := 0; i < workers; i++ {
    go func() {
        for job := range jobs {
            process(job)
        }
    }()
}
```

CSP (Communicating Sequential Processes): the model behind Go's channels and similar systems. "Do not communicate by sharing memory; share memory by communicating."

---

## Actor Model for Stateful Entities

The actor model gives each entity its own state and a mailbox. State is never shared — it's modified only in response to messages.

Use actors when: each entity (user session, order, game entity) has its own lifecycle and state that multiple clients access concurrently.

```
Client → [OrderActor: order-123 mailbox] → processes messages one at a time
                                         → state: {status, items, total}
```

No locks needed: the actor processes messages sequentially. No shared state: each actor owns its data exclusively.

Frameworks: Akka (JVM), Orleans (.NET), Elixir/OTP (built-in), `xactor` (Rust), `kameo` (Rust).

---

## Backpressure Is Not Optional

A fast producer sending to a slow consumer will eventually exhaust memory, causing an OOM crash. Backpressure is the mechanism by which the consumer signals its capacity to the producer.

**Always use bounded channels.** An unbounded channel is a memory leak waiting to happen.

```go
// Bad: unbounded - producer can outrun consumer indefinitely
jobs := make(chan Job)

// Good: bounded - producer blocks when consumer is full
jobs := make(chan Job, 100)
```

When the buffer is full, the producer must either:
1. **Block** and wait (simplest; can cause upstream backpressure to propagate)
2. **Drop** with logging and metric increment (for lossy workloads)
3. **Return an error** (for synchronous callers)

Define the overflow policy explicitly. "What happens when the queue is full?" must be answered before shipping.

---

## Work Queue Bulkheads per Latency Class

Don't let slow jobs block fast jobs. Use separate queues (or thread pools) for different latency classes.

```
HTTP requests → [fast pool: 20 threads, timeout: 500ms]
Background jobs → [slow pool: 5 threads, timeout: 30s]
Email sending → [io pool: 10 threads, timeout: 10s]
```

This is the bulkhead pattern applied to your own thread pools. A flood of slow background jobs cannot starve request handling threads.

**Sizing:** each pool should be sized for its latency class. Fast pools can be larger (threads spend most time waiting for CPU). Slow pools should be smaller (threads spend time waiting for I/O, but you don't want too many).

---

## Common Async Pitfalls

| Pitfall | Symptom | Fix |
|---|---|---|
| Blocking in async context | All requests stall when one blocks | Use `spawn_blocking` / `to_thread` |
| Forgetting to await | Silent no-op in Python/JS | Linter rules: `asyncio-mode`, `no-floating-promises` |
| Spawning unbounded tasks | OOM under load | Use a semaphore to limit concurrent spawns |
| Cancellation not handled | Resources leaked on timeout | Use `defer`/`finally`/RAII for cleanup |
| Shared mutable state in tasks | Race conditions | Prefer message passing or `Arc<Mutex<T>>` |
