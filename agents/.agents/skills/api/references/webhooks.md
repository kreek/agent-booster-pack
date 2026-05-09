# Webhooks

Use this reference when designing or reviewing webhook delivery from
your service to a consumer.

## Rule

Webhooks are APIs too. Sign payloads, version events, and make
receivers idempotent. Treat the consumer endpoint as untrusted code
running outside your blast radius — assume retries, replays, and
out-of-order delivery.

## Signing

- Sign every payload with HMAC-SHA-256 (or stronger) over the body
  and a timestamp.
- Send the signature and timestamp in dedicated headers
  (`X-Signature`, `X-Timestamp` or service-specific equivalents).
- Document the canonicalization (raw body vs JSON-canonicalized) so
  consumers can reproduce it.
- Rotate signing keys with overlap; emit both old and new during
  rotation.

## Versioning

- Include an event-type version in the payload
  (`type: "invoice.created.v2"`) or a top-level `version` field.
- Treat event versions like API versions: additive changes ship as
  optional fields; breaking changes ship as a new event type.

## Replay Protection

- Reject deliveries whose timestamp is more than a documented window
  old (5 minutes is common).
- Have the consumer keep a short-lived cache of recently delivered
  event IDs and drop duplicates.

## Idempotent Receivers

- Send a stable event ID (`X-Event-ID` or in the body) and document
  it.
- Consumers must dedupe by event ID. Build the contract so a consumer
  that processes the same event twice produces the same end state.

## Delivery and Retries

- Document the retry schedule (exponential backoff, max attempts,
  total window) so consumers can size their dedup window.
- Mark obvious permanent failures (`410 Gone`, `400` with a
  documented reason) and stop retrying.
- Provide a manual replay tool for consumers to re-fetch missed
  events during incidents.
