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

## Invalidation Story Before Cache Entry

Design the invalidation strategy before adding the cache. For every cached item,
answer:

- What event makes this data stale?
- Who invalidates it?
- What is the cost of serving stale data for N seconds/minutes?
- Can the consumer detect stale data and fall back?

If you cannot answer these, do not cache it yet.

---

## Do You Need A Distributed Cache?

Work this ladder before reaching for Redis/Memcached:

- DB query cache or materialised view — often enough for read-heavy workloads.
- In-process LRU — sub-microsecond, no network, fine for small hot sets.
- Fragment / view caching with key-based expiration — covers most web workloads.
- Distributed cache — only when hit rates or cross-instance fan-out demand it.

A distributed cache is another database. Justify the dependency.

---

## Key-Based Expiration (Preferred)

Make the cache key a function of the data's version. Stale entries become
unreachable and the eviction policy cleans them up — no explicit invalidation.

- Embed `updated_at` or a content hash: `v1:users:{id}:{updated_at_unix}`.
- Writes produce a new key; readers miss and repopulate. Old keys die by LRU.
- For nested data, bump the parent's `updated_at` when a child changes (the
  `touch: true` pattern) so parent fragments also get a new key.
- Fall back to event-based invalidation only when the key cannot encode the
  freshness signal.

### Russian-doll / nested fragment caching

Cache outer fragments keyed by their own version plus the versions of inner
fragments. When only a leaf changes, outer fragments still hit — they re-use
cached inner fragments for everything untouched. Editing a child bumps its
parent via `touch`, cascading up the tree. Works best when the render tree
matches the data tree.

---

## Pattern Menu

| Pattern                        | How it works                                                   | Use when                                                                      |
| ------------------------------ | -------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| **Cache-aside** (lazy loading) | App checks cache; on miss, loads from DB, populates cache      | Default choice. App controls reads. Cache failure is transparent.             |
| **Read-through**               | Cache sits in front of DB; on miss, cache loads from DB itself | Cache library handles loading logic. Simpler app code.                        |
| **Write-through**              | Every write goes to cache AND DB synchronously                 | Only when reads must be fresh without a DB round-trip. Higher write latency.  |
| **Write-behind** (write-back)  | Writes go to cache; DB updated asynchronously                  | Almost never. Prefer an explicit outbox — data loss on cache failure is real. |
| **Refresh-ahead**              | Cache proactively refreshes before TTL expires                 | Predictable access patterns; reduces miss latency at expiry.                  |

**Default to cache-aside.** It's the most forgiving — a cache failure just means
slightly slower reads, not data corruption.

---

## Stampede Prevention (Mandatory)

Cache stampede: the TTL expires, hundreds of requests simultaneously find a
cache miss, all go to the DB at once, overwhelming it.

**Always do these two:**

**1. TTL jitter** — add random variance (e.g. `base_ttl + random(-300, 300)`) so
caches don't all expire together.

**2. Stale-while-revalidate** — serve the stale value while a background refresh
runs. At the edge this is RFC 5861; in app caches record both a soft and hard
expiry, serve stale between them, refresh once.

**Add these for known-hot keys:**

**3. Singleflight / request coalescing** — one thread executes the expensive
operation; others wait for the result (e.g. Go's
`golang.org/x/sync/singleflight`).

**4. Distributed lock with TTL** — acquire a short-lived Redis `SET NX EX` lock
before recomputing; other requesters return stale or wait.

**5. Probabilistic early expiration (XFetch)** — refresh slightly before expiry
with probability proportional to compute cost and closeness to expiry: refresh
when `-compute_time * β * log(rand()) >= ttl_remaining` (β≈1.0).

---

## Cache Key Design

- **Deterministic:** same inputs always produce the same key.
- **Versioned by content:** embed `updated_at` or a content hash so writes
  produce new keys automatically. Keep a manual `v1:` prefix as a fallback for
  schema-shape changes (bump to `v2:` to retire the old shape).
- **Namespaced:** `service:entity:id` prevents collisions between services
  sharing a Redis instance.
- **PII-free:** never embed emails, SSNs, or other sensitive data (they leak
  into logs and traces).
- **Hard to reverse:** plain hashes are not enough for low-entropy sensitive
  inputs. Use HMAC with a service secret or an opaque server-generated key.

```python
f"v1:users:{user.id}:{int(user.updated_at.timestamp())}"
f"v1:search:{hmac_sha256(cache_key_secret, normalized_query)[:12]}:p{page}"
```

---

## Negative Caching

Cache "not found" results with a sentinel to prevent thundering herds on missing
keys — a common attack vector is requesting IDs that don't exist. Negative cache
TTLs should be shorter than positive ones.

```python
value = cache.get(key)
if value is None:
    value = db.load(key)
    cache.set(key, value or SENTINEL_NOT_FOUND, ex=60 if value is None else 3600)
```

---

## Redis vs Memcached

Default to Redis. Pick Memcached only for pure blob caches where multi-threading
on one node matters more than data structures, persistence, or pub/sub.

Redis eviction policy:

- `allkeys-lru` for pure-cache deployments where every key is expendable.
- `volatile-lru` only when the instance also holds persistent keys.
- `maxmemory-samples 5`–`10` gives a good LRU approximation at low cost.

---

## Observable Caches

A cache you cannot observe is a cache you cannot debug. Track:

- **Hit rate** per key namespace — drops signal stale keys or over-invalidation.
- **Miss latency** — how long a miss adds to response time.
- **Eviction rate** — high eviction means the cache is undersized.
- **Memory utilisation** — approaching capacity evicts hot data.

Expose via OTel/Prometheus and alert on hit-rate regressions. See
`observability-for-services` skill.

---

## Layered Caches

For high-read services, layer caches with different scope and speed:

```
Request → L1 in-process (ns, per-instance, small)
        → L2 distributed (ms, shared, large) — Redis/Memcached
        → L3 database (authoritative)
```

L1 is fastest but inconsistent across instances — suitable for truly read-only
data (feature flags, config) or very short TTLs (<1s). Stale L1 is invisible to
L2; use with care.

**CDN caching** is L0 for HTTP responses. Set
`Cache-Control: public, max-age=60, stale-while-revalidate=30, stale-if-error=86400`
— SWR absorbs expiry stampedes at the edge; `stale-if-error` keeps serving the
last good response when origin is down. Use `Surrogate-Key` / `Cache-Tag`
headers for targeted invalidation.

---

## Canon

- [How key-based cache expiration works (Signal v. Noise)](https://signalvnoise.com/posts/3113-how-key-based-cache-expiration-works)
- [Caching with Rails: An Overview](https://guides.rubyonrails.org/caching_with_rails.html)
- [rails/cache_digests](https://github.com/rails/cache_digests)
- [RFC 5861 — HTTP Cache-Control Extensions for Stale Content](https://datatracker.ietf.org/doc/html/rfc5861)
- [Optimal Probabilistic Cache Stampede Prevention (Vattani et al., VLDB 2015)](https://cseweb.ucsd.edu/~avattani/papers/cache_stampede.pdf)
- [Redis — Key eviction](https://redis.io/docs/latest/develop/reference/eviction/)
- [AWS — Database Caching Strategies Using Redis](https://docs.aws.amazon.com/whitepapers/latest/database-caching-strategies-using-redis/welcome.html)
- [AWS — Redis vs Memcached](https://aws.amazon.com/elasticache/redis-vs-memcached/)
- [web.dev — stale-while-revalidate](https://web.dev/articles/stale-while-revalidate)
- [MDN — Cache-Control](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cache-Control)
