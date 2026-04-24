---
name: distributed-systems-resilience
description:
  Use when writing code that makes remote calls, when designing retries or
  timeouts, when discussing idempotency, circuit breakers, sagas, outbox
  patterns, event ordering, or consistency models; when the user mentions CAP,
  PACELC, exactly-once, message brokers, Temporal, or eventual consistency.
---

# Distributed Systems Resilience

## Iron Law

`EVERY REMOTE CALL HAS A TIMEOUT, A RETRY BUDGET, AND AN IDEMPOTENCY STRATEGY.`

Internal networks fail too. Unbounded calls and retries turn one slow dependency
into a larger outage.

## When to Use

- Remote calls, retries, timeouts, circuit breakers, bulkheads, sagas, outbox,
  event ordering, message consumers, durable workflows, and consistency
  tradeoffs.

## When NOT to Use

- In-process concurrency only; use `concurrency-patterns`.
- HTTP surface design only; use `api-design`.
- Deployment rollout mechanics; use `deployment-and-cicd`.

## Core Ideas

1. Timeouts are finite and derived from observed latency, not defaults.
2. Retries happen at one layer, with full jitter and a budget.
3. Only idempotent operations or idempotency-keyed mutations are retried.
4. Circuit breakers, bulkheads, and load shedding protect callers from
   dependency failure.
5. State changes and event publication need atomicity through outbox, CDC, or
   equivalent.
6. Consumers are idempotent and poison-message aware.
7. Consistency is a product decision: name what can be stale, reordered,
   duplicated, or lost.

## Workflow

1. Draw the call/event path and mark every remote boundary.
2. For each boundary, set timeout, retry, idempotency, and failure behavior.
3. Decide whether the operation needs synchronous consistency, eventual
   consistency, saga compensation, or durable workflow orchestration.
4. Add DLQ/replay/runbook behavior for consumers.
5. Fault-inject timeouts, drops, dependency failure, duplicates, and reordered
   events.

## Verification

- [ ] Every remote call has connect/read or equivalent timeout.
- [ ] Retry loop has cap, full jitter, and a budget at one layer only.
- [ ] Non-idempotent mutations are not retried unless keyed and deduplicated.
- [ ] Circuit breaker/bulkhead/load-shedding behavior is defined for critical
      dependencies.
- [ ] Event publish and state write cannot diverge silently.
- [ ] Consumers are idempotent and have DLQ/replay handling.
- [ ] Ordering guarantees name the partition key and tolerated disorder.
- [ ] Staging or test fault injection covers timeout, drop, dependency failure,
      duplicate, and reorder cases.

## Handoffs

- Use `error-handling-patterns` for propagation, wrapping, and user-facing
  failure shape.
- Use `observability-for-services` for dependency metrics, traces, alerts, and
  runbooks.
- Use `api-design` for public idempotency-key and error-response contracts.

## References

- AWS Builders' Library, timeouts/retries/backoff:
  <https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/>
- Nygard, _Release It!_:
  <https://pragprog.com/titles/mnee2/release-it-second-edition/>
- Kleppmann, _Designing Data-Intensive Applications_:
  <https://dataintensive.net/>
