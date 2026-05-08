# API Skill Tightening Audit

Source: `agents/.agents/skills/api/SKILL.md`

Current length: 1,214 words.

## Keep

- Contract-first, durable-interface sign-off, and error-shape guidance are
  central.
- The middleware section is valuable because agents often hide route-specific
  business rules in global middleware.
- The API evolution section is useful and should not be removed outright.

## Tightening Opportunities

1. Merge API Evolution into Core Ideas.
   Core Idea 7 and the separate `API Evolution` section duplicate
   compatibility concepts. Keep the standalone section only if it adds a
   decision rule. Otherwise collapse it to a short table:
   `Safe additive` vs `Breaking in place`.

2. Replace prose HTTP status guidance with a smaller table.
   The current `HTTP Error Codes` section is already partly tabular. The
   paragraphs around it can be shortened to "choose status by origin; never
   leak raw upstream/internal errors." Draft the table before applying the
   edit and verify that `400` vs `422` and `401` vs `403` nuance survives.

3. De-duplicate idempotency.
   Idempotency appears in Core Ideas, Workflow, Verification, and References.
   Keep one contract definition in Core Ideas and make later mentions shorter.

4. Compress Handoffs.
   `async-systems` appears twice. Combine SSE/subscription/event-stream and
   idempotent async consumer guidance into one row.

## Do Not Tighten

- Do not remove invalid continuation-token behavior. It is specific and likely
  to catch real bugs.
- Do not weaken durable-interface sign-off.
- Do not replace API-specific error-shape guidance with a generic handoff to
  `error-handling`; callers need the public shape here.
- Do not flatten HTTP status guidance so far that malformed-vs-semantic
  request errors or unauthenticated-vs-unauthorized errors become ambiguous.

## Suggested Shape

Moderate pass. Target 15-20% reduction by merging compatibility/idempotency
repetition and tightening handoffs.
