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

## OWASP Top 10:2025

The 2025 edition (released Nov 2025) has two new entries and reorganises several
categories. Know what changed.

| #   | Category                                   | Key change vs 2021                                                  |
| --- | ------------------------------------------ | ------------------------------------------------------------------- |
| A01 | Broken Access Control                      | Unchanged; still #1                                                 |
| A02 | Cryptographic Failures                     | Unchanged                                                           |
| A03 | **Software and Data Integrity Failures**   | Expanded to include **Supply Chain Failures** (was A08:2021)        |
| A04 | Insecure Design                            | Unchanged                                                           |
| A05 | Security Misconfiguration                  | Unchanged                                                           |
| A06 | Vulnerable and Outdated Components         | Unchanged                                                           |
| A07 | Identification and Authentication Failures | Unchanged                                                           |
| A08 | **Server-Side Request Forgery (SSRF)**     | SSRF merged in from standalone (was A10:2021)                       |
| A09 | Security Logging and Monitoring Failures   | Unchanged                                                           |
| A10 | **Mishandling of Exceptional Conditions**  | NEW — improper error handling that leaks state or bypasses controls |

**New focus areas to add to reviews:**

- Supply chain: are third-party packages pinned and verified?
- SSRF: does any user input control a URL that the server fetches?
- Error handling: do error responses leak stack traces, internal paths, or auth
  enumeration signals?

---

## STRIDE Threat Modelling (30-minute version)

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

## Auth: PASETO over JWT for New Systems

**JWT problems:** algorithm confusion attacks (`alg: none`, RS256 → HS256
confusion), header injection, weak key validation. Libraries frequently have
CVEs.

**PASETO** (Platform-Agnostic Security Tokens): fixed algorithms per version, no
algorithm field to confuse, simpler to use correctly.

- `v4.local` — symmetric encryption (use when issuer = verifier)
- `v4.public` — asymmetric signatures (use when tokens cross trust boundaries)

If you must use JWT:

- Always specify `algorithms=["RS256"]` explicitly in verification — never allow
  the token to choose.
- Use short expiry (15min access tokens) + refresh tokens.
- Validate `iss`, `aud`, `exp` claims.
- Never put sensitive data in the payload — it's base64-encoded, not encrypted.

**OAuth2 + OIDC** for federated identity. Never roll your own auth protocol.

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

## Supply Chain Security

**Dependency pinning:** pin to exact versions in production manifests
(`requirements.txt`, `package-lock.json`, `Cargo.lock`). Review and test
upgrades explicitly.

**Signing and provenance with Sigstore:**

```bash
# Sign a container image (keyless, uses OIDC)
cosign sign ghcr.io/myorg/myapp:v1.2.3

# Verify
cosign verify --certificate-identity-regexp=".*" \
  --certificate-oidc-issuer="https://token.actions.githubusercontent.com" \
  ghcr.io/myorg/myapp:v1.2.3
```

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

## mTLS and Service Identity

In microservice architectures, service-to-service calls should use mutual TLS
(mTLS). Both sides present certificates; both verify the other's identity.

**SPIFFE/SPIRE** provides a workload identity standard:

- Each workload gets a SPIFFE Verifiable Identity Document (SVID).
- SVIDs are X.509 certificates or JWTs, automatically rotated.
- Service mesh proxies (Istio, Linkerd) implement mTLS transparently when SPIRE
  is the CA.

Without a service mesh: use a library like HashiCorp Vault PKI to issue and
rotate short-lived certificates per service.

---

## Code Review Checklist

Before approving any PR touching auth, data handling, or external interfaces:

- [ ] No secrets in code, config, or logs
- [ ] All inputs validated at trust boundaries
- [ ] Auth checks on every protected endpoint (not just the router)
- [ ] No direct object references without ownership check (IDOR)
- [ ] Error responses don't reveal internal state or enumerate valid users/IDs
- [ ] User-controlled data not used in SQL without parameterisation
- [ ] User-controlled data not rendered in HTML without escaping
- [ ] Dependencies reviewed for CVEs (run `npm audit`, `pip-audit`,
      `cargo audit`)
- [ ] SSRF: user-supplied URLs pass through an allowlist
