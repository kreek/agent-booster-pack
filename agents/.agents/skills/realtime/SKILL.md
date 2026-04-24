---
name: realtime
description: >
  Use when designing, implementing, or reviewing realtime/evented systems:
  events, streams, pub/sub, subscriptions, fanout, SSE, WebSockets, Kafka,
  Kinesis, Redis Streams, consumer groups, offsets, lag, replay, retention,
  partitions, shards, ordering, delivery guarantees, backpressure, poison
  messages, DLQs, or event schemas. Trigger whenever the user mentions realtime,
  live updates, event-driven architecture, streaming consumers, message brokers,
  event buses, event sourcing, or "exactly once".
---

# Realtime

## Iron Law

`EVERY STREAM NAMES ITS DELIVERY GUARANTEE, ORDERING KEY, REPLAY BOUNDARY, AND BACKPRESSURE POLICY.`

"Realtime" is not a design. State what can be late, stale, duplicated,
reordered, dropped, replayed, or blocked.

## Default Stance

Push ordinary HTTP/browser realtime as far as it will reasonably go before
committing to Kafka, Kinesis, Redis Streams, or another durable broker.

For user-facing live updates, start with polling, SSE, or WebSockets. Escalate
only after naming the requirement the simpler transport cannot satisfy:
independent replay, long retention, audit history, offline catch-up,
multi-service fanout, consumer-group scaling, partitioned throughput, or durable
recovery.

## When to Use

- Designing or reviewing event streams, live browser updates, pub/sub,
  subscriptions, fanout, Kafka, Kinesis, Redis Streams, SSE, WebSockets, or
  streaming consumers/producers.
- Choosing delivery semantics, event schemas, partition keys, retention, replay,
  consumer groups, offsets, lag handling, DLQs, or poison-message policy.

## When NOT to Use

- Ordinary request/response API design only; use `api`.
- Retry/idempotency/failure strategy beyond stream shape; use `resilience`.
- In-process worker pools, channels, locks, and task lifetimes; use
  `concurrency`.
- Metrics, dashboards, alerts, and runbooks only; use `observability`.

## Core Ideas

1. Pick the interaction pattern first. For browser/client live updates, start
   with polling, SSE, or WebSockets and exhaust that design before moving to a
   queue, log, or broker.
2. Event schemas are contracts: version them and keep consumers compatible.
3. Ordering exists only within a named key, partition, shard, or stream.
4. Delivery guarantees are explicit: at-most-once, at-least-once,
   effectively-once/idempotent, or transactional exactly-once where supported.
5. Durable business events need retention and replay; ephemeral pub/sub is not a
   recovery mechanism.
6. Consumers are state machines with offsets, acknowledgements, lag, poison
   messages, and replay behavior.
7. Backpressure is designed: bound buffers, throttle producers, shed load, drop
   safe events, or degrade deliberately.

## Workflow

1. Name the producer, broker/transport, consumers, and user-visible latency
   expectation.
2. For user-facing live updates, try polling, SSE, or WebSockets first; choose a
   broker only when the design needs durable replay, independent catch-up,
   multi-consumer fanout, audit, consumer groups, or partitioned throughput.
3. If Kafka, Kinesis, Redis Streams, or another broker is chosen, write down the
   first requirement that forced that choice over SSE/WebSockets.
4. Define event schema, versioning, compatibility, and ownership.
5. Define partition/order key, consumer group/fanout model, retention, replay,
   and offset/acknowledgement behavior.
6. Define backpressure, overflow, retry, poison-message, DLQ, and replay
   handling.
7. Add lag, throughput, error, reconnect, dropped-event, DLQ, and consumer
   health signals.
8. Test duplicates, reordering, drops, reconnects, slow consumers, replay, and
   poison messages.

## Verification

- [ ] Polling, SSE, or WebSockets were considered first for user-facing live
      updates.
- [ ] Any broker choice names the specific requirement that simple HTTP/browser
      streaming could not satisfy.
- [ ] Event schema and versioning are explicit.
- [ ] Delivery guarantee is named and matches product tolerance for duplicate,
      loss, disorder, and delay.
- [ ] Ordering guarantee names the partition/shard/stream key and tolerated
      disorder outside that key.
- [ ] Retention and replay boundary are documented.
- [ ] Consumer group, fanout, offset/ack, and restart behavior are defined.
- [ ] Backpressure and overflow behavior are bounded and intentional.
- [ ] Poison-message, DLQ, retry, and replay handling are defined.
- [ ] Lag, throughput, errors, dropped events, reconnects, and consumer health
      are observable.
- [ ] Tests or fault drills cover duplicate, reorder, drop, slow consumer,
      reconnect, replay, and poison-message cases.

## Handoffs

- Use `api` for public subscription, webhook, SSE, or event-contract surface.
- Use `resilience` for retry budgets, idempotent consumers, outbox/CDC, and
  dependency failure behavior.
- Use `concurrency` for in-process queues, worker pools, task lifetime, and
  shutdown.
- Use `observability` for metrics, traces, dashboards, alerts, and runbooks.
- Use `proof` when delivery, ordering, replay, or compatibility claims need
  explicit evidence.

## References

- `references/browser-streaming.md`: polling, SSE, and WebSocket choices.
- `references/kafka.md`: topics, partitions, consumer groups, offsets, and
  delivery semantics.
- `references/kinesis.md`: streams, shards, partition keys, sequence numbers,
  retention, and consumers.
- `references/redis-streams.md`: Redis Streams, consumer groups, pending
  entries, acknowledgements, and claiming.
