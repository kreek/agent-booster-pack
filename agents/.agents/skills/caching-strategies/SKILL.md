---
name: caching-strategies
description:
  Use when adding a cache, choosing between TTL-based and event-based
  invalidation, picking cache-aside vs read-through vs write-through, preventing
  cache stampede or thundering herd, designing layered caches, or debugging
  stale data issues. Also use when the user mentions Redis, Memcached, CDN
  caching, or asks why users are seeing outdated data.
---

# Caching Strategies

## Iron Law

`DESIGN THE INVALIDATION STORY BEFORE ADDING THE CACHE.`

If no one can say who invalidates an entry and when stale data is acceptable,
the cache is not ready to exist.

## When to Use

- Adding, reviewing, tuning, or debugging application, database,
  Redis/Memcached, CDN, browser, or edge caches.
- Investigating stale data, stampedes, hot keys, cache misses, or cache-related
  latency.

## When NOT to Use

- Query optimization without cached data; use `database-safety` or
  `performance-profiling`.
- HTTP API semantics unrelated to storage; use `api-design`.
- Distributed locking or queue backpressure beyond cache stampede prevention;
  use `concurrency-patterns`.

## Core Ideas

1. No invalidation story, no cache.
2. Cache keys encode freshness, tenant, permissions, locale, and version where
   those affect the value.
3. Prefer event/key-based expiration for correctness; use TTL as a safety net,
   not the primary truth.
4. Every hot key needs stampede protection.
5. Layered caches need explicit ownership so stale data cannot hide in an outer
   layer.
6. Cache observability is mandatory: hit rate, miss latency, evictions, memory,
   and refresh failures.
7. Never put secrets or raw PII in keys or values unless the cache is treated as
   sensitive storage.

## Workflow

1. State the value being cached and the source of truth.
2. Decide whether the problem is repeated computation, repeated I/O, global
   latency, or availability under dependency failure.
3. Define key shape, invalidation trigger, TTL/jitter, stampede policy, and
   stale-data tolerance.
4. Add metrics before relying on the cache.
5. Test stale, miss, hot-key, invalidation, and dependency-failure paths.

## Verification

- [ ] Invalidation owner, trigger, and stale tolerance are documented.
- [ ] Key includes all inputs that change the value and avoids secrets/raw PII.
- [ ] TTL has jitter where many entries can expire together.
- [ ] Hot keys are protected by singleflight, locking, probabilistic early
      refresh, or equivalent.
- [ ] Negative caching is intentional and bounded.
- [ ] Metrics exist for hit rate, miss latency, eviction rate, memory, and
      refresh errors.
- [ ] Alerting catches hit-rate drops or eviction spikes on critical paths.
- [ ] Tests cover stale data and invalidation, not only the warm-cache happy
      path.

## Handoffs

- Use `distributed-systems-resilience` when cached data crosses service
  boundaries or participates in retry/fallback behavior.
- Use `security-review` when cache keys/values can include tenant data, secrets,
  authorization context, or personal data.
- Use `observability-for-services` for production dashboards and alert routing.

## References

- RFC 5861 stale-while-revalidate:
  <https://datatracker.ietf.org/doc/html/rfc5861>
- Vattani et al., cache stampede prevention:
  <https://cseweb.ucsd.edu/~avattani/papers/cache_stampede.pdf>
