# Async Systems Skill Tightening Audit

Source: `agents/.agents/skills/async-systems/SKILL.md`

Current length: 925 words.

## Keep

- The iron law is excellent and should stay as-is.
- The default stance against premature brokers is high value.
- The verification checklist is concrete and maps well to async failure modes.

## Tightening Opportunities

1. Move `Default Stance` into Core Ideas.
   It is useful, but it creates another top-level section. It could become Core
   Idea 1 or a short paragraph after the iron law.

2. Group long trigger lists.
   The When to Use list is comprehensive but token-heavy. It can be grouped as
   "async execution, coordination primitives, background work, live updates,
   streams/brokers, and failure investigation" instead of naming every example.

3. Compress Workflow steps 4 and 5.
   Jobs and streams each list many fields. Consider a compact table:
   `Jobs: payload, idempotency, uniqueness, atomic enqueue, priority,
   compatibility`; `Streams: schema, version, order key, delivery, retention,
   replay, ack, DLQ`.

4. Merge tripwire rows into workflow where possible.
   The tripwires are good, but "retry defaults", "rescues and only logs", and
   "bulk queue starvation" overlap with Workflow/Verification. If the table
   needs slimming, those are candidates.

## Do Not Tighten

- Do not remove the explicit polling/SSE/WebSockets-before-broker stance.
- Do not remove stable IDs/immutable payloads, transactional enqueue, or
  bounded queues; those are the strongest agent guardrails.

## Suggested Shape

Moderate pass. Target 15% reduction mainly by grouping lists and moving the
default stance into Core Ideas.
