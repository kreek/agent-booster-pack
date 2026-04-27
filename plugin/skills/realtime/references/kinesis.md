# Kinesis

Use this when AWS Kinesis Data Streams is the stream. Do not choose Kinesis only
because the app needs live browser updates; start with polling, SSE, or
WebSockets, then bridge from Kinesis internally only when the backend genuinely
needs a durable AWS-managed stream.

## Defaults

- Reach for Kinesis after simpler HTTP streaming or a lighter queue cannot
  satisfy durable replay, independent consumers, shard-scaled throughput,
  retention, audit, or AWS-native stream integration requirements.
- Use streams for ordered event records, shards for throughput, and partition
  keys for shard assignment and per-key ordering.
- Ordering is per shard and sequence-number path, not global.
- Retention defines replay window; choose it from recovery needs, not defaults.
- Prefer enhanced fan-out or separate consumer applications when independent
  consumers need dedicated throughput.

## Design Rules

- Choose partition key from the ordering invariant and hot-key risk.
- Define retention period, replay starting point, and what happens after
  retention expires.
- Define consumer application name, checkpointing, retry, and poison-record
  behavior.
- Track iterator age, read/write throughput, throttling, error rate, and
  consumer health.
- Plan shard count/on-demand mode around peak writes, read fanout, and hot
  partitions.

## Failure Cases To Test

- Hot partition key throttles a shard.
- Consumer restarts and resumes from checkpoint.
- Consumer falls behind retention.
- Duplicate processing after checkpoint failure.
- Poison record blocks progress.

## Sources

- Kinesis key concepts:
  https://docs.aws.amazon.com/streams/latest/dev/key-concepts.html
- Kinesis PutRecord:
  https://docs.aws.amazon.com/kinesis/latest/APIReference/API_PutRecord.html
- Kinesis consumers:
  https://docs.aws.amazon.com/streams/latest/dev/building-consumers.html
