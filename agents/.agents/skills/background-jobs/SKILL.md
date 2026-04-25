---
name: background-jobs
description:
  Use when designing, implementing, or reviewing background jobs, async workers,
  job queues, schedulers, delayed jobs, periodic jobs, task processors, or queue
  consumers. Also use when the user mentions Sidekiq, Celery, BullMQ, RQ, Oban,
  Faktory, Resque, delayed jobs, cron workers, retries, dead jobs, poison jobs,
  job uniqueness, queue priority, worker concurrency, or job payload design.
---

# Background Jobs

## Iron Law

`EVERY JOB IS SELF-SUFFICIENT, RETRY-SAFE, AND OBSERVABLY FAILED.`

Jobs run later, elsewhere, and often after the request, session, deployment, or
operator context that created them is gone.

## When to Use

- Adding, changing, or reviewing background jobs, workers, queue consumers,
  schedulers, delayed jobs, periodic jobs, or async task processors.
- Choosing job payloads, retry behavior, uniqueness, queue priority, worker
  concurrency, dead-letter handling, or failure visibility.

## When NOT to Use

- In-process task coordination only; use `concurrency`.
- Event stream topology, broker selection, offsets, replay, and fanout; use
  `realtime`.
- Remote-call timeout and circuit-breaker policy outside the job itself; use
  `resilience`.
- Dashboard, metric, alert, and runbook design only; use `observability`.

## Core Ideas

1. A job payload contains stable identifiers and immutable inputs, not live
   session state, request objects, open connections, or ambient auth context.
2. A job can complete after the user logs out, the session expires, the request
   is gone, or a new version of the app is deployed.
3. Retried jobs are idempotent, deduplicated, or explicitly non-retryable.
4. Retries have a bounded budget, backoff with jitter where supported, and a
   clear terminal state.
5. Silent failure is a bug: every exhausted, discarded, or dead job is visible
   through logs, metrics, alerts, or an operator-facing dead set.
6. Job side effects happen in a safe order: persist state before enqueueing, or
   use an outbox/transactional enqueue when enqueue and state must agree.
7. Queue names, priorities, concurrency, and timeouts protect user-facing work
   from slow, noisy, or bulk jobs.
8. Job schemas are versioned enough for old enqueued jobs to survive deploys.

## Common Rationalizations

| Excuse                                  | Reality                                                                                               |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| "The job starts immediately."           | It can still run after session expiry, deploy, retry delay, queue backup, or worker restart.          |
| "The framework handles retries."        | The framework retries execution, not side-effect safety, deduplication, or terminal failure handling. |
| "Failures are in the worker logs."      | Logs without metrics, alerts, or dead-job review still let important failures disappear.              |
| "This job only sends an email/webhook." | External side effects still need idempotency, duplicate handling, and visible exhaustion.             |

## Red Flags

- Job reads from session, request context, thread-local user state, or in-memory
  objects captured at enqueue time.
- Retry settings are defaulted, unbounded, or copied without naming which errors
  are retryable.
- Worker rescues exceptions and logs them without re-raising, recording failure,
  or moving the job to a visible terminal state.
- Job payload stores whole records, serialized models, credentials, or mutable
  snapshots where stable IDs would be safer.
- Enqueue happens before the database transaction commits, or enqueue/state
  atomicity is assumed but not guaranteed.
- Queue priority and worker concurrency let slow bulk jobs starve interactive or
  user-visible work.

## Workflow

1. Name the job's purpose, trigger, queue, expected runtime, and side effects.
2. Design the payload: stable IDs, immutable parameters, actor/tenant context,
   and no request/session-only state.
3. Define idempotency, uniqueness, retry budget, backoff, timeout, and terminal
   failure behavior before writing the worker body.
4. Make dependencies explicit: reload records, re-check permissions or business
   state, and handle deleted or changed data as normal outcomes.
5. Add observability for enqueue, start, success, retry, exhaustion, discard,
   latency, queue depth, and dead jobs.
6. Test success, retryable failure, exhausted retries, duplicate execution,
   missing records, expired sessions, and shutdown during work.

## Verification

- [ ] Payload uses stable IDs and immutable data; it does not rely on request,
      session, thread-local, open connection, or in-memory object state.
- [ ] Job can run after logout, session expiry, request completion, and deploy.
- [ ] Retry policy has bounded attempts, delay/backoff, and terminal handling.
- [ ] Retried side effects are idempotent, deduplicated, or marked non-retryable
      with a documented reason.
- [ ] Exhausted, discarded, dead, or poison jobs cannot fail silently.
- [ ] Job enqueue and related state changes cannot diverge silently.
- [ ] Queue priority, worker concurrency, timeout, and shutdown behavior are
      explicit.
- [ ] Tests cover duplicate execution, retry exhaustion, missing/changing data,
      expired session context, and worker restart or shutdown.

## Handoffs

- Use `resilience` for retry budgets, idempotency keys, outbox, and remote-call
  failure behavior.
- Use `concurrency` for worker pools, locks, cancellation, queue bounds, and
  backpressure inside the process.
- Use `observability` for metrics, traces, dashboards, alerts, and runbooks.
- Use `deployment` for worker draining, deploy compatibility, and migration
  coordination.
- Use `database` for transactional enqueue, locking, isolation, and schema
  changes that jobs depend on.
