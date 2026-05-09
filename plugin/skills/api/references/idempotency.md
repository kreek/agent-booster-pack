# Idempotency

Use this reference when a public mutation must be safe to retry.

## Rule

A mutation is safe to retry only when the public contract defines an
idempotency strategy. Without one, retries can produce duplicate side
effects: double charges, duplicate emails, repeated state transitions,
or out-of-order writes.

## Idempotency-Key Contract

Document each of these for any retryable mutation:

- **Key scope.** What collection of requests share an idempotency-key
  namespace? Per account, per API key, per endpoint, or globally
  unique?
- **Replay window.** How long does the server retain the keyed
  response before forgetting it? Common values: 24 hours, 7 days,
  30 days.
- **Duplicate-response behavior.** When the same key arrives twice,
  does the server replay the original response, return `409 Conflict`,
  or compare request bodies?
- **Conflict semantics.** When the same key arrives with a different
  body, does the server reject with `409`, `422`, or `400`?

Cite the contract in OpenAPI, the SDK docs, and any deprecation notes.

## Server Implementation

- Persist `key → (request hash, response, status)` keyed by scope.
- Atomically claim the key before performing the mutation; do not
  retry inside the handler.
- After the replay window elapses, remove the record. New requests
  with the same key get a fresh execution.
- Validate that the request body hashes match before replaying;
  reject on mismatch with the documented conflict status.

## Client Guidance

- Generate keys at the call site, not at retry time.
- Reuse the key for retries of the same logical operation; never
  reuse a key for a different operation.
- Surface the key in logs so traces and incident review can correlate
  duplicate attempts.

## When Not to Require a Key

`GET`, `HEAD`, `OPTIONS`, `PUT` (set-state), and `DELETE` are
idempotent by HTTP semantics: a retry of the exact request produces
the same end state without an explicit key. Document this in the
contract so consumers know which mutations are intrinsically retry-safe.
