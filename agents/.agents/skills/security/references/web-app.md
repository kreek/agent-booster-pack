# Web app: CSRF, XSS, headers, cookies

Reference for the `security` skill. Browser-facing risks that apply whenever
an HTTP response is rendered, executed, or framed by a browser.

## CSRF

Required when authentication is conveyed by a credential the browser attaches
automatically: cookies, HTTP Basic, client TLS certs. Not required for token
APIs where the token is in an `Authorization` header set by JavaScript.

Defences (pick one; layer on high-value flows):

- Prefer the framework's CSRF middleware over custom token handling; only
  implement these patterns yourself when the framework cannot model the
  flow.
- **`SameSite=Lax`** on the session cookie. Modern browser default. Blocks
  most cross-site POSTs but **does not protect state-changing GETs**, does not
  protect against attacks from a sibling subdomain, and degrades to "no
  protection" on legacy clients.
- **CSRF token** (synchroniser pattern): server-issued, per-session, sent in a
  custom header or hidden form field, validated on every state-changing
  request. Constant-time compare on the server side.
- **Double-submit cookie**: token in cookie + same value in custom header;
  works without server-side state but vulnerable when any subdomain can set
  cookies on the parent. The `__Host-` cookie prefix mitigates.
- **Origin / `Sec-Fetch-Site` check**: reject state-changing requests where
  `Origin` is missing, opaque, or not in the allowlist. Cheap, robust, and
  often sufficient for first-party APIs.

State-changing GETs are themselves a bug. Convert to POST/PUT/PATCH/DELETE
before adding CSRF protection.

## XSS and output encoding

Three flavours: reflected, stored, DOM-based. Mitigation is the same: never
interpolate untrusted data into a context that can execute it.

- Use the framework's auto-escaping. Ban manual concatenation of user input
  into HTML in code review.
- Context-aware encoding matters: HTML body, attribute (quoted vs unquoted),
  URL (`href`, `src`), JavaScript string, JSON, CSS, and event handlers each
  need different encoding. The framework knows; ad-hoc `escape_html` does
  not.
- Avoid the dangerous APIs: React `dangerouslySetInnerHTML`, Vue `v-html`,
  Angular `[innerHTML]` / `bypassSecurityTrust*`, DOM `innerHTML`,
  `outerHTML`, `document.write`, `insertAdjacentHTML`, and the script
  primitives `eval`, `setTimeout(string)`, `setInterval(string)`,
  `Function(string)`.
- Render-then-sanitise user-authored HTML with a vetted library (DOMPurify,
  Bleach, sanitize-html). Deny-listing tags is always incomplete.
- Strip JavaScript-in-URL: reject `javascript:`, `data:text/html`,
  `vbscript:` for any user-controlled `href`/`src`.

## CSP

Defence in depth. Stops most reflected and stored XSS from executing even
when sanitisation fails.

- `default-src 'self'` is the safe baseline.
- Avoid `'unsafe-inline'` and `'unsafe-eval'` on `script-src`. If legacy code
  needs inline, use a per-response `nonce` (≥128 bits CSPRNG, fresh per
  response) or `'strict-dynamic'` with hashes.
- `frame-ancestors 'none'` (or specific origins) replaces `X-Frame-Options`
  for clickjacking.
- `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`.
- For SPAs, prefer Trusted Types: `require-trusted-types-for 'script';
  trusted-types default;`.
- Roll out via report-only (`Content-Security-Policy-Report-Only`); pair with
  `report-to` / `report-uri` to catch real-world breakage before enforcing.

## Security headers

Set globally at the edge or middleware:

- `Strict-Transport-Security: max-age=63072000; includeSubDomains` (add
  `; preload` only with intent to enrol on the preload list).
- `X-Content-Type-Options: nosniff`.
- `Referrer-Policy: strict-origin-when-cross-origin` or `no-referrer` for
  high-sensitivity flows.
- `Permissions-Policy`: deny powerful features the app does not use
  (`camera=(), microphone=(), geolocation=(), interest-cohort=()`).
- `Cross-Origin-Opener-Policy: same-origin` and
  `Cross-Origin-Embedder-Policy: require-corp` for `crossOriginIsolated`
  features.
- `Cross-Origin-Resource-Policy: same-origin` on responses that should not be
  embedded cross-origin.

## Cookies

- `HttpOnly` on every session cookie. No exceptions.
- `Secure` on every cookie set on an HTTPS site.
- `SameSite=Lax` (default) or `Strict` (admin / high-sensitivity).
- `__Host-` prefix on session cookies pins them to the exact origin: no
  `Domain` attribute, `Path=/`, `Secure` required. Best protection against
  subdomain takeover and cookie tossing.
- Scope `Path` to the smallest workable subtree.
- Set explicit `Max-Age` or `Expires` only for cookies that need persistence;
  default to session cookies.

## Clickjacking

`Content-Security-Policy: frame-ancestors 'none'` is the modern fix.
`X-Frame-Options: DENY` is legacy fallback for browsers without CSP3 (none in
practice in 2026, but cheap to keep for parser fallbacks).

## Open redirect

Any `?next=`, `?return_to=`, `?redirect_uri=`, `?url=`, `?continue=`
parameter is a bug magnet. Allowlist destinations, or require the value be a
same-origin path: starts with `/` and not `//`, parses as a same-origin URL.
Open redirects amplify phishing and bypass OAuth `redirect_uri` controls.

## Mixed content and SRI

- All subresources over HTTPS. The `upgrade-insecure-requests` CSP directive
  is a backstop, not a fix.
- Subresource Integrity (`integrity="sha384-..."`) on every `<script src>`
  and `<link rel=stylesheet>` loaded from a CDN you do not own. Pair with
  `crossorigin="anonymous"`.

## CORS (if you ship an API consumed cross-origin)

- `Access-Control-Allow-Origin` is an allowlist of exact origins, never `*`
  on a credentialed endpoint and never reflected from the request `Origin`
  without validation.
- `Access-Control-Allow-Credentials: true` only when a session must cross
  origins; treat as a high-risk decision.
- Preflight cache (`Access-Control-Max-Age`) at most 600s; long caches
  amplify misconfiguration.
- CORS controls the browser's cross-origin gate; it is **not** an
  authorisation mechanism. The handler still authorises every request.
