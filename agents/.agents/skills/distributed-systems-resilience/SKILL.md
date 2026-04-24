---
name: distributed-systems-resilience
description:
  Use when writing code that makes remote calls, when designing retries or
  timeouts, when discussing idempotency, circuit breakers, sagas, outbox
  patterns, event ordering, or consistency models; when the user mentions CAP,
  PACELC, exactly-once, message brokers, Temporal, or eventual consistency.
---

# Distributed Systems Resilience

## Every Remote Call Gets a Timeout. Always.

A call without a timeout can block forever, exhausting thread pools and
cascading into full service outages.

```python
# Bad: no timeout
response = requests.get("https://api.example.com/data")

# Good
response = requests.get("https://api.example.com/data", timeout=(3.05, 10))
# (connect_timeout, read_timeout) — different concerns, configure separately
```

**Derive timeouts from data:** set timeout ≈ downstream p99.9 + margin (~0.1%
false-timeout rate). Re-tune when latency shifts; static timeouts rot. Split
connect vs read timeouts.

**Propagate deadlines** (gRPC `deadline`, HTTP `Request-Timeout`, context):
child deadline = parent deadline − time already spent. Never reset.

---

## Exponential Backoff with Full Jitter

Never retry immediately. Never use constant delays. Use exponential backoff with
full jitter to avoid thundering herds.

```python
import random, time

def retry_with_jitter(fn, max_attempts=5, base_delay=0.1, max_delay=30.0):
    for attempt in range(max_attempts):
        try:
            return fn()
        except TransientError as e:
            if attempt == max_attempts - 1:
                raise
            cap = min(max_delay, base_delay * (2 ** attempt))
            sleep = random.uniform(0, cap)  # full jitter
            time.sleep(sleep)
```

**Full jitter:** `sleep = random(0, min(cap, base * 2^attempt))`. Spreads
retries uniformly; strictly better than equal/decorrelated jitter against retry
storms.

**Only retry idempotent operations, or POSTs with an idempotency key.**

---

## Retry Budgets — Cap the Amplification

- Retry at one layer only. Stacked retries (client → gateway → service) multiply
  load.
- Wrap retries in a token bucket per endpoint. Empty bucket → fail fast.
- Budget rule: max retries ≤ ~10% of steady-state call rate.
- Never retry `4xx` except `408`/`429`.

---

## Circuit Breakers and Bulkheads

**Circuit breaker:** stop calling a failing dependency; fail fast instead of
queuing requests.

States:

- **Closed** — calls pass through normally.
- **Open** — calls fail immediately without hitting the dependency (for a
  configured window).
- **Half-open** — probe with a small number of calls; if they succeed, close; if
  not, reopen.

**Use with care:** open on sustained error rate or latency spike, not single
failures. Pair every breaker with a retry budget — breakers alone introduce
modal behaviour that's hard to test and lengthens recovery. Half-open probes few
(1–3) and rate-limited. Prefer adaptive concurrency / load shedding when you
control the caller.

**Bulkhead:** isolate dependency calls into separate thread pools / semaphores.
Prevents one slow dependency from starving threads for all other dependencies.

```
service → [bulkhead: DB pool, max 10] → database
       → [bulkhead: payment pool, max 5] → payment API
       → [bulkhead: email pool, max 3] → email service
```

If the payment API slows down, only the 5 payment threads are affected. DB
threads remain available.

---

## Consistency Models: PACELC over CAP

**CAP theorem:** in the presence of a network Partition, choose either
Consistency or Availability. But partitions are rare — what matters day-to-day
is the **latency/consistency tradeoff in normal operation**.

**PACELC:** if Partition → (C or A); Else → (L or C). Latency or consistency,
even when healthy.

| System                           | P→  | E→  | Notes                       |
| -------------------------------- | --- | --- | --------------------------- |
| Postgres (single node)           | C   | C   | Sync, low latency           |
| Postgres (streaming replication) | A   | L   | Replica reads may be stale  |
| DynamoDB (default)               | A   | L   | Eventually consistent reads |
| DynamoDB (strong read)           | C   | C   | Higher cost, higher latency |
| Cassandra                        | A   | L   | Tunable per-request         |
| Zookeeper / etcd                 | C   | C   | Linearisable                |

Choose consistency model explicitly per data type. Counters and caches can be
eventually consistent; financial balances and inventory often cannot.

---

## Exactly-Once Is a Lie

In distributed systems, exactly-once delivery does not exist at the transport
layer. You get:

- **At-most-once** (fire and forget, messages may be lost)
- **At-least-once** (retries guarantee delivery, messages may be duplicated)

Design for **at-least-once delivery + idempotent consumers**:

```python
def process_event(event_id: str, payload: dict):
    if already_processed(event_id):  # idempotency check
        return
    with transaction():
        do_the_work(payload)
        mark_processed(event_id)
```

Use a deduplicated events table with a unique constraint on `event_id`. The
`INSERT ... ON CONFLICT DO NOTHING` pattern is your friend.

---

## Sagas: Decision Rule

**Sagas** coordinate multi-step transactions across services without 2PC.

| Flow shape                              | Choose                   |
| --------------------------------------- | ------------------------ |
| 2–3 steps, no ordering                  | Choreography (events)    |
| Ordered steps, non-trivial compensation | Orchestration            |
| Long-running, human-in-the-loop         | Durable execution engine |

- Choreography: services react to events. Simple to start; tangles at scale.
- Orchestration: one coordinator drives steps + compensation.

**Compensation** is designed per step before the happy path. Non-reversible
steps ("send email", "charge external card") → compensate forward with a
follow-up action, never rollback.

---

## Transactional Outbox Pattern

The most common distributed systems bug: write to the database AND publish an
event, and the two are not atomic.

```python
# Bad: event may be lost if process dies between DB write and publish
save_order(order)
publish_event(OrderCreated(order))

# Good: outbox pattern
with transaction():
    save_order(order)
    insert_into_outbox(OrderCreated(order))
# Separate relay process reads outbox and publishes atomically
```

The outbox table is part of the same transaction as the domain write. A separate
relay (or CDC via Debezium) publishes from the outbox with at-least-once
guarantees. Consumers must be idempotent.

---

## Event Ordering

Ordering guarantees exist **only within a partition key**, not across
partitions.

- Kafka: ordering within a topic-partition. Use the aggregate ID (order_id,
  user_id) as the partition key.
- SQS: no ordering. Use SQS FIFO with message group ID for per-entity ordering.
- EventBridge: no ordering.

If your consumers need global ordering, you have a data model problem. Redesign
to per-entity ordering.

---

## Durable Execution Engines

For long-running workflows with retries, timeouts, and compensation, consider a
durable execution engine instead of hand-rolling saga orchestration:

- **Temporal** — mature, production-proven, language SDKs for Go/Python/Java/TS
- **Restate** — newer, lower operational overhead, good for serverless
- **DBOS** — Postgres-backed, simple operational model

These handle retry logic, timeout tracking, workflow versioning, and
compensation automatically. The tradeoff is operational complexity of running
the platform.

**Determinism is load-bearing:** workflow code must be deterministic on replay —
no `now()`, `random()`, direct I/O, or unstable map iteration; route through
activities. Version every breaking change (Patches / Worker Versioning); never
mutate live workflow code silently. Retain old versions until in-flight
executions drain.

---

## Fail Fast, Crash Clean

- Validate at the trust boundary; reject early, reject loudly.
- On invariant violation, crash the process. Corrupt state is worse than
  downtime.
- Never swallow remote-call errors. Log with correlation ID, then propagate or
  compensate.

---

## Load Shedding and Backpressure

- Under overload, shed lowest-priority traffic first; serve health checks and
  retries last.
- Queues must be bounded. Unbounded queues convert latency spikes into OOMs.
- Producers observe consumer lag and slow down or drop.
- Return `429`/`503` with `Retry-After` so clients back off.

---

## Consumer Hygiene — Poison Pills and DLQs

- Every consumer has a DLQ. After N failed attempts, message goes to DLQ — never
  block the partition.
- Idempotency key = producer's aggregate ID + event ID, not a consume-time UUID.
- Dedup via `INSERT ... ON CONFLICT DO NOTHING` on a processed-events table, in
  the same transaction as the side effect.
- DLQs need reprocessing tooling and an alert. A silent DLQ is data loss.

---

## Verify Consistency Claims; Fault-Inject

- Vendor labels ("serializable", "strong", "exactly-once") are claims, not
  proofs. Check the latest independent analysis for your store/version. Pick
  isolation from observed behaviour.
- Broker "exactly-once" is at-least-once + idempotence dressed up.
- Inject timeouts, dropped messages, clock skew, and dependency failure in
  staging. Exercise breakers, retry budgets, and DLQ paths on purpose — they rot
  silently.

---

## Canon

- Designing Data-Intensive Applications (Kleppmann) —
  <https://dataintensive.net/>
- Release It! 2e — Stability Patterns —
  <https://www.oreilly.com/library/view/release-it-2nd/9781680504552/f_0047.xhtml>
- AWS Builders' Library — Timeouts, retries, and backoff with jitter —
  <https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/>
- AWS Architecture Blog — Exponential Backoff And Jitter —
  <https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/>
- AWS Well-Architected REL05-BP03 — Control and limit retry calls —
  <https://docs.aws.amazon.com/wellarchitected/latest/framework/rel_mitigate_interaction_failure_limit_retries.html>
- Brooker — Fixing retries with token buckets and circuit breakers —
  <https://brooker.co.za/blog/2022/02/28/retries.html>
- Brooker — Will circuit breakers solve my problems? —
  <https://brooker.co.za/blog/2022/02/16/circuit-breakers.html>
- Jepsen — consistency reference — <https://jepsen.io/consistency>
- Jepsen — analyses index — <https://jepsen.io/analyses>
- microservices.io — Transactional Outbox —
  <https://microservices.io/patterns/data/transactional-outbox.html>
- ByteByteGo — Saga Pattern Demystified —
  <https://blog.bytebytego.com/p/saga-pattern-demystified-orchestration>
- Morling — On Idempotency Keys —
  <https://www.morling.dev/blog/on-idempotency-keys/>
- Temporal docs — Versioning — <https://docs.temporal.io/develop/go/versioning>
