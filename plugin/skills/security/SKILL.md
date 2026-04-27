---
name: security
description: >-
  Use for security-sensitive work: authn/authz, secrets, crypto, input
  validation, dependency risk, OWASP, threat modeling, supply chain, SBOMs,
  signing, sessions, and trust boundaries.
---

# Security

## Iron Law

`FAIL CLOSED. PARSE AT THE BOUNDARY. AUTHORIZE AT THE OPERATION. NO SECRETS OR PII IN LOGS.`

## When to Use

- Authn/authz, sessions, secrets, crypto, input validation, external
  integrations, dependency updates, supply-chain controls, agent / LLM
  tool design, or any trust-boundary change.

## When NOT to Use

- General code quality with no trust boundary; use the relevant
  engineering skill.
- API shape without security semantics; use `api`.
- Runtime alert design; pair with `observability`.

## Scope

This skill assumes networked applications, services, APIs, and agent /
LLM systems. For embedded, firmware, or mobile binaries, layer with
platform-specific guidance, since the threat model differs.

## Core Ideas

1. Identify trust boundaries before reviewing code; deny by default and
   fail closed on auth, authz, validation, and crypto errors.
2. Validate and normalize external input at the boundary with allowlists.
3. Authorization checks live at the protected operation, not only at the
   router. Direct object references include ownership/tenant checks.
4. Secrets never enter source, logs, traces, metrics, errors, or client
   responses. Auth failures avoid user enumeration through shape, content,
   and timing.
5. Dependencies, build steps, and CI identity are part of the attack
   surface.
6. Prefer maintained, well-reviewed security libraries, provider SDKs,
   framework middleware, and standards-based protocols over custom
   implementations. Do not roll auth, crypto, token validation,
   sanitisation, CSRF, parsers, or signature schemes.
7. For agent / LLM systems, every external content channel is untrusted
   input and every tool call is a privileged action.
8. Security findings are blocking when they enable unauthorized access,
   data exposure, privilege escalation, or secret leakage.

## Workflow

1. Map actors, assets, entry points, trust boundaries, and data flows.
2. Review authentication, authorization, input validation, output
   encoding, secrets, errors, logs, dependencies, SSRF / egress paths,
   and (for agent systems) tool surface and prompt-injection vectors.
3. Before implementing security-sensitive behavior, identify the
   framework primitive, provider SDK, or maintained library that owns the
   problem. If custom logic is unavoidable, document the threat model,
   invariants, and negative tests.
4. Run the ecosystem's native dependency audit (see
   `references/dep-audit.md` for the per-ecosystem command) and a
   secrets-scan pass (see `references/secrets-scan.md`).
5. Block merge on high-risk issues; name any unchecked area explicitly.

## Verification

- [ ] Diff contains no secrets or credentials. `gitleaks` (or equivalent)
      run on the branch with no new findings; see `secrets-scan.md`.
- [ ] External input is parsed/validated at trust boundaries with
      allowlist semantics; protected operations perform authorization
      directly with ownership/tenant checks.
- [ ] User-controlled data cannot reach SQL, shell, HTML, SSRF,
      deserialization, file-write, or template-compile sinks unsafely.
- [ ] Outbound HTTP destinations validated against the rules in
      `ssrf-and-egress.md`; cloud-metadata IPs blocked.
- [ ] State-changing endpoints reject cross-origin requests when the
      session is cookie-based (CSRF token, double-submit, or
      `Origin` / `Sec-Fetch-Site` check). State-changing GETs do not
      exist.
- [ ] Request bodies bind to allowlist DTOs, not directly to ORM
      entities; mass-assignment is impossible (`is_admin`, `role`,
      `tenant_id`, `owner_id` are not bindable).
- [ ] File uploads validate by magic bytes, cap size at the proxy, are
      stored under random names, and are served from a cookieless origin
      with `Content-Disposition: attachment` for non-inline types.
- [ ] Webhooks verified with HMAC over raw body bytes, constant-time
      compare, replay window enforced.
- [ ] Output is context-aware encoded (HTML body / attribute / URL / JS
      / CSS); CSP set with no `'unsafe-inline'` / `'unsafe-eval'` on
      scripts; `frame-ancestors` restricted.
- [ ] Cookies use `HttpOnly`, `Secure`, `SameSite`, and `__Host-` prefix
      on session cookies.
- [ ] Auth failure responses do not enumerate users via shape, content,
      or timing; the same discipline applies to registration,
      password reset, MFA enrol, and email change.
- [ ] Logs, metrics, traces, and errors are source-redacted with an
      allowlist of fields (not a deny-list of secrets).
- [ ] Dependencies are pinned and the native audit findings are triaged.
- [ ] Auth, crypto, token validation, sanitisation, CSRF, parsing, and
      signature verification use maintained libraries or framework
      primitives. Any custom implementation has a documented need,
      threat model, and negative tests.
- [ ] Tokens validated with pinned `alg` from configuration / JWKS, not
      from the token header. JWT or PASETO is fine; alg-pinning is what
      matters. See `secrets.md` and `api-and-auth.md`.
- [ ] Security-sensitive behavior has tests or documented manual
      verification (negative tests for unauthenticated, wrong-tenant,
      wrong-role callers; SSRF refusal tests for blocked IPs).
- [ ] For agent / LLM features: tool outputs treated as untrusted input;
      high-impact tools gated; output handling sanitises markdown image
      / link URLs to defeat exfiltration.

## Tripwires

| Trigger | Do this instead | False alarm |
|---|---|---|
| "It's an internal endpoint" | Treat it as untrusted and check auth, authz, validation, and logging. | Isolated local-only developer endpoint with no deployed route. |
| "It's just an internal admin tool" | Admin tools are the highest-blast-radius surface. Authn + MFA + audit log mandatory. | Read-only operator dashboard with no privileged actions and authn at the edge. |
| "The framework handles validation" | Validate the domain rule at the boundary you control. | Framework constraint exactly encodes the domain invariant and is tested. |
| "We need to fetch a URL the user gave us" | Apply the SSRF allowlist + cloud-metadata block from `ssrf-and-egress.md`. | Server-to-server call to a hardcoded internal URL with no user-controlled input. |
| "It's a GET, no need for CSRF" | The state-changing GET is the bug. Convert to POST/PUT/DELETE, then add the CSRF check. | True read-only GET with no side effects. |
| "We strip dangerous tags from the HTML" | Use a vetted sanitiser (DOMPurify, Bleach, sanitize-html). | Output is rendered as text, not HTML, and the framework auto-escapes. |
| "This token / crypto / auth helper is small" | Use the platform's maintained security library or provider SDK; custom code needs a threat model and negative tests first. | Thin adapter around a vetted library with no security decision of its own. |
| "Low severity, ship and patch later" | Fix now or document explicit risk acceptance before merge. | Triage-only task that is not shipping code. |
| "The input source is trusted" | Trace the trust chain and validate before dangerous sinks. | Cryptographically verified internal protocol with tested schema enforcement. |
| "Just this one secret" | Stop and remove the secret from the diff/history path before continuing. Rotate the credential. | Placeholder value that cannot authenticate anywhere. |
| "TODO: add authz check" | Add the authorization check before exposing the path. | Dead code path being deleted in the same change. |
| "The model decides whether to run this command" | Tool outputs are untrusted input. Validate parameters against a schema; never execute model-emitted shell / SQL without an allowlist. | Tool that only returns structured data and has no side effects. |
| "Noisy alert, suppress it" | Tune signal, owner, threshold, or routing instead of silencing. | Temporary suppression during a documented incident response. |

## Handoffs

- `error-handling`: safe error propagation and user-facing failure shape.
- `api`: auth/error/idempotency contract shape, pagination, status codes.
- `database`: tenant isolation, row-level security, deletion semantics,
  query / migration safety.
- `observability`: log redaction patterns, security-event alert design,
  audit-log integrity.
- `deployment`: CI/CD identity, secret scope, signed artifacts,
  migration coordination, rollback during a security incident.
- Specialist static-analysis tools (Semgrep, CodeQL, dependency
  provenance) for high-risk codebases.

## References

- `references/owasp-top-10.md`: per-category mitigations, edition-stamped.
- `references/secrets.md`: secrets, tokens, passwords, MFA, sessions,
  service identity, CI identity.
- `references/web-app.md`: CSRF, XSS / CSP, security headers, cookies,
  clickjacking, open redirect, mixed content / SRI, CORS.
- `references/api-and-auth.md`: OAuth / OIDC client and server, JWT /
  JWKS validation, API keys, webhook HMAC, BOLA / BFLA, rate limiting.
- `references/ssrf-and-egress.md`: SSRF mitigation patterns,
  block / allowlist, DNS rebinding, cloud-metadata defence, egress
  controls.
- `references/file-and-input.md`: file upload, path traversal, ZIP slip,
  XXE, deserialisation, mass assignment, ReDoS, parser differentials.
- `references/ai-agent.md`: prompt injection, tool sandboxing, output
  handling, RAG threats, agent supply chain.
- `references/infra.md`: container hardening, Kubernetes baseline,
  cloud baseline, IaC and image scanning, CI/CD identity, dependency
  confusion, TLS.
- `references/dep-audit.md`: per-ecosystem dependency-audit command
  table.
- `references/secrets-scan.md`: detecting credential leaks in source,
  history, and the working tree.
