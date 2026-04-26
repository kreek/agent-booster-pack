# API and auth: OAuth, OIDC, webhooks, API keys, BOLA/BFLA

Reference for the `security` skill. The implementation pitfalls that ship
even when the high-level protocol choice is correct. Most security incidents
in API integrations come from these.

## OAuth 2.0 / 2.1 client

- Use a maintained OAuth / OIDC client library or provider SDK. Do not
  hand-roll redirect handling, token exchange, token parsing, discovery,
  or JWKS validation.
- PKCE on every client. Required for public clients (mobile, SPA, CLI),
  recommended for confidential clients. `S256` only; never `plain`.
- `state` parameter: random per-request, bound to the user's session,
  validated on callback. This is the CSRF protection for the redirect.
- `nonce` for OIDC: random per-request, validated against the `nonce`
  claim in the ID token.
- Exact `redirect_uri` match. Prefix matches and "any path under
  example.com" rules are bugs. The authorisation server must do the exact
  match; client-side validation is a backstop.
- No tokens in URL fragments on the server. If a token arrives in a
  fragment, JavaScript reads it; never log the URL.
- Refresh-token rotation: use one-shot refresh tokens; if a refresh
  token is reused, treat the family as compromised and revoke.
- Audience binding: when calling a downstream API, the access token's
  `aud` must match that API. Avoid token confusion across resource servers.
- Token storage: confidential client → server-side. Browser public clients
  with sensitive scopes should prefer a Backend-for-Frontend or
  token-mediating backend; otherwise keep access tokens short-lived and
  in memory. Do not store long-lived tokens in `localStorage`,
  `sessionStorage`, or IndexedDB. Browser-side encryption is not an XSS
  boundary. Native / mobile clients use the platform secure store.

## OAuth 2.0 server (if you operate an authorisation server)

- Use a vetted library, not a hand-rolled implementation.
- Disable the implicit flow (deprecated by OAuth 2.1).
- Require PKCE on all clients.
- Restrict `response_type` and `grant_type` per client; deny the rest.
- Validate `redirect_uri` exactly against the registered set, including the
  scheme.
- Bind sessions to client + user + scope + audience. Issue minimal scopes.

## OIDC token validation

When you accept an ID token or access token:

- Prefer the issuer's maintained SDK or a mature JWT / OIDC validation
  library; configure it to enforce these checks instead of parsing claims
  by hand.
- Pin `iss` against the configured issuer URL (exact match).
- Pin `aud` against your configured audience.
- Validate the signature with JWKS fetched from the issuer's
  `.well-known/openid-configuration`. Cache JWKS with rotation handling
  (ETag / `Cache-Control`); refresh on unknown `kid`.
- Reject tokens whose `kid` is not in JWKS.
- Validate `exp`, `nbf`, `iat`. Allow ≤ 5 min clock skew.
- Validate `nonce` if you issued one.
- Validate `azp` for multi-audience tokens.
- Pin allowed `alg` from issuer metadata; never trust the token header to
  decide. **Reject `alg: none`** explicitly.
- Reject tokens whose key type does not match the algorithm (RSA key with
  HS256 = key-confusion attack).

## API keys

- Format: prefix + random ≥ 128-bit body (`sk_live_<32 base32 chars>`). The
  prefix lets scanners and humans recognise the key class without exposing
  the secret.
- Store hashes (SHA-256 is fine here; it's a high-entropy secret, not a
  password). Compare with constant-time equality.
- Show the full key once on creation; never again.
- Bind to scope, environment, owner, expiry. Default expiry ≤ 1 year.
- Rotate by issuing the new key, requiring both for a short overlap, then
  revoking the old. Make rotation a non-event.
- Log the key prefix, never the full key.

## Webhook signatures

When you receive a webhook from a third party:

- Verify HMAC over the **raw request body bytes**, not parsed JSON. Parse
  after verification. Re-serialising changes whitespace and breaks the
  signature.
- Constant-time compare the computed and provided signature.
- Replay protection: include a timestamp in the signed payload; reject
  signatures whose timestamp is more than ~5 min off. Track recent nonces if
  retries can replay.
- Pin the signing secret per integration; rotate on a documented schedule.
- Treat the webhook handler as untrusted-input boundary even after signature
  verification (the sender can still send malicious *content*).

## Sending webhooks

When you send a webhook to user-supplied URLs, see `ssrf-and-egress.md` for
egress controls. Sign every webhook with HMAC; document your signature
scheme; provide a key-rotation flow.

## BOLA / BFLA (OWASP API Top 10)

### Broken Object Level Authorisation (BOLA)

Every `findById` / `getResource(id)` must include the actor's tenancy or
ownership in the query (`WHERE id = :id AND owner_id = :current_user`).
Do not load then check; load with the predicate. Tests must include
"wrong tenant requests resource that exists" and assert 404 (not 403,
which leaks existence).

### Broken Function Level Authorisation (BFLA)

Privileged endpoints re-check the role at the handler, not only at the
router. Default to deny; a handler with no authz check is a bug.

### Mass assignment

See `file-and-input.md`.

## Rate limiting

- Apply at the actor level (user, API key, IP, tenant), not just per
  endpoint.
- Limit auth-relevant endpoints separately and tighter (login, password
  reset, MFA enrol, token exchange): one bucket per actor *and* one global
  bucket for credential-stuffing-style traffic.
- Return `429` with `Retry-After`. Do not leak per-user limits to
  unauthenticated callers (use a coarse global limit until the actor is
  known).
- See the `api` skill for response shape and headers.

## Idempotency

- Idempotency keys are also a security control: they prevent replay attacks
  and double-spending. Bind the key to the actor; reject when the same key
  is reused with a different request body.
- See the `api` skill for the contract details.
