# Online DDL — Postgres and MySQL specifics

Deep reference for the `database-safety` skill. When you reach for these is when
the migration has to ship while the DB keeps serving traffic.

## Postgres

- `CREATE INDEX CONCURRENTLY` — builds the index without an exclusive lock.
  Takes longer but safe on production. **Never** `CREATE INDEX` without
  `CONCURRENTLY` on a live table.
- Always set `lock_timeout` before schema changes:
  ```sql
  SET lock_timeout = '2s';
  ```
  Stops a runaway DDL from blocking the whole workload.
- **Retry, don't just timeout.** A bare `lock_timeout` fails loudly but still
  blocks the deploy. Wrap DDL in a retry loop with a small lock window (GitLab's
  `with_lock_retries` is the canonical pattern) so the DB keeps serving traffic
  between attempts.
- `ALTER TABLE ... ADD COLUMN` with a **non-volatile** default is metadata-only
  in PG 11+ (the modern baseline).
- **Volatile defaults** (`gen_random_uuid()`, `now()`, `clock_timestamp()`)
  still rewrite the table. Add the column nullable, backfill in batches, then
  set the default on future inserts only.
- On PG < 11, `NOT NULL DEFAULT` rewrites. Two-step:
  ```sql
  -- 1. Add nullable.
  ALTER TABLE t ADD COLUMN c text;
  -- 2. Backfill in batches.
  UPDATE t SET c = 'x' WHERE c IS NULL AND id BETWEEN ? AND ?;
  -- 3. Add NOT NULL via NOT VALID + VALIDATE (cheap lock).
  ALTER TABLE t ADD CONSTRAINT t_c_notnull CHECK (c IS NOT NULL) NOT VALID;
  ALTER TABLE t VALIDATE CONSTRAINT t_c_notnull;
  ```
- `ALTER TABLE ... ADD FOREIGN KEY` takes a `ShareRowExclusiveLock` on both
  tables. Use `NOT VALID` then `VALIDATE CONSTRAINT` so the validation scan
  holds only a share lock.
- `DROP COLUMN` is cheap and fast (metadata-only; data is reclaimed later via
  VACUUM).
- `TRUNCATE` acquires `AccessExclusiveLock`. Cheap on empty tables, lethal on
  large ones if anything is reading.

## MySQL / MariaDB

- `ALTER TABLE ... ALGORITHM=INPLACE, LOCK=NONE` for supported operations (add
  column, add index, modify default). Check the docs per operation; not
  everything supports `LOCK=NONE`.
- Check `information_schema.INNODB_TRX` before any DDL — long-running
  transactions will block the schema change indefinitely.
- For large-table rewrites, pick by constraint:
  - **gh-ost** — write-heavy MySQL 5.7+ on row-based replication. Triggerless,
    binlog-tailing, pauseable, throttles on replication lag. Best default.
  - **pt-online-schema-change** — when foreign keys or Galera/PXC are in play.
    Triggers handle them; gh-ost does not.
- Native online DDL in MySQL 8.0 handles many `ALTER` operations in-place with
  minimal locking. Verify the specific operation supports `ALGORITHM=INSTANT` or
  `INPLACE` before trusting it.

## Tooling that enforces these rules

- **strong_migrations** (Rails / Active Record) — blocks migrations that violate
  zero-downtime rules, with fix-up recipes in the error message.
- **safe-pg-migrations** (Doctolib, Rails) — wraps every migration in
  `lock_timeout` + `with_lock_retries`.
- **Django's `atomic=False` migration operations** for custom concurrent index
  creation.
- **sqitch** / **Flyway** for explicit forward + rollback migration scripts when
  the ORM's opinions are wrong for your workload.

## Rollback rules

- Every migration has a rollback. If it doesn't, the PR isn't reviewable.
- Destructive steps (DROP, DELETE, TRUNCATE) must have a recovery path: the data
  must be dual-written elsewhere, or the rollback is "restore from backup". Say
  which.
- Test the rollback on staging. "It should rollback cleanly" is not a rollback
  plan.

## Pre-production rehearsal

Every migration must be rehearsed against a production-sized copy:

- Restore a recent PITR snapshot into a scratch DB.
- Run the full migration; record wall-clock time.
- If the migration took >5 min on a table you care about, it is
  production-hostile — redesign it.
- Capture `pg_stat_activity` / `information_schema.INNODB_TRX` during the run to
  confirm lock behaviour matches expectation.
