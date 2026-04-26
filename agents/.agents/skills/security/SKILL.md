---
name: security
description:
  Use when touching authentication, authorisation, secrets management,
  cryptography, input validation, or dependency updates; when reviewing code for
  OWASP Top 10 risks; when discussing threat modelling, supply chain security,
  zero trust, SBOMs, or signing artifacts. Also use before merging any PR that
  changes auth flows, session handling, or trust boundaries.
---

# Security

## Iron Law

`FAIL CLOSED. PARSE AT THE BOUNDARY. NO SECRETS IN LOGS.`

## When to Use

- Authn/authz, sessions, secrets, crypto, input validation, external
  integrations, dependency updates, supply-chain controls, or any
  trust-boundary change.

## When NOT to Use

- General code quality with no trust boundary; use the relevant
  engineering skill.
- API shape without security semantics; use `api`.
- Runtime alert design; pair with `observability`.

## Core Ideas

1. Identify trust boundaries before reviewing code; deny by default and
   fail closed on auth, authz, validation, and crypto errors.
2. Validate and normalize external input at the boundary with
   allowlists.
3. Authorization checks live at the protected operation, not only at
   the router. Direct object references include ownership/tenant
   checks.
4. Secrets never enter source, logs, traces, metrics, errors, or client
   responses. Auth failures avoid user enumeration through shape,
   content, and timing.
5. Dependencies and build steps are part of the attack surface.
6. Security findings are blocking when they enable unauthorized access,
   data exposure, privilege escalation, or secret leakage.

## Workflow

1. Map actors, assets, entry points, trust boundaries, and data flows.
2. Review authentication, authorization, input validation, output
   encoding, secrets, errors, logs, dependencies, and SSRF paths.
3. Run the ecosystem's native dependency audit command when dependency
   manifests or lockfiles are present.
4. Block merge on high-risk issues; name any unchecked area explicitly.

## Verification

- [ ] Diff contains no secrets or credentials.
- [ ] External input is parsed/validated at trust boundaries; protected
      operations perform authorization directly with ownership/tenant
      checks.
- [ ] User-controlled data cannot reach SQL, shell, HTML, SSRF, or
      deserialization sinks unsafely.
- [ ] Auth failure responses do not enumerate users via shape, content,
      or timing.
- [ ] Logs, metrics, traces, and errors are source-redacted.
- [ ] Dependencies are pinned and native audit findings are triaged.
- [ ] Security-sensitive behavior has tests or documented manual
      verification.

## Tripwires

| Trigger | Do this instead | False alarm |
|---|---|---|
| "It's an internal endpoint" | Treat it as untrusted and check auth, authz, validation, and logging. | Isolated local-only developer endpoint with no deployed route. |
| "The framework handles validation" | Validate the domain rule at the boundary you control. | Framework constraint exactly encodes the domain invariant and is tested. |
| "Low severity, ship and patch later" | Fix now or document explicit risk acceptance before merge. | Triage-only task that is not shipping code. |
| "The input source is trusted" | Trace the trust chain and validate before dangerous sinks. | Cryptographically verified internal protocol with tested schema enforcement. |
| "Just this one secret" | Stop and remove the secret from the diff/history path before continuing. | Placeholder value that cannot authenticate anywhere. |
| "TODO: add authz check" | Add the authorization check before exposing the path. | Dead code path being deleted in the same change. |
| "Noisy alert, suppress it" | Tune signal, owner, threshold, or routing instead of silencing. | Temporary suppression during a documented incident response. |

## Handoffs

- Use `error-handling` for safe error propagation and user-facing
  failure shape.
- Use `api` for auth/error/idempotency contract shape.
- Use specialist static-analysis tools (Semgrep, CodeQL, dependency
  provenance) for high-risk codebases.

## References

- `references/owasp-top-10.md`: OWASP Top 10 notes.
- `references/secrets.md`: secret-handling notes.
