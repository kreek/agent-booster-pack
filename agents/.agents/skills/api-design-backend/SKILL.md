---
name: api-design-backend
description:
  Use when designing REST, GraphQL, or gRPC APIs; when writing OpenAPI specs;
  when versioning endpoints; when designing error responses, idempotency keys,
  pagination, rate limiting, or webhooks; or when the user mentions RFC 9457,
  Problem Details, cursor pagination, or the Sunset header.
---

# API Design — Backend

## REST to Richardson Level 2

Target **Richardson Maturity Level 2**: resources + HTTP verbs used correctly.
HATEOAS (Level 3) is dead in practice — few clients implement it.

**Resources are nouns, not verbs:**

```
GET  /orders          ✓   (not /getOrders)
POST /orders          ✓   (not /createOrder)
GET  /orders/{id}     ✓
PUT  /orders/{id}     ✓   (full replacement)
PATCH /orders/{id}    ✓   (partial update)
DELETE /orders/{id}   ✓
```

**HTTP verb semantics:** | Verb | Idempotent | Safe | Use for |
|---|---|---|---| | GET | ✓ | ✓ | Retrieve | | PUT | ✓ | ✗ | Full replace | |
DELETE | ✓ | ✗ | Remove | | PATCH | ✗\* | ✗ | Partial update | | POST | ✗ | ✗ |
Create, non-idempotent actions |

\*PATCH is idempotent only if designed that way.

---

## Error Responses: RFC 9457 Problem Details

Use **RFC 9457** (supersedes 7807) for all error responses. It is the standard;
do not invent a custom error schema.

```json
{
  "type": "https://example.com/errors/insufficient-funds",
  "title": "Insufficient Funds",
  "status": 402,
  "detail": "Account balance $12.50 is below the required $50.00.",
  "instance": "/orders/abc-123",
  "balance": 1250,
  "required": 5000
}
```

Rules:

- `type` — a URI that identifies the error class. Should be dereferenceable to
  documentation.
- `title` — human-readable, stable. Do not vary it per-occurrence.
- `status` — must match the HTTP status code.
- `detail` — human-readable, occurrence-specific.
- `instance` — URI identifying this specific occurrence (useful for support
  tickets).
- Extensions (like `balance`, `required`) are allowed.

Content-Type: `application/problem+json`.

---

## Idempotency

**POST requests are not idempotent by default.** Clients retry on network
failure; without idempotency, retries create duplicate orders, charges, etc.

**Idempotency-Key header pattern** (IETF draft, used by Stripe/PayPal/Adyen):

```
POST /charges
Idempotency-Key: a8098c1a-f86e-11da-bd1a-00112444be1e
```

Server behaviour:

1. On first request: execute, store `(key, response)` with TTL (typically 24h).
2. On duplicate request with same key: return stored response without
   re-executing.
3. On collision with different body: return `422 Unprocessable Entity`.

Use a UUID v4 as the key. Store in the same transaction as the mutation.

---

## Pagination

**Cursor-based pagination** over offset pagination. Offset breaks under
concurrent inserts and becomes slow on large tables.

```json
{
  "data": [...],
  "pagination": {
    "next_cursor": "eyJpZCI6MTIzfQ==",
    "has_more": true
  }
}
```

Cursor encodes the position (usually an opaque base64 of `{id, timestamp}`).
Clients pass it back as `?cursor=<value>`.

Avoid exposing internal IDs directly in cursors — opaque cursors let you change
the implementation.

**Page size:** default to 20, allow clients to request up to a documented
maximum (e.g. 100). Always enforce the maximum server-side.

---

## Versioning

**URL path versioning** for breaking changes: `/v1/orders`, `/v2/orders`. Clear,
cacheable, debuggable.

- Never version in the `Accept` header — clients don't implement it reliably.
- Never silently change response shapes — always bump the version.
- Signal deprecation with the **`Sunset` header** (RFC 8594):
  ```
  Sunset: Sat, 31 Dec 2026 23:59:59 GMT
  Deprecation: true
  Link: <https://api.example.com/v2/orders>; rel="successor-version"
  ```

Maintain N and N-1 versions simultaneously. Retire N-2 after communicating the
Sunset date.

---

## Rate Limiting

**Token bucket** is the standard algorithm. Clients get a burst capacity and a
refill rate.

Response headers (follow the emerging IETF standard):

```
RateLimit-Limit: 100
RateLimit-Remaining: 42
RateLimit-Reset: 1714564800
Retry-After: 3600        (on 429 responses)
```

Return **429 Too Many Requests** (not 503). Include `Retry-After`.

Rate limit per API key, not per IP (IPs are shared behind NAT/proxies).

---

## OpenAPI 3.1

OpenAPI 3.1 as the contract. Key points:

- 3.1 aligns with JSON Schema draft 2020-12 (3.0 had divergences).
- Define reusable schemas in `components/schemas`.
- All error responses reference the Problem Details schema.
- Mark idempotent operations with `x-idempotency-key: true` (custom extension).
- Generate server stubs and client SDKs from the spec — don't hand-write both.

---

## Webhooks

**Signing:** HMAC-SHA256 over the raw request body + timestamp. Stripe's
approach is the de facto standard:

```
X-Webhook-Signature: t=1714564800,v1=abc123...
```

Payload: `{timestamp}.{body}` → HMAC-SHA256 with the shared secret.

**Receiver must:**

1. Validate the signature before processing.
2. Check the timestamp is within ±5 minutes (replay attack prevention).
3. Return 2xx quickly — offload processing to a background job.
4. Be idempotent: the same event may be delivered more than once.

**Retry policy:** exponential backoff, typically 5 attempts over 24 hours.
Expose a webhook delivery log so senders can debug.
