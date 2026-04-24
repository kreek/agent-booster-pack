---
name: errors
description:
  Use when designing error types, deciding between exceptions and Result/Either
  types, wrapping errors with context, deciding whether to retry or fail,
  writing user-facing error messages, or handling panics vs recoverable errors.
  Also use when the user asks why errors are getting swallowed, or how to
  propagate errors without losing context.
---

# Errors

## Iron Law

`ERRORS CARRY CONTEXT. NEVER CATCH WITHOUT HANDLING OR RE-RAISING.`

Silencing an error is not handling it. Either recover correctly, propagate with
context, or stop because continuing is unsafe.

## When to Use

- Designing or reviewing error types, exceptions, Result/Either flows, wrapping,
  retries, panics, user-facing errors, or swallowed failures.

## When NOT to Use

- Remote-call retry policy; use `resilience`.
- Security-specific failure shape; pair with `security`.
- Observability of errors in production; pair with `observability`.

## Core Ideas

1. Failure is part of the function contract.
2. Add context at each boundary; preserve the original cause.
3. Catch only where you can decide: recover, translate, retry, or terminate.
4. Classify errors as user-correctable, transient, or programmer/system faults.
5. User-facing messages are safe and actionable; internal errors keep diagnostic
   detail under a correlation ID.
6. Retrying is an error-handling choice only for idempotent, transient failures.
7. Panics/assertions are for impossible states and process boundaries, not
   routine control flow.

## Workflow

1. Identify where the error originates and where the decision can be made.
2. Choose return-value errors, exceptions, Result/Either, or process termination
   based on caller contract.
3. Wrap with operation, resource, and correlation context.
4. Translate to user/API/CLI shape at the boundary.
5. Test at least one failure path for each public operation that can fail.

## Verification

- [ ] Every catch/rescue/except either recovers, translates, retries safely, or
      re-raises with context.
- [ ] Failure-capable public functions declare or document failure in their
      contract.
- [ ] Wrapped errors preserve underlying cause.
- [ ] User-facing errors do not expose stack traces, SQL, file paths, hostnames,
      or secrets.
- [ ] Error responses include a correlation ID that connects to internal logs.
- [ ] Auth failures avoid user enumeration through shape, content, and timing.
- [ ] Retries apply only to idempotent/transient failures with a budget.
- [ ] Tests cover representative failure paths.

## Handoffs

- Use `security` for auth, secrets, validation, fail-closed behavior, and
  information disclosure.
- Use `resilience` for retry budgets, idempotency keys, and circuit breakers.
- Use `observability` for correlation IDs, logs, traces, and error-rate alerts.

## References

- Go error wrapping: <https://go.dev/blog/go1.13-errors>
- Rust error handling:
  <https://doc.rust-lang.org/book/ch09-00-error-handling.html>
- Dave Cheney, error handling:
  <https://dave.cheney.net/2016/04/27/dont-just-check-errors-handle-them-gracefully>
