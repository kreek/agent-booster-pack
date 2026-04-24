---
name: api
description:
  Best practices for designing and implementing REST/HTTP APIs. Use whenever the
  user is designing a new API, adding endpoints to an existing one, writing or
  editing an OpenAPI spec, deciding on URI structure or HTTP verbs, shaping JSON
  request/response bodies, handling error responses and status codes, versioning
  an API, adding pagination, choosing between API keys and OAuth, designing
  webhooks, implementing idempotency keys, rate limiting, or reviewing API code
  for consistency. Trigger even when the user does not say "best practices",
  especially when they mention RFC 9457, Problem Details, cursor pagination,
  Sunset header, or Idempotency-Key.
---

# API

## Iron Law

`DESIGN THE CONTRACT BEFORE THE IMPLEMENTATION. NEVER SHIP A SILENT BREAKING CHANGE.`

Once a client can bind to an API, the contract is product behavior. Breaks need
a new version or a documented deprecation window with a successor path.

## When to Use

- Adding, removing, renaming, or reviewing endpoints, fields, status codes,
  webhooks, auth, pagination, rate limits, or idempotency behavior.
- Writing or changing OpenAPI, JSON Schema, public SDK boundaries, or module
  interfaces that external callers depend on.

## When NOT to Use

- Internal function signatures with no caller contract; use `data` or
  `refactoring`.
- Auth, secrets, or trust-boundary review beyond API shape; use `security`.
- Database schema design; use `database`.

## Core Ideas

1. Contract first: sketch or update OpenAPI/equivalent before controller code.
2. Resource names are nouns; verbs belong in HTTP methods unless the operation
   is truly non-resource.
3. Every response shape is explicit, including errors, empty states, pagination,
   and auth failures.
4. Mutations are safe to retry only when they have an idempotency strategy.
5. List endpoints have bounded pagination and stable ordering.
6. Compatibility is a feature: add before remove, deprecate before breaking.
7. Webhooks are APIs too: sign payloads, version events, and make receivers
   idempotent.

## Workflow

1. Identify the caller and the contract surface they will bind to.
2. Define paths, methods, request bodies, response bodies, status codes, auth,
   pagination, idempotency, and error shape.
3. Check for compatibility: new optional fields are usually safe; renames,
   removals, status-code changes, and semantic changes are breaking.
4. For each public contract change, record a Proof Contract: contract claim,
   data invariant, public boundary, check, evidence.
5. Implement from the contract, not the other way around.
6. Add contract or behavior tests at the outermost boundary.
7. Update generated or source-of-truth docs only; do not duplicate reference
   prose.

## Verification

- [ ] Contract exists or is updated before implementation lands.
- [ ] Every endpoint documents request, responses by status, auth, and errors.
- [ ] Errors use a consistent Problem Details-style shape.
- [ ] Non-idempotent mutations either accept an idempotency key or are
      documented as unsafe to retry.
- [ ] Lists have cursor or equivalent bounded pagination with a server-side cap.
- [ ] Breaking changes have versioning or deprecation with overlap and successor
      guidance.
- [ ] Webhooks are signed, timestamped, replay-protected, and deduplicable.
- [ ] Tests exercise the public boundary, not only internal handlers.
- [ ] Every public contract claim has proof evidence, or the claim is reported
      as unproven.

## Handoffs

- Use `proof` when API claims need explicit proof obligations.
- Use `security` for authn/authz, input trust, SSRF, secrets, and data exposure.
- Use `resilience` for remote-call retries, idempotent consumers, and delivery
  guarantees.
- Use `documentation` when deciding where API docs live; generated contract
  reference is the source of truth.

## References

- RFC 9457 Problem Details: <https://www.rfc-editor.org/rfc/rfc9457>
- Idempotency-Key draft:
  <https://datatracker.ietf.org/doc/draft-ietf-httpapi-idempotency-key-header/>
- RateLimit headers draft:
  <https://datatracker.ietf.org/doc/draft-ietf-httpapi-ratelimit-headers/>
- OpenAPI 3.1: <https://spec.openapis.org/oas/latest.html>
