---
name: caching
description: >-
  Use for cache design or bugs: TTL vs event invalidation, cache-aside,
  read/write-through, stampede prevention, layered caches, Redis, Memcached,
  CDNs, and stale data.
---

# Caching

## Iron Law

`DESIGN THE INVALIDATION STORY BEFORE ADDING THE CACHE.`

## When to Use

- Adding, reviewing, tuning, or debugging application, database,
  Redis/Memcached, CDN, browser, or edge caches.
- Investigating stale data, stampedes, hot keys, cache misses, or
  cache-related latency.

## When NOT to Use

- Query optimization without cached data; use `database` or
  `performance`.
- HTTP API semantics unrelated to storage; use `api`.
- Distributed locking or queue backpressure beyond cache stampede
  prevention; use `concurrency`.

## Core Ideas

1. No invalidation story, no cache.
2. Cache keys encode freshness, tenant, permissions, locale, and
   version where those affect the value.
3. Prefer event/key-based expiration for correctness; use TTL as a
   safety net, not the primary truth.
4. Every hot key needs stampede protection.
5. Layered caches need explicit ownership so stale data cannot hide in
   an outer layer.
6. Cache observability is mandatory: hit rate, miss latency,
   evictions, memory, and refresh failures.
7. Never put secrets or raw PII in keys or values unless the cache is
   treated as sensitive storage.

## Workflow

1. State the value being cached and the source of truth. Decide
   whether the problem is repeated computation, repeated I/O, global
   latency, or availability under dependency failure.
2. Define key shape, invalidation trigger, TTL/jitter, stampede
   policy, and stale-data tolerance. Add metrics before relying on the
   cache.
3. Test stale, miss, hot-key, invalidation, and dependency-failure
   paths.

## Verification

- [ ] Invalidation owner, trigger, and stale tolerance are documented.
- [ ] Key includes all inputs that change the value and avoids
      secrets/raw PII.
- [ ] TTL has jitter where many entries can expire together.
- [ ] Hot keys are protected by singleflight, locking, probabilistic
      early refresh, or equivalent.
- [ ] Negative caching is intentional and bounded.
- [ ] Metrics exist for hit rate, miss latency, eviction rate, memory,
      and refresh errors; alerts catch hit-rate drops or eviction
      spikes on critical paths.
- [ ] Tests cover stale data and invalidation, not only the warm-cache
      happy path.

## Handoffs

- Use `error-handling` when cached data participates in remote-call
  retry or fallback behavior.
- Use `security` when cache keys/values can include tenant data,
  secrets, authorization context, or personal data.
- Use `observability` for production dashboards and alert routing.

## References

- RFC 5861 stale-while-revalidate:
  <https://datatracker.ietf.org/doc/html/rfc5861>
- Cache stampede prevention:
  <https://cseweb.ucsd.edu/~avattani/papers/cache_stampede.pdf>
