---
name: concurrency
description:
  Use when writing multi-threaded code, picking async/await vs threads vs
  actors, choosing lock types, preventing deadlocks, designing message-passing
  or channel-based systems, or handling backpressure. Also use when the user
  mentions race conditions, goroutines, virtual threads, the actor model, or
  asks why their async code is blocking.
---

# Concurrency

## Iron Law

`SHARE VALUES, NOT PLACES. EVERY SPAWN HAS A BOUNDED LIFETIME AND BACKPRESSURE POLICY.`

Unbounded tasks, queues, and shared mutable places become production incidents
under load.

## When to Use

- Designing or reviewing async, threaded, actor, queue, lock, channel,
  cancellation, or worker-pool code.
- Debugging races, deadlocks, stuck tasks, event-loop blocking, thread
  starvation, or unbounded memory growth.

## When NOT to Use

- Remote-call resilience; use `resilience`.
- External event streams, brokers, subscriptions, offsets, lag, replay, or
  consumer groups; use `realtime`.
- Performance measurement without concurrency design changes; use `performance`.
- Database transaction isolation; use `database`.

## Core Ideas

1. Values move across boundaries; mutable places stay owned.
2. Every spawned task belongs to a scope that cancels, awaits, or supervises it.
3. Every queue, channel, worker pool, and semaphore has a bound and overflow
   policy.
4. Locks are an escape hatch: keep them short, ordered, and away from I/O or
   callbacks.
5. Cancellation is part of correctness, not cleanup afterthought.
6. Separate CPU-bound, blocking I/O, and async I/O work so one class cannot
   starve another.
7. Contended paths need tests or stress runs, not just happy-path unit tests.

## Workflow

1. Name the shared state, owner, and lifecycle.
2. Pick the simplest coordination primitive that preserves ownership.
3. Define task scope, cancellation path, queue bounds, and overflow behavior.
4. Prove deadlock avoidance through lock ordering or lock elimination.
5. Test contention, cancellation, timeout, and shutdown paths.

## Verification

- [ ] Every task has a governing scope and deterministic shutdown path.
- [ ] Every queue/channel/pool is bounded with an explicit overflow policy.
- [ ] No lock is held across I/O, await/yield, or user callbacks.
- [ ] Lock acquisition order is global and documented where multiple locks
      remain.
- [ ] Blocking work cannot starve async or latency-sensitive work.
- [ ] Cancellation runs cleanup and does not leak tasks or resources.
- [ ] Tests cover contended, timeout, cancel, and shutdown paths.
- [ ] Race/deadlock tools or stress tests are used where available.

## Handoffs

- Use `data` to remove shared mutable state from the core design.
- Use `realtime` for external stream/broker topology, delivery semantics,
  offsets, replay, and lag.
- Use `observability` when concurrency failure needs metrics, traces, or
  saturation dashboards.
- Use `debugging` for existing races or deadlocks before changing code.

## References

- Rich Hickey, "The Value of Values":
  <https://www.infoq.com/presentations/Value-Values/>
- Structured concurrency overview:
  <https://en.wikipedia.org/wiki/Structured_concurrency>
