---
name: realtime
description: >-
  Use for realtime and evented systems: streams, pub/sub, SSE, WebSockets,
  Kafka, Kinesis, Redis Streams, fanout, offsets, ordering, delivery,
  backpressure, DLQs, and schemas.
---

# Realtime

## Iron Law

`EVERY STREAM NAMES ITS DELIVERY GUARANTEE, ORDERING KEY, REPLAY BOUNDARY, AND BACKPRESSURE POLICY.`

## Default Stance

For user-facing live updates, start with polling, SSE, or WebSockets.
Escalate to Kafka/Kinesis/Redis Streams only after naming the
requirement the simpler transport cannot satisfy: independent replay,
long retention, audit history, offline catch-up, multi-service fanout,
consumer-group scaling, partitioned throughput, or durable recovery.

## When to Use

- Designing or reviewing event streams, live browser updates, pub/sub,
  subscriptions, fanout, Kafka, Kinesis, Redis Streams, SSE,
  WebSockets, or streaming consumers/producers.
- Choosing delivery semantics, event schemas, partition keys,
  retention, replay, consumer groups, offsets, lag handling, DLQs, or
  poison-message policy.

## When NOT to Use

- Ordinary request/response API design only; use `api`.
- Remote-call timeout/circuit-breaker policy outside stream mechanics;
  use `error-handling`.
- In-process worker pools, channels, locks, and task lifetimes; use
  `concurrency`.
- Metrics, dashboards, alerts, and runbooks only; use `observability`.

## Core Ideas

1. Pick the interaction pattern first; exhaust polling/SSE/WebSockets
   before moving to a queue, log, or broker.
2. Event schemas are contracts: version them and keep consumers
   compatible.
3. Ordering exists only within a named key, partition, shard, or
   stream.
4. Delivery guarantees are explicit: at-most-once, at-least-once,
   effectively-once/idempotent, or transactional exactly-once where
   supported.
5. Durable business events need retention and replay; ephemeral
   pub/sub is not a recovery mechanism. When state changes and event
   publication must agree, use an outbox, CDC, or equivalent database
   handoff.
6. Consumers are idempotent state machines with offsets,
   acknowledgements, lag, poison messages, and replay behavior.
7. Backpressure is designed: bound buffers, throttle producers, shed
   load, drop safe events, or degrade deliberately.

## Workflow

1. Name the producer, broker/transport, consumers, and user-visible
   latency expectation. For user-facing live updates, try
   polling/SSE/WebSockets first; if a broker is chosen, write down the
   first requirement that forced that choice.
2. Define event schema, versioning, compatibility, and ownership.
   Define partition/order key, consumer group/fanout, retention,
   replay, and offset/ack behavior. Define backpressure, overflow,
   retry, poison-message, DLQ, and replay handling.
3. Add lag, throughput, error, reconnect, dropped-event, DLQ, and
   consumer health signals. Test duplicates, reordering, drops,
   reconnects, slow consumers, replay, and poison messages.

## Verification

- [ ] Polling, SSE, or WebSockets were considered first for user-facing
      live updates; any broker choice names the specific requirement
      simple HTTP/browser streaming could not satisfy.
- [ ] Event schema and versioning are explicit.
- [ ] Delivery guarantee is named and matches product tolerance for
      duplicate, loss, disorder, and delay.
- [ ] Ordering guarantee names the partition/shard/stream key and
      tolerated disorder outside that key.
- [ ] Retention and replay boundary are documented.
- [ ] Consumer group, fanout, offset/ack, and restart behavior are
      defined.
- [ ] Backpressure, overflow, poison-message, DLQ, retry, and replay
      handling are bounded and intentional.
- [ ] Lag, throughput, errors, dropped events, reconnects, and
      consumer health are observable.
- [ ] Tests or fault drills cover duplicate, reorder, drop, slow
      consumer, reconnect, replay, and poison-message cases.

## Handoffs

- Use `api` for public subscription, webhook, SSE, or event-contract
  surface.
- Use `error-handling` for retry budgets and dependency failure
  behavior outside stream semantics.
- Use `database` for outbox/CDC atomicity when persisted state and
  event publication must not diverge.
- Use `concurrency` for in-process queues, worker pools, task
  lifetime, and shutdown.
- Use `observability` for metrics, traces, dashboards, alerts, and
  runbooks.
- Use `proof` when delivery, ordering, replay, or compatibility claims
  need explicit evidence.

## References

- `references/browser-streaming.md`: polling, SSE, and WebSocket
  choices.
- `references/kafka.md`: topics, partitions, consumer groups, offsets,
  delivery semantics.
- `references/kinesis.md`: streams, shards, partition keys, sequence
  numbers, retention, consumers.
- `references/redis-streams.md`: Redis Streams, consumer groups,
  pending entries, acknowledgements, claiming.
