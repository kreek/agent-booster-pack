# Redirect Handling Bug

Fix `resolveRedirect` in `src/redirect.js`.

Requirements:

- Allow same-site relative paths such as `/account/settings`.
- Allow absolute HTTPS URLs only for `example.com`.
- Reject protocol-relative URLs, JavaScript URLs, malformed URLs, and other hosts by returning `/`.
- Keep the boundary explicit and easy to audit.

Do not add external dependencies.
