---
name: api
description: Use for REST API contract design, evolution, versioning, status codes, and error shape.
---

# API

## Iron Law

`DESIGN THE CONTRACT FIRST. EVOLVE WITHOUT BREAKING. PICK STATUS BY ORIGIN.`

## When to Use

- Adding, removing, renaming, or reviewing endpoints, fields, status
  codes, webhooks, auth, pagination, rate limits, or idempotency.
- Writing or changing OpenAPI, JSON Schema, public SDK boundaries, or
  module interfaces external callers depend on.

## When NOT to Use

- Internal function signatures with no caller contract; use
  `domain-modeling` or `refactoring`.
- Auth, secrets, or trust-boundary review beyond API shape; use
  `security`.
- Database schema design; use `database`.
- Non-REST API styles (gRPC, GraphQL, message queues): contract,
  error, and evolution conventions differ; use `architecture` for
  style-of-API decisions and the relevant ecosystem's conventions for
  shape.

## Core Ideas

1. **Contract first.** Sketch OpenAPI/equivalent before controller
   code; implement *from* the contract, not toward it. Every response
   shape is explicit, including errors, empty states, pagination, and
   auth failures. Durable API interfaces route through `contract-first`
   for sign-off; error shape is part of the contract.

2. **Evolution: additive in place; breaking needs a path forward.**
   Optional fields, query params, headers, methods, and endpoints
   evolve in place. Renames, removals, required additions, status-code
   changes, and semantic changes need a successor contract or
   deprecation path — never break in place. See
   `references/api-evolution.md`.

3. **Versioning: one strategy per service.** Pick URL path, media
   type, header, or date and apply it consistently. Major bumps for
   breaking changes only; compatible additions never re-version.
   Retire versions with an overlap window; route deprecation
   primitives through `release`. See `references/api-evolution.md`.

4. **Errors: status by origin, shape by contract.** `4xx` for
   consumer-request problems, `5xx` for upstream or your-service
   problems; never mix origins in one response. Use the chosen data
   model's native error shape (JSON:API `errors[]`, FHIR
   `OperationOutcome`, or RFC 9457 Problem Details) — these are
   structurally distinct conventions, not interchangeable. Never leak
   raw upstream or internal errors. See
   `references/rest-error-status-codes.md`.

5. **Default to JSON:API; switch only when the domain has its own
   standard.** JSON:API is the default for REST resource APIs (envelope
   with `id`/`type`/`attributes`/`relationships`, sparse fieldsets,
   includes, pagination conventions, error array). Switch to a
   domain-specific standard when one applies — FHIR for healthcare,
   HAL for hypermedia-centric APIs, JSON-LD when semantic-web interop
   matters. Document deviations from the chosen standard explicitly.
   See `references/data-models.md`.

## Workflow

1. Identify the caller and the contract surface they bind to. Define
   paths, methods, request/response bodies, status codes, auth,
   pagination, idempotency, and error shape.
2. Durable API interfaces: route through `contract-first` before
   controller, client, SDK, webhook, or integration implementation
   continues. Add error shape to the contract artifacts.
3. Errors: pick status by origin
   (`references/rest-error-status-codes.md`); compatibility-check the
   change (`references/api-evolution.md`).
4. Mutations: define the idempotency contract
   (`references/idempotency.md`).
5. Lists and streams: define cursor and bounded-pagination semantics
   (`references/pagination.md`).
6. Webhooks: sign, version, and deduplicate
   (`references/webhooks.md`).
7. Pipeline: place transport-wide concerns in middleware; keep
   route-specific logic in handlers
   (`references/middleware-vs-handler.md`).
8. For each public contract change, record a Proof Contract: contract
   claim, data invariant, public boundary, check, evidence. Add
   contract or behavior tests at the outermost boundary; update
   generated/source-of-truth docs only.

## Verification

- [ ] Contract exists or is updated before implementation lands.
- [ ] Durable API interfaces have explicit user approval before
      implementation continues.
- [ ] Every endpoint documents request, responses by status, auth, and
      errors.
- [ ] Errors use one consistent shape across the API matching the
      chosen data model (JSON:API errors by default; FHIR
      `OperationOutcome` for healthcare; Problem Details for plain
      JSON); status codes are selected by origin and don't leak
      implementation detail.
- [ ] Request and response bodies use JSON:API by default, or a
      domain-specific standard (FHIR, HAL, JSON-LD) when the domain
      has one. Custom shapes are documented with equivalent rigor;
      deviations from the chosen standard are explicit.
- [ ] Non-idempotent mutations either accept an idempotency key (with
      scope, replay window, duplicate response, conflict semantics) or
      are documented as unsafe to retry.
- [ ] Lists and streams have bounded pagination, stable ordering, and
      explicit invalid-token behavior; bad continuation tokens do not
      silently restart, rewind, or skip position.
- [ ] Additive changes are optional; old calls and consumers that
      ignore new fields, parameters, headers, or endpoints still work.
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
- Use `async-systems` for SSE/subscription transport, event-stream
  semantics, idempotent async consumers, and delivery guarantees.
- Use `release` for the actual bump, CHANGELOG, and deprecation
  primitives.
- Use `documentation` when deciding where API docs live; generated
  contract reference is the source of truth.

## References

- `references/api-evolution.md`: evolution rules and versioning
  strategies.
- `references/rest-error-status-codes.md`: status-by-origin decision
  tree.
- `references/data-models.md`: JSON:API as the REST default; FHIR,
  HAL, JSON-LD when the domain calls for them.
- `references/idempotency.md`: idempotency-key contract.
- `references/pagination.md`: cursor and bounded-pagination semantics.
- `references/webhooks.md`: signing, versioning, replay protection.
- `references/middleware-vs-handler.md`: request-pipeline placement.
- `../security/references/web-app.md`: CSRF middleware, security
  headers, and CORS.
- `../security/references/api-and-auth.md`: handler-level
  authorisation caveats for privileged endpoints.
- RFC 9457 Problem Details: <https://www.rfc-editor.org/rfc/rfc9457>
- Idempotency-Key draft:
  <https://datatracker.ietf.org/doc/draft-ietf-httpapi-idempotency-key-header/>
- RateLimit headers draft:
  <https://datatracker.ietf.org/doc/draft-ietf-httpapi-ratelimit-headers/>
- OpenAPI 3.1: <https://spec.openapis.org/oas/latest.html>
