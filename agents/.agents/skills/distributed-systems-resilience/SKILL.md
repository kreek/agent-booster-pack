---
name: distributed-systems-resilience
description: Use when writing code that makes remote calls, when designing retries or timeouts, when discussing idempotency, circuit breakers, sagas, outbox patterns, event ordering, or consistency models; when the user mentions CAP, PACELC, exactly-once, message brokers, Temporal, or eventual consistency.
---

# Distributed Systems Resilience

## Every Remote Call Gets a Timeout. Always.

A call without a timeout can block forever, exhausting thread pools and cascading into full service outages.

```python
# Bad: no timeout
response = requests.get("https://api.example.com/data")

# Good
response = requests.get("https://api.example.com/data", timeout=(3.05, 10))
# (connect_timeout, read_timeout) — different concerns, configure separately
```

**Timeout budget propagation:** use deadline propagation (gRPC `deadline`, HTTP `Request-Timeout` header, context with deadline). A parent call with a 200ms budget should not spawn child calls each with their own 200ms timeout.

---

## Exponential Backoff with Full Jitter

Never retry immediately. Never use constant delays. Use exponential backoff with full jitter to avoid thundering herds.

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

**Full jitter** (AWS formula): `sleep = random(0, min(cap, base * 2^attempt))`. This spreads retries uniformly and is strictly better than equal jitter or decorrelated jitter for avoiding coordinated retry storms.

**Only retry idempotent operations or operations with idempotency keys.** Never blindly retry POST without an idempotency key.

---

## Circuit Breakers and Bulkheads

**Circuit breaker:** stop calling a failing dependency; fail fast instead of queuing requests.

States:
- **Closed** — calls pass through normally.
- **Open** — calls fail immediately without hitting the dependency (for a configured window).
- **Half-open** — probe with a small number of calls; if they succeed, close; if not, reopen.

Thresholds: open after N failures in a window, or after error rate exceeds X%.

**Bulkhead:** isolate dependency calls into separate thread pools / semaphores. Prevents one slow dependency from starving threads for all other dependencies.

```
service → [bulkhead: DB pool, max 10] → database
       → [bulkhead: payment pool, max 5] → payment API
       → [bulkhead: email pool, max 3] → email service
```

If the payment API slows down, only the 5 payment threads are affected. DB threads remain available.

---

## Consistency Models: PACELC over CAP

**CAP theorem** (Brewer): in the presence of a network Partition, choose either Consistency or Availability. But partitions are rare — what matters day-to-day is the **latency/consistency tradeoff in normal operation**.

**PACELC** (Abadi): if Partition → (C or A); Else → (L or C). Latency or consistency, even when healthy.

| System | P→ | E→ | Notes |
|---|---|---|---|
| Postgres (single node) | C | C | Sync, low latency |
| Postgres (streaming replication) | A | L | Replica reads may be stale |
| DynamoDB (default) | A | L | Eventually consistent reads |
| DynamoDB (strong read) | C | C | Higher cost, higher latency |
| Cassandra | A | L | Tunable per-request |
| Zookeeper / etcd | C | C | Linearisable |

Choose consistency model explicitly per data type. Counters and caches can be eventually consistent; financial balances and inventory often cannot.

---

## Exactly-Once Is a Lie

In distributed systems, exactly-once delivery does not exist at the transport layer. You get:
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

Use a deduplicated events table with a unique constraint on `event_id`. The `INSERT ... ON CONFLICT DO NOTHING` pattern is your friend.

---

## Sagas: Orchestrated over Choreographed

**Sagas** coordinate multi-step transactions across services without distributed 2PC (which is fragile and slow).

**Choreography** (event-based): each service listens for events and emits its own. Simple to start; becomes a tangled web at scale. Hard to trace, hard to reason about failure.

**Orchestration** (coordinator-based): one orchestrator drives the workflow, calling each step explicitly and handling compensation. Prefer this for complex flows.

```
Orchestrator → reserve inventory
            → charge payment
            → schedule shipment
            (if any step fails → compensate previous steps)
```

**Compensation** (rollback) must be designed upfront for each step. Not every operation is reversible — "send email" cannot be unsent; compensate with a follow-up email.

---

## Transactional Outbox Pattern

The most common distributed systems bug: write to the database AND publish an event, and the two are not atomic.

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

The outbox table is part of the same transaction as the domain write. A separate relay (or CDC via Debezium) publishes from the outbox with at-least-once guarantees. Consumers must be idempotent.

---

## Event Ordering

Ordering guarantees exist **only within a partition key**, not across partitions.

- Kafka: ordering within a topic-partition. Use the aggregate ID (order_id, user_id) as the partition key.
- SQS: no ordering. Use SQS FIFO with message group ID for per-entity ordering.
- EventBridge: no ordering.

If your consumers need global ordering, you have a data model problem. Redesign to per-entity ordering.

---

## Durable Execution Engines

For long-running workflows with retries, timeouts, and compensation, consider a durable execution engine instead of hand-rolling saga orchestration:

- **Temporal** — mature, production-proven, language SDKs for Go/Python/Java/TS
- **Restate** — newer, lower operational overhead, good for serverless
- **DBOS** — Postgres-backed, simple operational model

These handle retry logic, timeout tracking, workflow versioning, and compensation automatically. The tradeoff is operational complexity of running the platform.
