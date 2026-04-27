---
name: background-jobs
description: >-
  Use for background jobs, async workers, queues, schedulers, retries, dead or
  poison jobs, uniqueness, priorities, worker concurrency, and job payloads.
---

# Background Jobs

## Iron Law

`EVERY JOB IS SELF-SUFFICIENT, RETRY-SAFE, AND OBSERVABLY FAILED.`

## When to Use

- Adding, changing, or reviewing background jobs, workers, queue
  consumers, schedulers, delayed/periodic jobs, or async task
  processors.
- Choosing job payloads, retry behavior, uniqueness, queue priority,
  worker concurrency, dead-letter handling, or failure visibility.

## When NOT to Use

- In-process task coordination only; use `concurrency`.
- Event stream topology, broker selection, offsets, replay, fanout;
  use `realtime`.
- Remote-call timeout/circuit-breaker policy outside job mechanics; use
  `error-handling`.
- Dashboard/metric/alert/runbook design only; use `observability`.

## Core Ideas

1. A job payload contains stable identifiers and immutable inputs, not
   live session state, request objects, open connections, or ambient
   auth context. A job can complete after the user logs out, the
   session expires, the request is gone, or a new version of the app
   is deployed.
2. Retried jobs are idempotent, deduplicated, or explicitly
   non-retryable. Retries have a bounded budget, backoff with jitter
   where supported, and a clear terminal state.
3. Silent failure is a bug: every exhausted, discarded, or dead job is
   visible through logs, metrics, alerts, or an operator-facing dead
   set.
4. Job side effects happen in a safe order: persist state before
   enqueueing, or use an outbox/transactional enqueue when enqueue and
   state must agree. Consumers are idempotent and poison-message aware.
5. Queue names, priorities, concurrency, and timeouts protect
   user-facing work from slow, noisy, or bulk jobs.
6. Job schemas are versioned enough for old enqueued jobs to survive
   deploys.

## Tripwires

| Trigger | Do this instead | False alarm |
|---|---|---|
| Payload reads session, request, thread-local, or in-memory state. | Pass stable IDs and immutable parameters, then reload needed state in the job. | In-process async task that never leaves the request lifecycle. |
| Retry settings are defaulted, unbounded, or copied. | Name retryable errors, budget, backoff, and terminal behavior. | Job is explicitly non-retryable and records terminal failure. |
| Worker rescues and only logs. | Re-raise, mark terminal, or record failure visibly. | Best-effort cleanup job with documented discard semantics. |
| Payload stores records, serialized models, credentials, or mutable snapshots. | Store identifiers and non-secret immutable values. | Tiny immutable value object with versioned schema and no secrets. |
| Enqueue happens before transaction commit. | Enqueue after commit or use transactional outbox/enqueue. | Job reads no state written by the transaction. |
| Bulk queue can starve user-facing work. | Set priority, concurrency, timeout, or separate queues. | Dedicated worker pool with isolation already proven. |

## Workflow

1. Name the job's purpose, trigger, queue, expected runtime, and side
   effects. Design the payload: stable IDs, immutable parameters,
   actor/tenant context, no request/session-only state.
2. Define idempotency, uniqueness, retry budget, backoff, timeout, and
   terminal failure behavior before writing the worker body.
3. Make dependencies explicit: reload records, re-check permissions or
   business state, handle deleted/changed data as normal outcomes.
   Add observability for enqueue, start, success, retry, exhaustion,
   discard, latency, queue depth, and dead jobs.
4. Test success, retryable failure, exhausted retries, duplicate
   execution, missing records, expired sessions, and shutdown during
   work.

## Verification

- [ ] Payload uses stable IDs and immutable data; it does not rely on
      request, session, thread-local, open connection, or in-memory
      object state.
- [ ] Job can run after logout, session expiry, request completion,
      and deploy.
- [ ] Retry policy has bounded attempts, delay/backoff, and terminal
      handling.
- [ ] Retried side effects are idempotent, deduplicated, or marked
      non-retryable with a documented reason.
- [ ] Exhausted, discarded, dead, or poison jobs cannot fail silently.
- [ ] Job enqueue and related state changes cannot diverge silently.
- [ ] Queue priority, worker concurrency, timeout, and shutdown
      behavior are explicit.
- [ ] Tests cover duplicate execution, retry exhaustion,
      missing/changing data, expired session context, and worker
      restart or shutdown.

## Handoffs

- Use `error-handling` for remote-call timeouts, retry budgets, and
  circuit breakers inside or around jobs.
- Use `concurrency` for worker pools, locks, cancellation, queue
  bounds, and backpressure inside the process.
- Use `observability` for metrics, traces, dashboards, alerts, and
  runbooks.
- Use `deployment` for worker draining, deploy compatibility, and
  migration coordination.
- Use `database` for transactional enqueue, locking, isolation, and
  schema changes that jobs depend on.
