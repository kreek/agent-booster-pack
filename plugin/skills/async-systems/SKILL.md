---
name: async-systems
description: Use for async systems, concurrency, queues, streams, pub/sub, ordering, and backpressure.
---

# Async Systems

## Iron Law

`EVERY ASYNC BOUNDARY NAMES OWNERSHIP, LIFETIME, BACKPRESSURE, AND FAILURE SEMANTICS.`

Async work fails when ownership, cancellation, retry, ordering, and
visibility are implicit.

## Default Stance

For user-facing live updates, start with polling, SSE, or WebSockets.
Escalate to Kafka/Kinesis/Redis Streams only after naming the
requirement the simpler transport cannot satisfy: independent replay,
long retention, audit history, offline catch-up, multi-service fanout,
consumer-group scaling, partitioned throughput, or durable recovery.

## When to Use

- Designing or reviewing async, threaded, actor, queue, lock, channel,
  cancellation, worker-pool, background-job, scheduler, delayed job,
  event stream, live update, pub/sub, subscription, fanout, SSE,
  WebSocket, Kafka, Kinesis, or Redis Streams work.
- Debugging races, deadlocks, stuck tasks, event-loop blocking, thread
  starvation, unbounded memory growth, retry exhaustion, dead jobs,
  lag, poison messages, replay, ordering, or delivery issues.

## When NOT to Use

- Ordinary request/response API design only; use `api`.
- Remote-call timeout/circuit-breaker policy outside async mechanics;
  use `error-handling`.
- Metrics, dashboards, alerts, and runbooks only; use
  `observability`.
- Performance measurement without async design changes; use
  `performance`.
- Database transaction isolation; use `database`.

## Core Ideas

1. Values move across boundaries; mutable places stay owned.
2. Every spawned task belongs to a scope that cancels, awaits, or
   supervises it.
3. Every queue, channel, worker pool, semaphore, stream, and buffer has
   a bound and overflow policy.
4. Locks are an escape hatch: keep them short, ordered, and away from
   I/O, awaits, or callbacks.
5. Job payloads contain stable identifiers and immutable inputs, not
   live session/request/thread-local state.
6. Retried jobs and stream consumers are idempotent, deduplicated, or
   explicitly non-retryable.
7. Event schemas are contracts; version them and keep consumers
   compatible.
8. Delivery guarantees, ordering keys, retention, replay, offsets,
   DLQs, retry budgets, and poison-message handling are explicit.
9. Silent async failure is a bug: exhausted jobs, lag, dropped events,
   and dead work need visible signals.

## Tripwires

| Trigger | Do this instead | False alarm |
|---|---|---|
| Payload reads session, request, thread-local, or in-memory state. | Pass stable IDs and immutable parameters, then reload needed state in the job. | In-process async task that never leaves the request lifecycle. |
| Retry settings are defaulted, unbounded, or copied. | Name retryable errors, budget, backoff, and terminal behavior. | Job is explicitly non-retryable and records terminal failure. |
| Worker rescues and only logs. | Re-raise, mark terminal, or record failure visibly. | Best-effort cleanup job with documented discard semantics. |
| Enqueue happens before transaction commit. | Enqueue after commit or use transactional outbox/enqueue. | Job reads no state written by the transaction. |
| Bulk queue can starve user-facing work. | Set priority, concurrency, timeout, or separate queues. | Dedicated worker pool with isolation already proven. |

## Workflow

1. Name producers, consumers, shared state, owners, transport, queue,
   broker, lifecycle, and user-visible latency expectation.
2. Pick the simplest coordination/transport that preserves ownership.
   For live updates, try polling/SSE/WebSockets first; if a broker is
   chosen, record the requirement that forced it.
3. Define task scope, cancellation path, shutdown behavior, queue
   bounds, overflow behavior, lock ordering, worker concurrency,
   timeout, retry budget, backoff, and terminal failure behavior.
4. For jobs, design payload shape, idempotency, uniqueness, enqueue
   atomicity, queue priority, and deploy compatibility.
5. For streams, define event schema, versioning, partition/order key,
   delivery guarantee, retention, replay, offset/ack behavior,
   poison-message policy, DLQ, and backpressure.
6. Add observability for enqueue/start/success/retry/exhaustion,
   latency, queue depth, dead jobs, lag, throughput, errors,
   reconnects, dropped events, and consumer health.
7. Test contention, cancellation, shutdown, duplicate execution,
   retry exhaustion, missing/changing data, expired sessions,
   duplicates, reordering, drops, reconnects, replay, slow consumers,
   and poison messages as applicable.

## Verification

- [ ] Every task has a governing scope and deterministic shutdown
      path.
- [ ] Every queue/channel/pool/stream/buffer is bounded with an
      explicit overflow policy.
- [ ] No lock is held across I/O, await/yield, or user callbacks; lock
      acquisition order is global where multiple locks remain.
- [ ] Blocking work cannot starve async or latency-sensitive work.
- [ ] Payloads use stable IDs and immutable data; they do not rely on
      request, session, thread-local, open connection, or in-memory
      object state.
- [ ] Retry policy has bounded attempts, delay/backoff, and terminal
      handling.
- [ ] Retried side effects are idempotent, deduplicated, or marked
      non-retryable with a documented reason.
- [ ] Polling, SSE, or WebSockets were considered first for
      user-facing live updates; any broker choice names the specific
      requirement simple HTTP/browser streaming could not satisfy.
- [ ] Event schema, versioning, delivery guarantee, ordering key,
      retention, replay, offset/ack, DLQ, and poison-message handling
      are explicit where streams are involved.
- [ ] Async failure modes are observable and tested.

## Handoffs

- Use `domain-modeling` to remove shared mutable state from the core
  design.
- Use `api` for public subscription, webhook, SSE, or event-contract
  surface.
- Use `error-handling` for retry budgets and dependency failure
  behavior outside async mechanics.
- Use `database` for transactional enqueue, outbox/CDC atomicity,
  locking, isolation, and schema changes async work depends on.
- Use `observability` for dashboards, alerts, traces, and runbooks.
- Use `release` for worker draining, deploy compatibility, migration
  coordination, and rollout gates.
- Use `debugging` for existing races, deadlocks, stuck jobs, or lag
  before changing code.

## References

- `references/browser-streaming.md`: polling, SSE, and WebSocket
  choices.
- `references/kafka.md`: topics, partitions, consumer groups, offsets,
  delivery semantics.
- `references/kinesis.md`: streams, shards, partition keys, sequence
  numbers, retention, consumers.
- `references/redis-streams.md`: Redis Streams, consumer groups,
  pending entries, acknowledgements, claiming.
- "The Value of Values": <https://www.infoq.com/presentations/Value-Values/>
- Structured concurrency overview:
  <https://en.wikipedia.org/wiki/Structured_concurrency>
