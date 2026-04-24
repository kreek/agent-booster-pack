---
name: api-design
description:
  Best practices for designing and implementing REST/HTTP APIs. Use whenever the
  user is designing a new API, adding endpoints to an existing one, writing or
  editing an OpenAPI spec, deciding on URI structure or HTTP verbs, shaping JSON
  request/response bodies, handling error responses and status codes, versioning
  an API, adding pagination, choosing between API keys and OAuth, designing
  webhooks, implementing idempotency keys, rate limiting, or reviewing API code
  for consistency. Trigger even when the user does not say "best practices"
  explicitly, e.g. "add a DELETE endpoint for prescriptions", "what status code
  should I return here", "how should I paginate this list", "rename this field
  in the API", or when they mention RFC 9457, Problem Details, cursor
  pagination, Sunset header, Idempotency-Key.
---

# API Design

A field guide for designing consistent, evolvable REST/HTTP APIs. Apply these
rules before writing endpoint code or editing an OpenAPI spec.

## Core principles

1. **Design the interface before the implementation.** Write the OpenAPI spec
   (or at minimum sketch paths, verbs, request/response shapes) before touching
   controllers. The spec is the contract and the documentation.
2. **REST over RPC.** Resources and HTTP verbs, not verbs in the path. Keep
   services stateless and cache-compatible.
3. **Ship the smallest public surface that solves today's problem.** Extend
   additively; bump major only for breaking changes.
4. **Design for evolution.** Adding fields, endpoints, and optional query params
   must never require a new major version.
5. **Be explicit.** `camelCase` field names, `UPPER_CASE` enums, ISO 8601 UTC
   timestamps, booleans prefixed with `is`/`has`/`can`, UUIDs not sequential
   integers.

## The decision loop

When you take any of these actions, apply the matching rule:

| Action                    | Rule                                                                                                                                                                                   |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Choosing an HTTP verb     | GET read, POST create (server-assigned ID) or non-idempotent action, PUT full replace or create-with-supplied-ID, PATCH partial update, DELETE destroy                                 |
| Naming a path             | Plural nouns for collections (`/prescriptions`), UUIDs for singletons, dashes not underscores, nouns only (no `/getOrders`); verb-tail only for non-CRUD ops (`/prescriptions/search`) |
| Nesting resources         | One level only. When a sub-resource grows verbs, spin off a new controller                                                                                                             |
| Picking a status code     | Request problem → 4xx; upstream problem → 502/503/504; our problem → 500. Never leak an upstream 5xx to the consumer                                                                   |
| Shaping an error body     | RFC 9457 Problem Details (`application/problem+json`). Return all validation errors at once, not just the first                                                                        |
| Naming a field            | `camelCase`; spell out abbreviations; prefix booleans with `is`/`has`/`can`; acronyms stay camelCase (`birlsId` not `BIRLSId`)                                                         |
| Formatting a date or time | ISO 8601, UTC, trailing `Z`, no offsets. `YYYY-MM-DD` for date-only, `YYYY-MM-DDThh:mm:ssZ` for timestamps                                                                             |
| Making a breaking change  | Bump the major in the URI (`/v1` → `/v2`). Additive changes stay in the same major. Never expose minor/patch in the URI                                                                |
| Deprecating something     | `deprecated: true` in the OAS, plus the `Sunset` header (RFC 8594) at runtime with a `Link: rel="successor-version"` pointing at the replacement                                       |
| Returning a list          | Cursor-based pagination from day one. Default page size 20; cap at a documented maximum (e.g. 100), enforced server-side                                                               |
| Retrying a POST           | Accept an `Idempotency-Key` header (UUID v4). Store `(key, status, body)` with a 24h TTL; replay the stored response on duplicates                                                     |
| Throttling a client       | `429 Too Many Requests` + `Retry-After`. Rate-limit per API key, not per IP                                                                                                            |
| Choosing auth             | User auth, PII, or PHI involved → OAuth 2.0. Machine-to-machine with no user context → Client Credentials. Otherwise API key                                                           |
| Adding a header           | Cross-cutting concerns only (auth, content negotiation). Never for business data, paging info, or PII. Prefer standard headers over custom ones                                        |
| Signing a webhook         | HMAC-SHA256 over `{timestamp}.{body}` with a shared secret. Reject if the timestamp is more than ±5 minutes from now                                                                   |

## Required behaviors for every API

Verify all of these on any endpoint before shipping:

- **Stateless.** No server-side session between requests.
- **Every endpoint documented in OAS.** Path, method, parameters, request body
  schema, response schema per status code, security requirements.
- **Standard error responses defined:** 400, 401, 403, 404, 429, 500. If the API
  calls upstream services: also 502, 503, 504.
- **Authentication declared in OAS** under `components.securitySchemes`.
  Endpoints that return PII or PHI must use OAuth and must define 401 and 403
  responses.
- **Dedicated health check endpoint per API version**, unauthenticated,
  returning 200 when up and 5xx when down. Never repurpose a resource endpoint
  as the health check.
- **Response time budget: 10 seconds maximum, aim for under 1 second.** If an
  operation can't respond in 10s, switch to async (`202 Accepted` with a job
  resource or webhook callback).
- **Never pass upstream errors through untouched.** Map them to
  consumer-appropriate status codes and strip upstream internals from the
  message.
- **UTF-8 everywhere.** `Content-Type: application/json; charset=utf-8`.

---

## Resources and verbs (Richardson Level 2)

Target Richardson Maturity Level 2: resources + HTTP verbs used correctly.
HATEOAS (Level 3) is dead in practice — few clients implement it.

```
GET    /orders          ✓   (not /getOrders)
POST   /orders          ✓   (not /createOrder)
GET    /orders/{id}     ✓
PUT    /orders/{id}     ✓   (full replacement)
PATCH  /orders/{id}     ✓   (partial update)
DELETE /orders/{id}     ✓
```

| Verb   | Idempotent             | Safe | Use for                                   |
| ------ | ---------------------- | ---- | ----------------------------------------- |
| GET    | ✓                      | ✓    | Retrieve                                  |
| PUT    | ✓                      | ✗    | Full replace (or create-with-supplied-ID) |
| DELETE | ✓                      | ✗    | Remove                                    |
| PATCH  | ✗ (unless designed so) | ✗    | Partial update                            |
| POST   | ✗                      | ✗    | Create, non-idempotent actions            |

Nest sub-resources **one level only**. When a sub-resource grows verbs, spin off
a new controller rather than bolting custom actions onto the parent.

---

## Errors: RFC 9457 Problem Details

Use **RFC 9457** (supersedes 7807) for every error. Do not invent a custom
schema.

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

- `type` — URI identifying the error class. Should dereference to docs. Reuse
  the same URI for every occurrence of the same class.
- `title` — human-readable, stable. Do not vary per-occurrence.
- `status` — must match the HTTP status code.
- `detail` — human-readable, occurrence-specific.
- `instance` — URI identifying this specific occurrence (useful for support
  tickets).
- Extensions (like `balance`, `required`) are allowed.
- Content-Type: `application/problem+json`.
- Return **all** validation errors at once (an `errors` array or multiple
  Problem Details in a batch), not just the first.

---

## Pagination: cursor-based

**Cursor-based pagination** over offset. Offset breaks under concurrent inserts
and becomes slow on large tables.

```json
{
  "data": [...],
  "pagination": {
    "nextCursor": "eyJpZCI6MTIzfQ==",
    "hasMore": true
  }
}
```

- Cursor encodes the position (opaque base64 of `{id, timestamp}` or similar).
  Clients pass it back as `?cursor=<value>`.
- Don't expose internal IDs in cursors — opaque cursors let you change the
  implementation.
- **Page size:** default 20, cap at a documented maximum (e.g. 100), enforced
  server-side.
- **Alternative envelope:** RFC 8288 `Link` headers (`rel="next"`, `rel="prev"`)
  are valid instead of a JSON envelope. Pick one per API and stay consistent.

---

## Idempotency

**POST is not idempotent by default.** Clients retry on network failure; without
idempotency, retries create duplicate orders, charges, etc.

Use the **Idempotency-Key header** pattern (IETF draft
`draft-ietf-httpapi-idempotency-key-header`):

```
POST /charges
Idempotency-Key: a8098c1a-f86e-11da-bd1a-00112444be1e
```

Server behaviour:

1. First request: execute, store `(key, status, body)` with a 24h TTL. Store
   both success **and** failure responses so retries see the same outcome.
2. Duplicate request with same key: return the stored response without
   re-executing.
3. Collision (same key, different body): return `422 Unprocessable Entity` (or
   `409`; pick one and document it).

Use UUID v4 as the key. Store in the same transaction as the mutation.

---

## Versioning and deprecation

**URL path versioning** for breaking changes: `/v1/orders`, `/v2/orders`. Clear,
cacheable, debuggable.

- Never version in the `Accept` header — clients don't implement it reliably.
- Never silently change response shapes — bump the version.
- Signal deprecation with the **`Sunset` header** (RFC 8594):

```
Sunset: Sat, 31 Dec 2026 23:59:59 GMT
Deprecation: true
Link: <https://api.example.com/v2/orders>; rel="successor-version"
```

Maintain N and N-1 simultaneously. Retire N-2 after communicating the Sunset
date.

---

## Rate limiting

**Token bucket** is the standard algorithm (burst capacity + refill rate).

- Return **`429 Too Many Requests`** with **`Retry-After`**. Not `503`.
- Rate-limit **per API key**, not per IP (IPs are shared behind NAT/proxies).
- Publish rate-limit hints when clients can use them. Prefer the current HTTPAPI
  draft shape (`RateLimit` / `RateLimit-Policy`); if you use the older
  three-header convention, `RateLimit-Reset` is delay seconds, not an epoch
  timestamp.

```
Retry-After: 3600        (on 429 responses)
RateLimit-Policy: "default";q=100;w=3600
RateLimit: "default";r=42;t=3600
```

---

## Authentication

| Scenario                                     | Scheme                                               |
| -------------------------------------------- | ---------------------------------------------------- |
| User auth, PII, or PHI                       | OAuth 2.0 (Authorization Code + PKCE for web/native) |
| Machine-to-machine, no user context          | OAuth 2.0 Client Credentials                         |
| Internal service-to-service, low sensitivity | API key                                              |

Declare under `components.securitySchemes` in the OAS. PII/PHI endpoints must
define both `401` (unauthenticated) and `403` (unauthorised) responses.

---

## OpenAPI 3.1

- 3.1 aligns with JSON Schema 2020-12 (3.0 diverged).
- Define reusable schemas in `components/schemas`; reference error responses
  from a shared Problem Details schema.
- Mark idempotent operations via a custom extension (e.g.
  `x-idempotency-key: true`).
- Generate server stubs and client SDKs from the spec — don't hand-write both.
- For small internal APIs, hand-written clients are fine. Codegen is a tradeoff,
  not a mandate.

---

## Webhooks

**Signing:** HMAC-SHA256 over `{timestamp}.{body}` with a shared secret.

```
X-Webhook-Signature: t=1714564800,v1=abc123...
```

**Receivers must:**

1. Validate the signature before processing.
2. Reject if the timestamp is more than ±5 minutes from now (replay protection).
3. Return 2xx quickly — offload processing to a background job.
4. Be idempotent: the same event may be delivered more than once.
5. Log delivery metadata only: provider event ID, signature verification result,
   timestamp, request/trace ID, and body hash. If raw replay is needed, store
   body + signature outside logs in encrypted short-retention storage with
   audited access.

**Senders must:** retry with exponential backoff, typically 5 attempts over 24
hours. Expose a delivery log so receivers can debug.

---

## Anti-patterns to flag on sight

If any of these appear in the code or spec you are touching, call them out:

- Verbs in the path for CRUD operations (`/getPrescriptions`, `/createUser`)
- Flat arrays of primitives as response bodies (not extensible)
- Sequential integer IDs for sensitive resources
- Local timestamps with offsets (use UTC + `Z`)
- Headers carrying business data or PII
- Passing upstream 500s through to the consumer
- `snake_case` or `kebab-case` JSON field names
- `UPPERCASE` acronyms inside camelCase fields (`SSNNumber`, `BIRLSId`)
- Collection endpoints without pagination
- Offset pagination (`?page=2&per_page=20`) on anything that will grow
- New major versions for purely additive changes
- Removed fields without a prior `Sunset` header and deprecation window
- Health checks that require authentication or hit business logic
- Enums as free-form strings without a defined set of values
- POST endpoints without `Idempotency-Key` support
- Webhooks without signature verification or timestamp checks
- `503` for rate limiting (use `429`)
- `Accept`-header versioning
- Responses without a JSON envelope (raw arrays or scalars at the top level)

---

## Canon

Stable RFCs whose rules are already baked into this skill (RFC 9457, 8594, 8288,
9562, 3986, ISO 8601, OpenAPI 3.1) aren't listed — the skill is the canon. These
are the in-motion standards and deeper implementation guides worth chasing:

- [draft-ietf-httpapi-idempotency-key-header](https://datatracker.ietf.org/doc/draft-ietf-httpapi-idempotency-key-header/)
  — IETF draft; check the current revision before relying on header semantics.
- [draft-ietf-httpapi-ratelimit-headers](https://datatracker.ietf.org/doc/draft-ietf-httpapi-ratelimit-headers/)
  — IETF draft; names and semantics have changed across revisions, so check the
  current draft before implementing.
- [OAuth 2.1 (draft)](https://datatracker.ietf.org/doc/draft-ietf-oauth-v2-1/) —
  still in draft; consolidates OAuth 2.0 + mandates PKCE, removes implicit flow.
- [Stripe — Idempotent requests](https://docs.stripe.com/api/idempotent_requests)
  — production-grade implementation reference.
- [Stripe — Designing robust and predictable APIs with idempotency](https://stripe.com/blog/idempotency)
  — design walkthrough.
- [httptoolkit — Working with the new Idempotency Keys RFC](https://httptoolkit.com/blog/idempotency-keys/)
  — tutorial on the draft header.
