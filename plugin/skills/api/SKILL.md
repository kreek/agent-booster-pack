---
name: api
description: Use for HTTP APIs, OpenAPI, request/response shape, status codes, auth, and webhooks.
---

# API

## Iron Law

`DESIGN THE CONTRACT BEFORE THE IMPLEMENTATION. DO NOT BREAK A PUBLISHED CONTRACT IN PLACE.`

## When to Use

- Adding, removing, renaming, or reviewing endpoints, fields, status
  codes, webhooks, auth, pagination, rate limits, or idempotency.
- Writing or changing OpenAPI, JSON Schema, public SDK boundaries, or
  module interfaces external callers depend on.

## When NOT to Use

- Internal function signatures with no caller contract; use
  `data-first` or `refactoring`.
- Auth, secrets, or trust-boundary review beyond API shape; use
  `security`.
- Database schema design; use `database`.

## Core Ideas

1. Contract first: sketch or update OpenAPI/equivalent before
   controller code. Implement from the contract, not the other way
   around.
2. Resource names are nouns; verbs belong in HTTP methods unless the
   operation is truly non-resource.
3. Every response shape is explicit, including errors, empty states,
   pagination, and auth failures.
4. Mutations are safe to retry only when the public contract defines an
   idempotency strategy: key scope, replay window, duplicate response
   behavior, and conflict semantics.
5. List endpoints have bounded pagination and stable ordering.
6. Compatibility is a feature: optional additive changes can evolve an
   API without a new contract version; removals, renames, required
   additions, status-code changes, and semantic changes need a
   successor contract or deprecation path. Hand off the bump,
   CHANGELOG, and deprecation primitives to `release`.
7. Webhooks are APIs too: sign payloads, version events, and make
   receivers idempotent.

## Request Pipeline and Middleware

Move behavior into middleware only when it is a transport-wide request
pipeline concern with the same rule for many routes: request IDs,
logging, tracing, CORS, security headers, body parsing, authentication
context, coarse rate limiting, or final error-shape translation.
Middleware may establish context and reject requests that fail a global
gate, but endpoint-specific validation, resource ownership, privileged
authorisation, and domain invariants stay in handlers or domain code
where the specific resource, actor, and contract are visible.

## API Evolution

Optional additive changes preserve the existing contract when existing
calls keep working and existing consumers can ignore the new surface.
Adding endpoints, optional query parameters, optional fields, and
optional headers is usually evolutionary. Changing methods, status
codes, header names/types, required fields, removals, or in-place
renames breaks the existing contract. Rename by adding the successor,
keeping the old name, and deprecating it. Prefer extensible object
shapes over ordered or flat scalar payloads.

## HTTP Error Codes

Choose status by **origin**, then map to a stable public contract.
Never pass raw upstream or internal errors through.

| Origin | Use |
|---|---|
| Consumer request problem | `4xx`: `400` malformed, `401` unauthenticated, `403` unauthorized, `404` missing, `422` semantically invalid, `429` rate limited |
| Upstream dependency problem | `503` upstream unavailable, `504` upstream timeout, `502` upstream responded but failed |
| Your service problem | `500` for unexpected application faults; platform may surface `503`/`504` at gateway boundary |

Return multiple `4xx` request errors together when practical (most
specific `4xx` or `400` with per-field details). Never mix client and
server-origin failures into a client error.

## Workflow

1. Identify the caller and the contract surface they will bind to.
   Define paths, methods, request/response bodies, status codes, auth,
   pagination, idempotency, and error shape.
2. For each error response, pick status by origin (request, upstream,
   your service). Check compatibility: new optional fields, query
   parameters, headers, methods, and endpoints are usually safe;
   renames, removals, required additions, status-code changes, and
   semantic changes require a successor contract or deprecation path.
3. For retryable public mutations, document the idempotency-key
   contract and prove duplicate submissions cannot create duplicate
   side effects.
4. For request-pipeline concerns, decide whether the behavior belongs in
   middleware, an edge/gateway, or the endpoint handler. Keep
   route-specific business rules out of global middleware.
5. For each public contract change, record a Proof Contract: contract
   claim, data invariant, public boundary, check, evidence. Add
   contract or behavior tests at the outermost boundary; update
   generated/source-of-truth docs only.

## Verification

- [ ] Contract exists or is updated before implementation lands.
- [ ] Every endpoint documents request, responses by status, auth, and
      errors.
- [ ] Errors use a consistent Problem Details-style shape; status codes
      are selected by origin and don't leak implementation detail.
- [ ] Non-idempotent mutations either accept an idempotency key or are
      documented as unsafe to retry.
- [ ] Public idempotency keys define scope, replay window, duplicate
      response behavior, and conflict semantics.
- [ ] Lists have cursor or equivalent bounded pagination with a
      server-side cap.
- [ ] Additive changes are optional; old calls and consumers that
      ignore new fields, parameters, headers, or endpoints still work.
- [ ] Request and response bodies use extensible object shapes and
      specific field names rather than ordered or flat scalar payloads.
- [ ] No existing contract is broken in place; incompatible changes
      have a successor contract or deprecation path with overlap and
      migration guidance.
- [ ] Webhooks are signed, timestamped, replay-protected, and
      deduplicable.
- [ ] Middleware is limited to transport-wide request-pipeline
      concerns; endpoint-specific validation, ownership checks,
      privileged authorisation, and domain invariants stay at the
      route/domain boundary.
- [ ] Tests exercise the public boundary, not only internal handlers;
      every public contract claim has proof evidence or is reported as
      unproven.

## Handoffs

- Use `proof` when API claims need explicit proof obligations.
- Use `error-handling` when mapping internal failures to the public API
  error contract, or when designing remote-call timeouts, retry
  budgets, and circuit breakers behind the API.
- Use `security` for authn/authz, input trust, SSRF, secrets, and data
  exposure; prefer the framework's middleware for global browser and
  transport controls, but keep resource-specific authorisation in the
  handler/domain path.
- Use `architecture` when deciding whether request middleware is a real
  transport boundary or just a horizontal layer that scatters feature
  behavior.
- Use `async-systems` for SSE/subscription transport and event-stream
  semantics.
- Use `async-systems` for idempotent async consumers and delivery
  guarantees.
- Use `release` for the actual bump, CHANGELOG, and deprecation
  primitives.
- Use `documentation` when deciding where API docs live; generated
  contract reference is the source of truth.

## References

- RFC 9457 Problem Details: <https://www.rfc-editor.org/rfc/rfc9457>
- `references/rest-error-status-codes.md`: local REST error status-code
  decision tree.
- `references/api-evolution.md`: optional additive API evolution and
  extensibility guidance.
- `../security/references/web-app.md`: CSRF middleware, security
  headers, and CORS.
- `../security/references/api-and-auth.md`: handler-level
  authorisation caveats for privileged endpoints.
- Idempotency-Key draft:
  <https://datatracker.ietf.org/doc/draft-ietf-httpapi-idempotency-key-header/>
- RateLimit headers draft:
  <https://datatracker.ietf.org/doc/draft-ietf-httpapi-ratelimit-headers/>
- OpenAPI 3.1: <https://spec.openapis.org/oas/latest.html>
