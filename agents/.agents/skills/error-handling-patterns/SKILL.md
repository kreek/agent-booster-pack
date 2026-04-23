---
name: error-handling-patterns
description:
  Use when designing error types, deciding between exceptions and Result/Either
  types, wrapping errors with context, deciding whether to retry or fail,
  writing user-facing error messages, or handling panics vs recoverable errors.
  Also use when the user asks why errors are getting swallowed, or how to
  propagate errors without losing context.
---

# Error Handling Patterns

## Errors as Values (Preferred)

Errors that can reasonably occur are part of a function's contract. Represent
them in the return type — don't hide them in exceptions that callers can forget
to catch.

```rust
// Rust: Result<T, E> is idiomatic
fn parse_config(path: &str) -> Result<Config, ConfigError> { ... }

// Go: explicit error return
func ParseConfig(path string) (Config, error) { ... }

// TypeScript with neverthrow
function parseConfig(path: string): Result<Config, ConfigError> { ... }

// Python: use dataclass variants or a library like returns
```

**Benefits:** the type signature documents failure modes; callers must handle
errors; no invisible control flow.

**Use exceptions for:** truly unexpected conditions (programming errors,
hardware failures, impossible states).

---

## Wrap Errors with Context

A bare error like `file not found` is useless in a stack trace. Wrap errors at
each layer, adding context as you go up.

```go
// Go: %w wraps for errors.Is/errors.As
return fmt.Errorf("loading user %d: %w", userID, err)
```

```python
# Python: chained exceptions
try:
    raw = open(path)
except OSError as e:
    raise ConfigLoadError(f"loading config from {path}") from e
```

```rust
// Rust: anyhow Context trait
use anyhow::Context;
let config = std::fs::read_to_string(path)
    .with_context(|| format!("loading config from {path}"))?;
```

**Rule:** add context at every layer that knows something the caller doesn't.
The low-level error says _what_ failed; your wrapper says _why you were doing
it_.

---

## Three Error Categories

Different categories need different responses:

| Category             | Examples                                             | Response                                           |
| -------------------- | ---------------------------------------------------- | -------------------------------------------------- |
| **Domain errors**    | Invalid input, business rule violation, not found    | Return to caller as a typed error; present to user |
| **Transient errors** | Network timeout, DB connection lost, rate limited    | Retry with backoff (if operation is idempotent)    |
| **Bugs**             | Nil dereference, assertion failure, unexpected state | Fail fast (panic/crash), alert, do not retry       |

**Never swallow an error.** If you can't handle it, propagate it. A silenced
error is a bug waiting to surface at 3am.

```python
# Bad: swallowed error
try:
    do_thing()
except Exception:
    pass

# Bad: logged but not propagated
try:
    do_thing()
except Exception as e:
    logger.error("something went wrong", exc_info=e)
    # function continues as if nothing happened

# Good: log + propagate, or propagate without logging (let the boundary log)
try:
    do_thing()
except TransientError as e:
    raise RetryableError("thing failed") from e
```

---

## User-Facing Error Messages

What you show the user is different from what you log internally.

**Rules:**

1. Never expose stack traces, internal paths, or DB error messages to users.
2. Never expose whether a user/email exists (authentication enumeration). Use
   identical messages for "wrong password" and "no such user."
3. Include a **correlation ID** (request ID, trace ID) that users can give
   support to look up the internal error.
4. Be specific about what went wrong and what the user can do.

```json
{
  "type": "https://example.com/errors/validation-failed",
  "title": "Validation Failed",
  "status": 422,
  "detail": "The 'email' field must be a valid email address.",
  "instance": "/requests/req-abc-123"
}
```

Log the full internal error (with stack trace, DB query, etc.) at ERROR level
with the same `instance` ID. Support can look it up.

---

## Retry vs Fail Decision Tree

```
Is the error transient?
├── No → fail with a typed domain or bug error
└── Yes → is the operation idempotent (or do we have an idempotency key)?
    ├── No → fail (do not retry non-idempotent POST without idempotency key)
    └── Yes → have we exceeded the retry budget?
        ├── Yes → fail with a timeout/circuit-open error
        └── No → retry with exponential backoff + full jitter
                  (see distributed-systems-resilience skill)
```

**Retry budget:** track attempts across the call chain, not just locally. If a
parent operation has a 30s deadline and your retries consume 25s, the parent
will time out regardless.

---

## Error Boundaries

An error boundary is a layer that catches errors from below and decides how to
handle them — log, convert, propagate, or present to users.

In a typical service:

- **HTTP handler layer:** catches all errors, converts to RFC 9457 responses,
  logs with correlation ID.
- **Application layer:** converts infrastructure errors (DB errors) to domain
  errors.
- **Domain layer:** never catches errors; raises domain errors as typed values.

**The handler boundary is the last line of defence.** It must never let an
unhandled error reach the client as a 500 with a raw stack trace.

---

## Panics Are for "Cannot Happen"

A panic (or equivalent: Java unchecked exception, Go panic, Rust panic) signals
a bug — a state the programmer proved cannot occur. It is not a substitute for
error handling.

Use panic when:

- An invariant the code explicitly guarantees has been violated.
- An index is out of bounds after a bounds check that should have prevented it.
- A type assertion fails on data the caller guarantees is of that type.

Never use panic for:

- User input that fails validation.
- Network calls that return an error.
- "I didn't expect this case" — that's a missing branch, not a panic.

Catch panics only at process boundaries (HTTP handler middleware, message
consumer) to convert them to 500 errors and prevent process death. Log the full
stack trace and alert.
