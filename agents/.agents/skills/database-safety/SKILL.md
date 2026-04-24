---
name: database-safety
description:
  Use when designing database schemas, running migrations, optimising queries,
  analysing EXPLAIN output, choosing indexes, deciding on transaction isolation
  levels, or debating soft delete. Also use when the user mentions N+1 queries,
  connection pooling, online DDL, expand-contract, or locking concerns.
---

# Database Safety

## Pick the Simplest DB That Works

- Default order: **SQLite → MySQL → Postgres**. Move up only when a concrete
  constraint forces it.
- SQLite is production-viable for most single-writer apps when paired with
  streaming replication (Litestream) for backup to object storage.
- Vertical-first: scale the single writer and add read replicas before you reach
  for sharding or multi-region. Resist distributed complexity until the
  single-writer model demonstrably fails.
- For Rails 8: prefer the Solid stack (Solid Queue / Solid Cache / Solid Cable)
  over introducing Redis/Memcached unless measurement says otherwise.

---

## Review the SQL, Not the ORM

- Define the schema explicitly. Review the generated migration SQL before
  running it — know what your ORM is producing.
- Well-understood ORM idioms (`add_reference`, `change_column_null` with a
  validated check constraint, `add_index ... algorithm: :concurrently`) are
  fine. The rule is _review the SQL_, not _avoid the ORM_.
- ORM defaults are rarely optimal for your access patterns — override explicitly
  when they matter.

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

**Large online data migrations:** dual-write to old and new, then verify with a
Scientist-style read comparison (return old, log mismatches) before cutting
reads over. Don't trust the backfill — prove it.

---

## Online DDL Rules

**Postgres:**

- `CREATE INDEX CONCURRENTLY` — builds index without locking the table. Takes
  longer but safe on production.
- Never `CREATE INDEX` (without `CONCURRENTLY`) on a live table with traffic.
- Always set `lock_timeout` before schema changes: `SET lock_timeout = '2s';` to
  prevent runaway lock waits.
- **Retry, don't just timeout.** A bare `lock_timeout` fails loudly. Wrap DDL in
  a retry loop with a small lock window (e.g. GitLab's `with_lock_retries`) so
  the DB keeps serving traffic between attempts.
- `ALTER TABLE ... ADD COLUMN` with a non-volatile default is metadata-only in
  PG 11+ (the modern baseline).
- Volatile defaults (e.g. `gen_random_uuid()`, `now()`) still rewrite the table
  — add the column nullable, backfill in batches, then set the default.
- On PG <11, `NOT NULL DEFAULT` rewrites — add nullable first, backfill, then
  add the `NOT NULL` constraint via `NOT VALID` + `VALIDATE CONSTRAINT`.

**MySQL/MariaDB:**

- `ALTER TABLE ... ALGORITHM=INPLACE, LOCK=NONE` for supported operations.
- Check `information_schema.INNODB_TRX` before migration — long-running
  transactions will block DDL.
- For large-table rewrites pick the tool by constraint:
  - **gh-ost** for write-heavy MySQL 5.7+ on row-based replication: triggerless,
    binlog-tailing, pauseable.
  - **pt-online-schema-change** when foreign keys or Galera/PXC are in play —
    triggers handle them; gh-ost does not.

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

## Soft Delete: Trade-off, Not Default

Soft delete is a design choice with real costs. Reach for these first:

- "We need audit history" → append-only events/audit log table.
- "We might need to restore data" → point-in-time recovery or an archive table.
- "Cascades are hard" → fix the cascade design.

Costs to price in before choosing it:

- Every query needs `WHERE deleted_at IS NULL` — easy to forget, causes bugs.
- Unique constraints break (can't have two "deleted" users with the same email).
- GDPR requires hard deletion of PII — soft delete alone doesn't comply.
- Performance degrades as the table fills with tombstoned rows.

If you pick it:

- Use **explicit scopes** (`.kept` / `.discarded`) — don't override `destroy` or
  lean on `default_scope`-style hijacking.
- Use a **partial unique index** (`WHERE deleted_at IS NULL`) for uniqueness.
- Route all domain queries through a base scope that applies the filter.

---

## Connection Pool Sizing

Measure, don't calculate. The old `cores*2 + spindles` formula predates SSDs and
assumes a workload profile you probably don't have.

- **Start at 20–30 connections per DB instance** and tune from observation.
- **Too small** → app threads wait for connections: `cl_waiting` > 0 in
  PgBouncer, timeouts on acquisition, non-zero `pool.waitcount`.
- **Too large** → context-switching overhead, DB CPU climbs, query latency
  rises, `pg_stat_activity` / `sv_idle` fills with idle connections.

**PgBouncer (transaction mode) in front of Postgres** when you have many app
instances — the default for shared pooling. Sharp edges:

- **Disable server-side prepared statements in the driver** (e.g.
  `prepared_statements: false` on Rails/Rails-like, `prepareThreshold=0` on
  JDBC). Transaction pooling rotates backends between statements and prepared
  statements won't survive the switch.
- Session-scoped features (`SET LOCAL`, advisory locks, `LISTEN/NOTIFY`) only
  work reliably in session pooling — not transaction mode.
- Watch `cl_waiting` (pool too small) and `sv_idle` (pool too large) as the
  tuning signals.

---

## Backup and PITR

Backups are a feature, not an afterthought. If you can't restore, you don't have
backups.

- **Continuous archiving** for Postgres: WAL-G or pgBackRest shipping WAL to
  object storage. For SQLite: Litestream.
- **Test restores on a schedule.** A backup you haven't restored from is a
  hypothesis. Run a periodic drill that restores to a scratch environment and
  verifies row counts / checksums against production.
- Know your RPO (how much data can you lose?) and RTO (how long to recover?)
  before an incident, not during one.
- Keep at least one backup copy off the primary cloud account/region.

---

## Canon

- strong_migrations (Rails) — https://github.com/ankane/strong_migrations
- GitLab migration style guide (`with_lock_retries`) —
  https://docs.gitlab.com/development/migration_style_guide/
- Stripe, "Online migrations at scale" —
  https://stripe.com/blog/online-migrations
- postgres.ai, zero-downtime schema migrations —
  https://postgres.ai/blog/20210923-zero-downtime-postgres-schema-migrations-lock-timeout-and-retries
- PG 11 `ADD COLUMN` default improvements —
  https://dataegret.com/2018/03/waiting-for-postgresql-11-pain-free-add-column-with-non-null-defaults/
- safe-pg-migrations (Doctolib) — https://github.com/doctolib/safe-pg-migrations
- gh-ost — https://github.com/github/gh-ost
- gh-ost vs pt-online-schema-change —
  https://www.bytebase.com/blog/gh-ost-vs-pt-online-schema-change/
- PgBouncer features & pooling modes — https://www.pgbouncer.org/features.html
- Heroku PgBouncer best practices —
  https://devcenter.heroku.com/articles/best-practices-pgbouncer-configuration
- PlanetScale, scaling Postgres connections —
  https://planetscale.com/blog/scaling-postgres-connections-with-pgbouncer
- Discard (explicit-scope soft delete) — https://github.com/jhawthorn/discard
- Solid Queue (Rails 8 DB-backed queue) — https://github.com/rails/solid_queue
- SQLite in production (Rails 8 / Litestream) —
  https://fractaledmind.com/2023/12/23/rubyconftw/
