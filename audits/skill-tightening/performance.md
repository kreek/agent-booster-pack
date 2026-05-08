# Performance Skill Tightening Audit

Source: `agents/.agents/skills/performance/SKILL.md`

Current length: 599 words.

## Keep

- The iron law is excellent and concise.
- The cache rules are high value and should stay in the main body.
- The workflow is short and appropriately measurement-driven.

## Tightening Opportunities

1. Group cache Core Ideas.
   Core Ideas 8-13 are all cache-specific. They can be introduced as
   "For caches:" with a compact sub-list or table.

2. Shorten When to Use.
   The second and third bullets both cover caching. Combine them.

3. Trim References.
   References are useful but long relative to skill size. Keep the local or
   most actionable links if description budget matters.

4. Compress Verification cache checks.
   Cache invalidation, keys, TTL jitter, hot keys, negative caching, metrics,
   and stale-data tests can be grouped under "cache safety is specified and
   tested" with examples.

## Do Not Tighten

- Do not remove "measure before" and "measure again."
- Do not remove coordinated omission or tail-latency awareness.

## Suggested Shape

Small pass. Target 10% reduction by grouping cache material.
