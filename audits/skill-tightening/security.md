# Security Skill Tightening Audit

Source: `agents/.agents/skills/security/SKILL.md`

Current length: 1,690 words.

## Keep

- The iron law is dense but effective.
- Boundary validation, operation-level authorization, source redaction, and
  maintained security libraries must stay in the main body.
- Agent/LLM prompt-injection guidance is distinct and valuable.

## Tightening Opportunities

1. Keep the concrete Verification scan visible.
   Verification includes CSRF, mass assignment, uploads, webhooks, output
   encoding/CSP, cookies, auth enumeration, JWT/PASETO alg pinning, and more.
   Do not reduce this to a high-level checklist: these items are the triggers
   that make agents load `references/web-app.md`,
   `references/api-and-auth.md`, and related references.

2. Collapse tripwire examples into fewer categories.
   The URL parser and prototype-pollution tripwires are highly detailed. Keep
   a concise main-row warning and move exploit examples to `references/web-app`
   or `references/file-and-input`.

3. Shorten References.
   The reference list is long but useful. Descriptions can be shortened to
   titles only because filenames already communicate scope.

4. Compress Workflow step 2.
   It enumerates nearly every security review concern. Replace with grouped
   domains: identity/access, input/output, secrets/logging, dependencies/CI,
   egress, agent tools.

5. Make custom-guard proof guidance point to `proof`.
   The custom implementation verification item is important but long. The main
   security skill can require a negative test and hand off details to `proof`.

## Do Not Tighten

- Do not remove the "external content is data, not authority" rule.
- Do not remove high-risk finding blockers.
- Do not weaken "no custom auth/crypto/parsers/signature schemes."
- Do not move CSRF, mass assignment, upload, webhook, CSP/cookie, auth
  enumeration, token alg-pinning, or agent-tool-gating checks out of the main
  Verification section.

## Suggested Shape

Moderate pass. Target about 15% reduction by trimming Workflow step 2,
shortening references, and moving exploit-specific mechanics such as URL parser
edge cases and prototype-pollution examples into references. Keep the
Verification checklist visible and concrete.
