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

Security-sensitive paths must deny on uncertainty, turn untrusted input into
typed values before use, and keep secrets out of every output channel.

## When to Use

- Authn/authz, sessions, secrets, crypto, input validation, external
  integrations, dependency updates, supply-chain controls, or any trust-boundary
  change.

## When NOT to Use

- General code quality with no trust boundary; use the relevant engineering
  skill.
- API shape without security semantics; use `api`.
- Runtime alert design; pair with `observability`.

## Core Ideas

1. Identify trust boundaries before reviewing code.
2. Deny by default and fail closed on auth, authz, validation, and crypto
   errors.
3. Validate and normalize external input at the boundary with allowlists.
4. Authorization checks live at the protected operation, not only at the router.
5. Secrets never enter source, logs, traces, metrics, errors, or client
   responses.
6. Dependencies and build steps are part of the attack surface.
7. Security findings are blocking when they enable unauthorized access, data
   exposure, privilege escalation, or secret leakage.

## Workflow

1. Map actors, assets, entry points, trust boundaries, and data flows.
2. Review authentication, authorization, input validation, output encoding,
   secrets, errors, logs, dependencies, and SSRF paths.
3. Run `scripts/dep-audit.sh` when dependency manifests or lockfiles are
   present.
4. Check for tests or abuse cases around the security-sensitive behavior.
5. Classify findings by exploitability and impact.
6. Block merge on high-risk issues; name any unchecked area explicitly.

## Verification

- [ ] Diff contains no secrets or credentials.
- [ ] External input is parsed/validated at trust boundaries.
- [ ] Protected operations perform authorization checks directly.
- [ ] Direct object references include ownership/tenant checks.
- [ ] User-controlled data cannot reach SQL, shell, HTML, SSRF, or
      deserialization sinks unsafely.
- [ ] Auth failure responses do not enumerate users or leak timing/content
      distinctions.
- [ ] Logs, metrics, traces, and errors are source-redacted.
- [ ] Dependencies are pinned and `scripts/dep-audit.sh` is clean or findings
      are triaged.
- [ ] Security-sensitive behavior has tests or documented manual verification.

## Handoffs

- Use `errors` for safe error propagation and user-facing failure shape.
- Use `api` for auth/error/idempotency contract shape.
- Use specialist static-analysis tools for high-risk codebases where Semgrep,
  CodeQL, or dependency provenance matters.

## Tools and References

- `scripts/dep-audit.sh`: lockfile-aware dependency auditor wrapper.
- `references/owasp-2025.md`: OWASP Top 10 notes.
- `references/secrets.md`: secret-handling notes.
