# Kafka

Use this when Kafka is the event log or broker. Do not choose Kafka only because
the app needs live browser updates; start with polling, SSE, or WebSockets, then
bridge from Kafka internally only when the backend genuinely needs a durable
partitioned log.

## Defaults

- Reach for Kafka after simpler HTTP streaming or a lighter queue cannot satisfy
  durable replay, long retention, independent consumers, consumer-group scaling,
  audit, or high-throughput partitioned event-log requirements.
- Use topics for event categories, partitions for parallelism and per-key
  ordering, and consumer groups for scalable competing consumers.
- Ordering is per partition, so choose a partition key that matches the product
  ordering invariant.
- Consumers commit offsets only after side effects are safely complete.
- Prefer idempotent producers and idempotent consumers by default. Use
  transactions/exactly-once only when the added operational complexity is
  justified.

## Design Rules

- Define topic ownership, event schema, versioning, retention, and compaction
  policy where applicable.
- Define producer `acks`, retry behavior, idempotence, and maximum in-flight
  behavior with ordering in mind.
- Define consumer group ID, offset reset policy, commit strategy, and rebalance
  behavior.
- Handle poison messages with bounded retries and DLQ/replay, not infinite tight
  loops.
- Track consumer lag by topic/partition/group and alert only when action is
  clear.

## Failure Cases To Test

- Duplicate delivery after consumer restart.
- Reordered events across different keys/partitions.
- Consumer crash before and after offset commit.
- Poison message blocks a partition.
- Broker or network interruption during produce and consume.

## Sources

- Apache Kafka documentation: https://kafka.apache.org/documentation/
- Kafka design: https://kafka.apache.org/documentation/#design
- Confluent consumer design:
  https://docs.confluent.io/kafka/design/consumer-design.html
