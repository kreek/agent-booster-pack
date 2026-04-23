---
name: database-safety
description:
  Use when designing database schemas, running migrations, optimising queries,
  analysing EXPLAIN output, choosing indexes, deciding on transaction isolation
  levels, or debating soft delete. Also use when the user mentions N+1 queries,
  connection pooling, online DDL, expand-contract, or locking concerns.
---

# Database Safety

## Schema First, ORM Second

Define the schema explicitly. Do not let the ORM generate your schema without
review — ORMs choose defaults that are rarely optimal for your access patterns.

Review the generated migration before running it. Know what SQL your ORM is
producing.

---

## Expand-Contract for Every Migration

The only safe migration pattern for zero-downtime deployments. Never combine
schema changes and data changes in a single deployment.

**Three-phase approach:**

**Phase 1 — Expand:** add the new column/table/index. New code can write to both
old and new. Old code ignores the new structure.

```sql
ALTER TABLE orders ADD COLUMN status_v2 VARCHAR(20);
```

**Phase 2 — Migrate:** backfill data in batches (never a single `UPDATE` on a
large table). Deploy code that reads from the new column when populated, falls
back to old.

```sql
UPDATE orders SET status_v2 = status WHERE id BETWEEN ? AND ?;
```

**Phase 3 — Contract:** once all rows are migrated and old column is unused,
drop it.

```sql
ALTER TABLE orders DROP COLUMN status;
```

Never combine phases in one deploy. The gap between phases is the rollback
window.

---

## Online DDL Rules

**Postgres:**

- `CREATE INDEX CONCURRENTLY` — builds index without locking the table. Takes
  longer but safe on production.
- Never `CREATE INDEX` (without `CONCURRENTLY`) on a live table with traffic.
- Always set `lock_timeout` before schema changes: `SET lock_timeout = '2s';` to
  prevent runaway lock waits.
- `ALTER TABLE ... ADD COLUMN` with a non-volatile default is instant in PG 11+.
- `ALTER TABLE ... ADD COLUMN` with a `NOT NULL DEFAULT` requires a table
  rewrite in older Postgres — use `pg_repack` or add nullable first.

**MySQL/MariaDB:**

- `ALTER TABLE ... ALGORITHM=INPLACE, LOCK=NONE` for supported operations.
- Check `information_schema.INNODB_TRX` before migration — long-running
  transactions will block DDL.
- Use `pt-online-schema-change` or `gh-ost` for large table migrations.

**General:** always test migrations on a production-sized dataset before running
on prod.

---

## Reading EXPLAIN / EXPLAIN ANALYZE

For Postgres:

```sql
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT) SELECT ...;
```

Key things to look for:

- **Seq Scan** on a large table with a low row count in the output — probably a
  missing index.
- **Nested Loop** with a high `actual rows` on the inner side — potential N+1 or
  missing index.
- **Hash Join** vs **Merge Join** — Hash Join is good for unordered data; Merge
  Join requires sorted input.
- **Buffers: shared hit vs read** — high `read` means disk I/O, data not in
  cache.
- **actual time** much higher than **estimated time** — stale statistics, run
  `ANALYZE`.

Run `ANALYZE` on tables after bulk loads. Use `pg_stat_user_indexes` to find
unused indexes.

---

## Transaction Isolation Levels — What They Actually Mean

**Postgres:** | Level | What you get | |---|---| | Read Committed (default) |
Each statement sees a consistent snapshot at statement start. Phantoms and
non-repeatable reads possible within a transaction. | | Repeatable Read |
Snapshot taken at transaction start. Protects against non-repeatable reads.
**Not** serialisable — write skew still possible. This is Snapshot Isolation,
stronger than ANSI. | | Serialisable | Uses SSI (Serialisable Snapshot
Isolation). True serializability. Callers MUST retry on `SQLSTATE 40001`
(serialisation failure). |

**MySQL InnoDB:**

- Repeatable Read uses **gap locks**, which prevent phantoms but can cause
  deadlocks. Different semantics from Postgres RR.
- Use Serialisable only if you understand the locking implications.

**Rule of thumb:** use Read Committed for OLTP unless you have a specific reason
for Repeatable Read. Use Serialisable only when you've modelled the conflict and
written retry logic.

---

## N+1 Detection and Fix

N+1 is the most common ORM performance bug: one query to get a list, then N
queries (one per item) to get related data.

**Detection:** enable query logging in development. Look for repeated queries
with different ID values. Tools: Django Debug Toolbar, Bullet gem (Rails),
Hibernate's SQL logging.

**Fix patterns:**

1. **Eager loading / JOIN:** fetch related data in the same query.

```python
# Bad (N+1)
orders = Order.objects.all()
for order in orders:
    print(order.user.name)  # hits DB each iteration

# Good
orders = Order.objects.select_related('user').all()
```

2. **Batch loading:** fetch all related IDs in one query, map in memory.

```python
user_ids = [o.user_id for o in orders]
users = {u.id: u for u in User.objects.filter(id__in=user_ids)}
```

3. **DataLoader pattern** (GraphQL): batch and deduplicate within a request.

---

## Soft Delete Is Usually a Smell

Common reasons teams use soft delete:

- "We need audit history" → Use an append-only events/audit log table instead.
- "We might need to restore data" → Point-in-time recovery or a separate archive
  table.
- "Cascades are hard" → Fix the cascade design.

Problems with soft delete:

- Every query needs `WHERE deleted_at IS NULL` — easy to forget, causes bugs.
- Unique constraints break (can't have two "deleted" users with the same email).
- GDPR requires hard deletion of PII — soft delete doesn't comply.
- Performance degrades as the table fills with dead rows.

If you need soft delete: use a partial index (`WHERE deleted_at IS NULL`) for
the unique constraint and put all domain queries through a base query that
includes the filter.

---

## Connection Pool Sizing

The optimal pool size is smaller than you think. A pool that's too large causes
context-switching overhead and resource contention on the DB server.

**Formula (from PgBouncer docs / Percona):**

```
pool_size = (core_count * 2) + effective_spindle_count
```

For a 4-core DB server with SSDs (effective_spindle_count ≈ 1): pool ≈ 9
connections per application instance.

Signs the pool is too large: DB CPU is high under load, query times are
increasing, `pg_stat_activity` shows many idle connections.

Signs the pool is too small: application threads are waiting for connections
(`pool.waitcount` metric is non-zero), timeouts on connection acquisition.

Use **PgBouncer** (transaction mode) in front of Postgres when you have many
application instances — each instance can have its own pool without overwhelming
the DB.
