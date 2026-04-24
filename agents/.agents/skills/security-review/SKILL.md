---
name: security-review
description:
  Use when touching authentication, authorisation, secrets management,
  cryptography, input validation, or dependency updates; when reviewing code for
  OWASP Top 10 risks; when discussing threat modelling, supply chain security,
  zero trust, SBOMs, or signing artifacts. Also use before merging any PR that
  changes auth flows, session handling, or trust boundaries.
---

# Security Review

## Default Stance (every review)

- Assume input is hostile until validated at the boundary.
- Assume every dependency is compromised until pinned and provenance-verified.
- On detected invariant violation → crash, never continue.
- Fail closed on auth, authz, or crypto errors; never silently degrade.
- Never roll your own crypto, hash, MAC, or token format.
- Constant-time compare for any secret equality check.

---

## OWASP Top 10:2025

Know the list, not just the top three.

| #   | Category                               |
| --- | -------------------------------------- |
| A01 | Broken Access Control                  |
| A02 | Security Misconfiguration              |
| A03 | Software Supply Chain Failures         |
| A04 | Cryptographic Failures                 |
| A05 | Injection                              |
| A06 | Insecure Design                        |
| A07 | Authentication Failures                |
| A08 | Software or Data Integrity Failures    |
| A09 | Security Logging and Alerting Failures |
| A10 | Mishandling of Exceptional Conditions  |

**New focus areas vs 2021:**

- Supply chain (A03): are third-party packages pinned and provenance-verified?
- Exception handling (A10): do error responses leak stack traces, internal
  paths, or auth enumeration signals?

---

## Threat Modelling: 4 Questions + STRIDE

Before STRIDE, answer:

1. What are we building? (data-flow diagram, trust boundaries)
2. What can go wrong? (STRIDE per element)
3. What are we doing about it? (mitigate / accept / transfer)
4. Did we do a good job? (re-review after changes)

Run STRIDE against any new API endpoint, auth flow, or data pipeline:

| Threat                     | Question to ask                                    | Mitigation                                |
| -------------------------- | -------------------------------------------------- | ----------------------------------------- |
| **S**poofing               | Can an attacker impersonate a user or service?     | Strong authn, mTLS                        |
| **T**ampering              | Can data be modified in transit or at rest?        | HMAC, TLS, signed tokens                  |
| **R**epudiation            | Can actors deny their actions?                     | Audit logs with non-repudiation           |
| **I**nformation Disclosure | What data leaks on error or through side channels? | Minimal error detail, no PII in logs      |
| **D**enial of Service      | Can the system be overwhelmed?                     | Rate limiting, timeouts, circuit breakers |
| **E**levation of Privilege | Can a user gain more access than intended?         | RBAC, principle of least privilege        |

For each threat: identify the attack surface, rate likelihood × impact, decide
to mitigate/accept/transfer.

---

## Authorisation (A01 — the #1 risk)

Every protected endpoint:

- Authz check in the handler, not only the router.
- Check ownership of referenced object IDs (IDOR).
- Deny by default; allowlist roles/scopes.
- Test with unauth, wrong-tenant, and wrong-role callers.

---

## Secrets Architecture

**Never** store secrets in:

- Source code or version control
- Environment variable files committed to repos
- Application logs
- Client-side code or mobile apps

**Where secrets belong:**

- Development: `.env` files (in `.gitignore`), loaded via tooling like `direnv`
- CI/CD: platform secret stores (GitHub Actions secrets, AWS Secrets Manager,
  Vault)
- Production: workload identity where possible (IRSA, Workload Identity,
  SPIFFE/SPIRE)

**Workload identity** (preferred over static credentials): let the cloud
provider vouch for the workload via OIDC. No credential to rotate, no credential
to leak.

**Envelope encryption:** encrypt data with a data encryption key (DEK); encrypt
the DEK with a key encryption key (KEK) managed by KMS. The plaintext DEK is
never stored — only the encrypted envelope.

**Rotation:** treat all secrets as having a 90-day lifetime maximum. Automate
rotation. Rotation should be a non-event, not a crisis.

---

## Auth: Tokens

**JWT problems:** algorithm confusion attacks (`alg: none`, RS256 → HS256
confusion), header injection, weak key validation. Libraries frequently have
CVEs.

**PASETO** (Platform-Agnostic Security Tokens): fixed algorithms per version, no
algorithm field to confuse, simpler to use correctly. Default to PASETO; keep
JWT only where a federated protocol (OIDC/SSO) requires it.

- `v4.local` — symmetric encryption (use when issuer = verifier)
- `v4.public` — asymmetric signatures (use when tokens cross trust boundaries)

If you must use JWT:

- Pin allowed algorithms from trusted configuration or issuer metadata
  (OIDC/JWKS), and verify the key type matches the algorithm. Never let the
  untrusted token header decide verification policy.
- Use short expiry (15min access tokens) + refresh tokens.
- Validate `iss`, `aud`, `exp` claims.
- Never put sensitive data in the payload — it's base64-encoded, not encrypted.

**OAuth2 + OIDC** for federated identity. Never roll your own auth protocol.

---

## Auth: Passwords, MFA, Sessions

**Passwords:**

- Min length 15; max ≥64; allow all printable Unicode + spaces.
- No composition rules. No forced periodic rotation.
- Check candidates against a breached-password list on set/change.
- Store with a memory-hard KDF (argon2id, scrypt, or bcrypt cost ≥12).

**MFA:**

- Require a phishing-resistant factor (WebAuthn/passkeys, FIDO2) for any admin
  or privileged role.
- SMS OTP is a fallback only, never the sole factor.

**Sessions:**

- Rotate session ID on login and privilege change.
- Short idle timeout for privileged sessions.

---

## Input Validation at Trust Boundaries

Validate at every trust boundary: HTTP endpoints, CLI arguments, config files,
queue messages, DB rows from external systems.

**Validation rules:**

1. Allowlist, not denylist. Define what's valid; reject everything else.
2. Validate type, format, length, and range.
3. Reject on first failure — don't silently coerce invalid input.
4. Apply the `parse-don't-validate` principle: parse into a typed value that
   proves validation (see `data-first-design` skill).

**Never trust:**

- User-supplied file paths (path traversal: `../../etc/passwd`)
- User-supplied URLs (SSRF, redirect attacks)
- User-supplied class/function names (remote code execution)
- `Content-Type` headers for determining how to process a body

---

## Logging & Alerting (A09)

**Log, but not secrets:**

- Log authn success/failure, authz denials, admin actions, input validation
  rejections at the boundary.
- Never log: passwords, tokens, session IDs, raw PII, full payment data.
- Alert on: failed-login spikes, privilege escalations, new admin creation,
  unexpected outbound connections.

---

## Exception Handling (A10)

**Error responses:**

- Generic message to caller; detail only in server-side log with request ID.
- No stack traces, SQL fragments, or file paths over the wire.
- Same shape and timing for "user not found" and "wrong password" (avoid
  enumeration).
- Catch broadly at the outer boundary only; rethrow inside business logic.

---

## Supply Chain Security

**On dependency change:**

- Pin to exact version in lockfile.
- Run `npm audit` / `pip-audit` / `cargo audit` / `govulncheck`.
- Review diff for new transitive deps; reject unexpected additions.
- Patch-level auto-merge allowed only if build is reproducible and
  signature-verified; minor/major require human review.

**Signing and provenance:** use Sigstore keyless signing (OIDC-backed) for
artifacts; verify signatures on pull. Agents can look up `cosign` syntax as
needed.

**SLSA Level 2+** for critical services: build provenance attests what source
was built, by what build system, with what inputs. Consumers can verify the
artifact matches the attestation.

**SBOMs (Software Bill of Materials):** generate at build time with `syft` or
`cdxgen`. Required by US federal mandates (EO 14028) and increasingly by
enterprise customers.

**VEX (Vulnerability Exploitability eXchange):** companion to SBOMs that
documents which CVEs are not exploitable in your specific use of a dependency,
reducing scanner noise.

---

## Service Identity (mTLS, SPIFFE)

- Service-to-service calls use mTLS; both sides present and verify certificates.
- Prefer SPIFFE/SPIRE-issued SVIDs (X.509 or JWT, auto-rotated) or service mesh
  (Istio, Linkerd). Without a mesh, use Vault PKI for short-lived per-service
  certs.

---

## Code Review Checklist

Before approving any PR touching auth, data handling, or external interfaces:

- [ ] No secrets in code, config, or logs
- [ ] All inputs validated at trust boundaries
- [ ] Auth checks on every protected endpoint (not just the router)
- [ ] No direct object references without ownership check (IDOR)
- [ ] Error responses don't reveal internal state or enumerate valid users/IDs
- [ ] Same shape and timing on authn failure paths
- [ ] Logs, metrics, and traces are source-redacted; collector redaction is
      defense-in-depth
- [ ] User-controlled data not used in SQL without parameterisation
- [ ] User-controlled data not rendered in HTML without escaping
- [ ] Dependencies pinned; `npm audit` / `pip-audit` / `cargo audit` /
      `govulncheck` clean
- [ ] SSRF: user-supplied URLs pass through an allowlist
- [ ] Constant-time comparison on secret equality checks
- [ ] Fail-closed on auth/authz/crypto errors

---

## Canon

- OWASP Top 10:2025 — <https://owasp.org/Top10/2025/>
- OWASP Proactive Controls 2024 — <https://top10proactive.owasp.org/>
- NIST SSDF (SP 800-218) — <https://csrc.nist.gov/pubs/sp/800/218/final>
- NIST SP 800-63B rev 4 (Digital Identity / Authenticators) —
  <https://pages.nist.gov/800-63-4/sp800-63b.html>
- Shostack, 4-Question Threat Modelling Frame —
  <https://shostack.org/resources/threat-modeling>
- SLSA v1.0 Levels — <https://slsa.dev/spec/v1.0/levels>
- Sigstore / cosign — <https://docs.sigstore.dev/cosign/signing/overview/>
- OpenSSF on Sigstore rollout —
  <https://openssf.org/blog/2024/02/16/scaling-up-supply-chain-security-implementing-sigstore-for-seamless-container-image-signing/>
- Hunt & Thomas, _The Pragmatic Programmer_ (20th Anniversary Ed.), ch. 4
  "Pragmatic Paranoia" — <https://pragprog.com/titles/tpp20/>
