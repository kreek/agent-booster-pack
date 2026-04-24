# OWASP Top 10:2025 — category mitigations

Reference for the `security-review` skill. Each category: the risk, the
recurring failure pattern, and the concrete mitigations to check for in review.

## A01 — Broken Access Control

Failure pattern: the router authenticates but the handler forgets to authorise,
or the ORM fetches any row if the ID is known (IDOR).

Check:

- Authz is enforced in the handler, not only the router middleware.
- Every `findById` or equivalent is paired with an ownership or tenancy
  predicate (`where user_id = :current_user`).
- Role checks are positive allowlists; absence of a role = deny.
- Tests cover unauthenticated, wrong-tenant, and wrong-role callers on every
  protected path.

## A02 — Security Misconfiguration

Failure pattern: frameworks shipped in debug/dev mode, default credentials left
enabled, permissive CORS, S3 bucket policies default-public, DB port exposed.

Check:

- `DEBUG = false` (or equivalent) in every non-dev environment.
- No default/sample credentials retained (`admin:admin`, `postgres:postgres`).
- CORS allowlist is explicit; no `Access-Control-Allow-Origin: *` on
  credentialed endpoints.
- Security headers present: `Content-Security-Policy`,
  `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`,
  `Referrer-Policy`.
- Cloud storage buckets are private-by-default; public access is explicitly
  documented.

## A03 — Software Supply Chain Failures

Shift from 2021: elevated from "Vulnerable and Outdated Components". The concern
is now provenance, not just CVE presence.

Check:

- Lockfile pins exact versions; no floating ranges in production.
- `scripts/dep-audit.sh` output is clean (npm/pnpm/pip/cargo/bundle/go).
- New transitive dependencies are explained in the PR.
- Build artifacts are signed (Sigstore/cosign) where supported.
- SLSA Level 2+ for critical services: build provenance attestations.
- SBOMs generated (`syft`, `cdxgen`) and stored with releases.

## A04 — Cryptographic Failures

Failure pattern: roll-your-own crypto, MD5/SHA1 still in use, RSA without
padding, hardcoded IVs, missing constant-time comparison.

Check:

- No custom crypto, hash, MAC, or token formats.
- Password hashing: argon2id (preferred), scrypt, or bcrypt cost ≥12.
- Symmetric: AEAD only (AES-GCM, ChaCha20-Poly1305); never CBC+HMAC hand-rolled.
- Asymmetric: Ed25519 for signing; RSA-2048+ with PSS or OAEP if RSA is
  required.
- Key storage: KMS-managed; no plaintext keys in env vars or code.
- Constant-time comparison for token, MAC, or capability equality
  (`crypto/subtle.ConstantTimeCompare`, `hmac.compare_digest`,
  `crypto.timingSafeEqual`).

## A05 — Injection

Covers SQL, NoSQL, OS command, LDAP, expression-language, template, and log
injection.

Check:

- SQL: parameterised queries only; no string concatenation of user-controlled
  data into SQL.
- OS: no `shell=True`, no `os.system`, no `exec` on string-interpolated
  commands; pass argv arrays.
- LDAP/XML/XPath: library-provided parameterisation.
- Logs: never interpolate user input into a log format string; pass as a
  structured field.
- SSTI: templates compiled from user input = bug.

## A06 — Insecure Design

Failure pattern: the threat model was never written; the design doc assumes the
happy path.

Check:

- New endpoints have an STRIDE pass attached to the design doc.
- Rate limiting is designed before the endpoint ships, not after.
- Privileged paths have separate authz checks, not shared middleware.
- Abuse cases are listed alongside use cases.

## A07 — Authentication Failures

Covers credential stuffing, session fixation, weak password policies, missing
MFA on privileged roles.

Check:

- Password policy: min 15, max ≥64, printable Unicode + spaces, no composition
  rules, breached-password check on set/change.
- Rate limit and account lockout on failed logins.
- Session ID rotated on login and privilege change; short idle timeout for
  privileged sessions.
- MFA required for any admin or privileged role; phishing-resistant factor
  (WebAuthn/passkeys) preferred.
- SMS OTP is a fallback only, never sole factor.

## A08 — Software or Data Integrity Failures

Covers unsigned updates, deserialisation of untrusted data, CI/CD pipeline
tampering.

Check:

- Auto-update channels verify signatures before install.
- No deserialisation of untrusted input via `pickle`, Java serialisation, PHP
  `unserialize`, Node `vm.runInNewContext`, etc.
- CI/CD secrets scoped by environment; prod secrets never loaded in PR builds.
- Artifacts signed; consumers verify before deploy.

## A09 — Security Logging and Alerting Failures

Failure pattern: ample logs that record the wrong things — user secrets appear,
but auth denials don't.

Check:

- Log authn success/failure, authz denials, admin actions, boundary validation
  rejections — with request ID and actor, not raw payload.
- Never log passwords, tokens, session IDs, raw PII, full payment data.
- Alerts configured on failed-login spikes, privilege escalations, new admin
  creation, unexpected outbound connections.
- Retention meets policy; logs are tamper-evident (append-only, optionally
  hash-chained).

## A10 — Mishandling of Exceptional Conditions

Shift from 2021: new category. Covers information disclosure through error
messages, missing auth checks in error paths, and timing differences that
enumerate valid users/tokens.

Check:

- Generic error to caller; detail only in server-side log with request ID.
- No stack traces, SQL fragments, or file paths in HTTP responses.
- **Same shape and same timing** on authn failure paths (user-not-found vs
  wrong-password).
- Error handlers re-check auth before returning; no "fall through" on exception
  to a less-privileged path.
- Panics in privileged code paths terminate the process; they do not silently
  recover.
