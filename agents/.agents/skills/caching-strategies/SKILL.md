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

The hardest problem in caching is knowing when data is no longer valid. Design
the invalidation strategy before adding the cache — not after.

Ask for every piece of data you want to cache:

- What event makes this data stale?
- Who is responsible for invalidating it?
- What is the cost of serving stale data for N seconds/minutes?
- Can the consumer detect stale data and fall back?

If you cannot answer these questions, do not cache it yet.

---

## Pattern Menu

| Pattern                        | How it works                                                   | Use when                                                                         |
| ------------------------------ | -------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| **Cache-aside** (lazy loading) | App checks cache; on miss, loads from DB, populates cache      | Default choice. App controls reads. Cache failure is transparent.                |
| **Read-through**               | Cache sits in front of DB; on miss, cache loads from DB itself | Cache library handles loading logic. Simpler app code.                           |
| **Write-through**              | Every write goes to cache AND DB synchronously                 | Data is always fresh in cache. Higher write latency.                             |
| **Write-behind** (write-back)  | Writes go to cache; DB updated asynchronously                  | Faster writes; risk of data loss if cache fails before sync. Rarely appropriate. |
| **Refresh-ahead**              | Cache proactively refreshes before TTL expires                 | Predictable access patterns; reduces miss latency at expiry.                     |

**Default to cache-aside.** It's the most forgiving — a cache failure just means
slightly slower reads, not data corruption.

---

## Stampede Prevention (Mandatory)

Cache stampede: the TTL expires, hundreds of requests simultaneously find a
cache miss, all go to the DB at once, overwhelming it.

**Four approaches (pick at least one):**

**1. Singleflight / Request coalescing** Only one goroutine/thread executes the
expensive operation; others wait for the result.

```go
// Go: golang.org/x/sync/singleflight
var g singleflight.Group
v, err, _ := g.Do(cacheKey, func() (interface{}, error) {
    return db.LoadUser(id)
})
```

**2. Distributed lock with TTL** Acquire a short-lived lock before recomputing.
Other requesters return stale data or wait.

```python
lock = redis.set(f"lock:{key}", "1", nx=True, ex=5)  # nx=only if not exists
if lock:
    value = compute_expensive()
    redis.set(key, value, ex=ttl)
    redis.delete(f"lock:{key}")
else:
    value = redis.get(key)  # return stale or wait
```

**3. Probabilistic early expiration (XFetch)** Refresh the cache slightly before
expiry with probability proportional to how expensive the computation is and how
close to expiry.

```python
# β controls aggressiveness; typically 1.0
def should_refresh(ttl_remaining, compute_time, beta=1.0):
    return -compute_time * beta * math.log(random.random()) >= ttl_remaining
```

**4. TTL jitter** Add random variance to TTL so caches don't all expire
simultaneously.

```python
base_ttl = 3600  # 1 hour
jitter = random.randint(-300, 300)  # ±5 minutes
ttl = base_ttl + jitter
```

---

## Cache Key Design

Good cache keys are:

- **Deterministic:** same inputs always produce the same key.
- **Versioned:** include a version prefix so you can invalidate the entire
  namespace by bumping the version. `v3:user:{id}` — change `v3` to `v4` to
  invalidate all user caches without flushall.
- **Namespaced:** `service:entity:id` prevents key collisions between services
  sharing a Redis instance.
- **PII-free:** never embed email addresses, SSNs, or other sensitive data in
  cache keys (they appear in logs and traces).

```python
def user_cache_key(user_id: int) -> str:
    return f"v1:users:{user_id}"

def search_cache_key(query: str, page: int) -> str:
    query_hash = hashlib.sha256(query.encode()).hexdigest()[:12]
    return f"v1:search:{query_hash}:p{page}"
```

---

## Negative Caching

Cache "not found" results to prevent thundering herds on missing keys. A common
attack vector is requesting IDs that don't exist — without negative caching,
each request hits the DB.

```python
value = cache.get(key)
if value is None:
    value = db.load(key)
    if value is None:
        cache.set(key, SENTINEL_NOT_FOUND, ex=60)  # cache the miss for 60s
    else:
        cache.set(key, value, ex=3600)
```

Negative cache TTLs should be shorter than positive ones.

---

## Observable Caches

A cache you cannot observe is a cache you cannot debug.

Metrics to track:

- **Hit rate** per cache key namespace. Dropping hit rate signals stale keys or
  over-invalidation.
- **Miss latency** — how long a cache miss adds to overall response time.
- **Eviction rate** — high eviction means the cache is undersized.
- **Memory utilisation** — approaching capacity means you'll start evicting hot
  data.

Expose these via your metrics system (OTel, Prometheus). Alert when hit rate
drops below your baseline. See `observability-for-services` skill.

---

## Layered Caches

For high-read services, layer caches with different scope and speed:

```
Request → In-process cache (L1: ns latency, single instance, small)
        → Distributed cache (L2: ms latency, shared, large) — Redis/Memcached
        → Database (L3: ms-s latency, authoritative)
```

L1 (in-process) is fastest but inconsistent across instances. Suitable for truly
read-only data (feature flags, config) or data with very short TTLs (<1s). Use
with care — stale L1 data is invisible to the distributed cache.

**CDN caching** is L0 for HTTP responses. Set
`Cache-Control: public, max-age=60, stale-while-revalidate=30` on cacheable
responses. Use `Surrogate-Key` / `Cache-Tag` headers for targeted CDN
invalidation.
