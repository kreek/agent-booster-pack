# Secrets, tokens, passwords, MFA, sessions

Reference for the `security-review` skill. How secrets move, how tokens are
picked, how credentials are stored, how sessions are managed.

## Secrets architecture

**Never** store secrets in:

- Source code or version control.
- Environment variable files committed to repos (`.env`,
  `config/production.yml`).
- Application logs, audit trails, or trace spans.
- Client-side code or mobile apps (the binary can be unpacked).

**Where secrets belong:**

- Development: `.env` files in `.gitignore`, loaded via `direnv` or equivalent.
- CI/CD: platform secret stores (GitHub Actions secrets, GitLab CI variables,
  AWS Secrets Manager, Vault).
- Production: workload identity where possible — IRSA on EKS, Workload Identity
  on GKE, SPIFFE/SPIRE for non-cloud. No static credential to rotate, no
  credential to leak.

**Envelope encryption:** encrypt data with a data encryption key (DEK); encrypt
the DEK with a key encryption key (KEK) managed by KMS. The plaintext DEK is
never stored — only the encrypted envelope. Rotate KEKs regularly; re-wrapping
DEKs does not require re-encrypting the underlying data.

**Rotation:** treat all secrets as having a 90-day lifetime maximum. Automate
rotation. Rotation should be a non-event — if rotating is a crisis, the system
is coupled to a specific credential instance.

## Auth tokens: prefer PASETO

JWT has a long history of algorithm-confusion CVEs (`alg: none`, RS256 → HS256
confusion, header injection, weak key validation). Default to PASETO
(Platform-Agnostic Security Tokens): fixed algorithms per version, no algorithm
field in the header.

- `v4.local` — symmetric encryption (use when issuer = verifier).
- `v4.public` — asymmetric signatures (use when tokens cross trust boundaries).

Keep JWT only where a federated protocol (OIDC/SSO) requires it.

**If you must use JWT:**

- Pin allowed algorithms from trusted configuration or issuer metadata
  (OIDC/JWKS). Verify the key type matches the algorithm. Never let the
  untrusted token header decide verification policy.
- Short expiry (15 min access tokens) + refresh tokens.
- Validate `iss`, `aud`, `exp`, `nbf`, `iat`.
- Never put sensitive data in the payload — it's base64-encoded, not encrypted.

**OAuth2 + OIDC** for federated identity. Never roll your own auth protocol.

## Passwords

- Min length 15; max ≥64; allow all printable Unicode including spaces.
- No composition rules (no forced uppercase/number/special).
- No forced periodic rotation (only on compromise signal).
- Check candidates against a breached-password list on set/change
  (HaveIBeenPwned k-anonymity API is free).
- Store with a memory-hard KDF: argon2id (preferred), scrypt, or bcrypt cost
  ≥12.
- Apply per-account rate limits and a global failed-login rate limit; alert on
  spikes.

## MFA

- Require a phishing-resistant factor (WebAuthn/passkeys, FIDO2) for any admin
  or privileged role.
- SMS OTP is a fallback only, never the sole factor.
- TOTP (authenticator app) is acceptable for general users; prefer WebAuthn
  where available.
- Enrollment flows: enforce MFA before step-up to any privileged action, not
  only at login.

## Sessions

- Rotate session ID on login and on privilege change.
- Short idle timeout for privileged sessions (≤15 min).
- Session cookies: `HttpOnly`, `Secure`, `SameSite=Lax` (or `Strict` for admin),
  `Path` scoped.
- Revocation: maintain a session registry and honour server-side logout/revoke
  across all devices.
- Do not reuse session IDs as authorisation tokens for cross-service calls — use
  a separate short-lived service token.

## Service identity

Service-to-service calls use mTLS; both sides present and verify certificates.

- Prefer SPIFFE/SPIRE-issued SVIDs (X.509 or JWT SVIDs, auto-rotated).
- Or a service mesh (Istio, Linkerd) that handles SVID distribution and
  rotation.
- Without a mesh, use Vault PKI for short-lived (≤24h) per-service certs with
  automatic renewal.
- Never embed long-lived service credentials in container images or env vars.
