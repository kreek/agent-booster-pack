---
name: error-handling
description:
  Use when designing error types, deciding between exceptions and Result/Either
  types, keeping errors inside their domain boundary, wrapping errors with
  context, deciding whether to retry or fail, setting remote-call timeouts or
  retry budgets, choosing circuit breakers or bulkheads, writing user-facing
  error messages, or handling panics vs recoverable errors. Also use when the
  user asks why errors are getting swallowed, or how to propagate errors without
  losing context.
---

# Error Handling

## Iron Law

`ERRORS CARRY CONTEXT. NEVER CATCH WITHOUT HANDLING OR RE-RAISING.`

## When to Use

- Designing or reviewing typed errors, exceptions, Result/Either flows,
  domain error boundaries, wrapping, retries, remote dependency failures, panics,
  user-facing errors, or swallowed failures.

## When NOT to Use

- Security-specific failure shape; pair with `security`.
- Observability of errors in production; pair with `observability`.

## Core Ideas

1. Failure is part of the function contract.
2. Add context at each boundary; preserve the original cause. Catch
   only where you can decide: recover, translate, retry, or terminate.
3. Errors do not escape their domain unchanged. Translate domain,
   infrastructure, API, CLI, and UI failures at the boundary where the
   caller's contract changes.
4. Expected failures are typed: use named exception classes,
   discriminated unions, enums, or structured `Result` variants. Do
   not raise/throw bare strings or anonymous generic errors for
   recoverable cases.
5. Classify errors as user-correctable, transient, or programmer/system
   faults.
6. For REST APIs, translate failures by origin at the boundary: request
   problems → `4xx`, upstream dependency failures → `502`/`503`/`504`,
   unexpected application faults → `500`. Use `api` for the full
   status-code taxonomy.
7. User-facing messages are safe and actionable; internal errors keep
   diagnostic detail under a correlation ID.
8. Retrying is only for idempotent, transient failures. Retry in one
   layer only, with a cap, jitter/backoff, and a budget.
9. Remote calls need finite connect/read or equivalent timeouts derived
   from observed latency, not defaults.
10. Circuit breakers, bulkheads, and load shedding protect callers from
   critical dependency failure.
11. Panics/assertions are for impossible states and process boundaries,
   not routine control flow.

## Workflow

1. Identify where the error originates and where the decision can be
   made. Choose return-value errors, exceptions, Result/Either, or
   process termination based on caller contract.
2. Define the domain error vocabulary for expected failures. Translate
   it when crossing into another domain or public interface; do not
   leak storage, transport, vendor, or UI-specific errors inward or
   outward.
3. Wrap with operation, resource, and correlation context. Translate to
   user/API/CLI shape at the boundary.
4. For each remote dependency, define timeout, retry budget,
   idempotency requirement, and failure behavior before coding the
   caller.
5. Test at least one failure path for each public operation that can
   fail.

## Verification

- [ ] Every catch/rescue/except either recovers, translates, retries
      safely, or re-raises with context.
- [ ] Failure-capable public functions declare or document failure in
      their contract; wrapped errors preserve underlying cause.
- [ ] Expected failures use typed error classes, structured
      Result/Either variants, enums, or discriminated unions; no
      recoverable path raises/throws bare strings or anonymous generic
      errors.
- [ ] Domain, infrastructure, API, CLI, and UI errors are translated at
      their boundaries instead of leaking across unchanged.
- [ ] User-facing errors do not expose stack traces, SQL, file paths,
      hostnames, or secrets; error responses include a correlation ID.
- [ ] REST API errors are classified by origin before status-code
      selection.
- [ ] Auth failures avoid user enumeration through shape, content, and
      timing.
- [ ] Retries apply only to idempotent/transient failures with a
      capped budget, jitter/backoff, and one retrying layer.
- [ ] Remote calls have finite connect/read or equivalent timeouts.
- [ ] Critical dependencies define circuit breaker, bulkhead,
      load-shedding, or deliberate fail-fast behavior.
- [ ] Tests cover representative failure paths.

## Handoffs

- Use `security` for auth, secrets, validation, fail-closed behavior,
  and information disclosure.
- Use `api` for REST status-code selection, Problem Details/JSON:API
  error contracts, public idempotency-key contracts, OpenAPI response
  docs, and compatibility.
- Use `domain-design` when the error vocabulary is part of the domain
  model or state machine.
- Use `observability` for correlation IDs, logs, traces, and error-rate
  alerts, including critical dependency health.

## References

- Go error wrapping: <https://go.dev/blog/go1.13-errors>
- `../api/references/rest-error-status-codes.md`: local REST error
  status-code decision tree.
- Rust error handling:
  <https://doc.rust-lang.org/book/ch09-00-error-handling.html>
- Dave Cheney, error handling:
  <https://dave.cheney.net/2016/04/27/dont-just-check-errors-handle-them-gracefully>
- AWS Builders' Library, timeouts/retries/backoff:
  <https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/>
