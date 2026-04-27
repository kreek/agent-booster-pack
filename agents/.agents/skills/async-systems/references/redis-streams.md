# Redis Streams

Use this when Redis Streams is the event stream or lightweight durable queue. Do
not choose Redis Streams only because the app needs live browser updates; start
with polling, SSE, or WebSockets, then add Redis Streams only when the backend
needs lightweight durability, acknowledgements, or consumer recovery.

## Defaults

- Reach for Redis Streams after simpler HTTP streaming cannot satisfy replay,
  ack, pending-message tracking, offline catch-up, or lightweight consumer-group
  needs.
- Streams are append-only logs with IDs. Consumer groups let multiple consumers
  share work while tracking pending entries.
- Use Redis Streams when Redis is already operationally appropriate and the
  workload needs lightweight durable queue/log behavior.
- Do not treat Redis Pub/Sub as durable. Use Streams when replay, ack, pending
  tracking, or consumer recovery matters.

## Design Rules

- Define stream key, max length/trimming policy, retention expectation, and
  event schema.
- Use consumer groups for competing consumers; use independent groups for
  independent fanout.
- Acknowledge only after side effects are complete.
- Monitor pending entries list (PEL), idle time, lag, memory growth, and retry
  counts.
- Define claiming/reclaiming behavior for messages owned by dead consumers.
- Handle poison messages with retry limits and DLQ/parking stream.

## Failure Cases To Test

- Consumer dies with pending unacknowledged entries.
- Message is claimed by another consumer after idle timeout.
- Stream trimming removes records before replay.
- Poison message is retried and then parked.
- Redis restart/failover duplicates or delays processing.

## Sources

- Redis Streams: https://redis.io/docs/latest/develop/data-types/streams/
- Redis XREADGROUP: https://redis.io/docs/latest/commands/xreadgroup/
- Redis XACK: https://redis.io/docs/latest/commands/xack/
- Redis XAUTOCLAIM: https://redis.io/docs/latest/commands/xautoclaim/
