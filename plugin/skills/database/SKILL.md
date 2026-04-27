---
name: database
description: >-
  Use for database schemas, migrations, indexes, EXPLAIN, query optimization,
  isolation, outbox/CDC, soft delete, N+1s, pooling, online DDL, and locks.
---

# Database

## Iron Law

`PROTECT PRODUCTION DATA FIRST: PROVE ROLLOUT, LOCKING, AND RECOVERY BEFORE CHANGE.`

## When to Use

- Schema design, migrations, indexes, query plans, isolation levels,
  connection pools, soft delete, N+1 fixes, online DDL,
  transactional outbox/CDC, or production data changes.

## When NOT to Use

- API contract design; use `api`.
- Rollout sequencing outside the database; pair with `deployment`.
- Cache freshness and invalidation; use `caching`.

## Core Ideas

1. Default to SQLite (embedded, local-first, small, operationally
   simple) or Postgres (server default). Use Postgres until you can
   prove it's the wrong tool: JSONB, full-text, geospatial, vectors,
   time-series, constraints, transactions are all native or extension.
   Don't introduce a document store just because the payload is JSON;
   reach for one only when its unique benefits (native document API,
   global scale, offline sync, change streams) are required.
2. Expand, migrate, verify, switch, then contract in separate
   deployable steps.
3. Review SQL and lock behavior, not just ORM code.
4. Backfills are batched, resumable, observable, and rollback-aware.
5. New indexes and constraints must be online or staged for the target
   database.
6. Query changes need plans on production-shaped data.
7. Isolation level is a design decision; retries are part of
   serializable correctness.
8. State changes and durable publication need atomicity through
   transactional outbox, CDC, or an equivalent handoff when the two
   cannot silently diverge.
9. Data recovery is part of the change: backup/PITR must cover the
   blast radius.

## Workflow

1. Classify the change as schema, data, query, index, constraint,
   transaction, or operational tuning. Identify table size, write rate,
   lock risk, rollback path, and deploy order.
2. Review migration files directly for destructive operations and lock
   behavior. Capture EXPLAIN/ANALYZE for important query changes on
   representative data.
3. Split unsafe changes into expand-contract phases. Document
   verification and rollback in the PR or deploy note.

## Verification

- [ ] Migration SQL was reviewed for destructive changes and locking.
- [ ] Destructive or tightening changes are split across expand-contract
      phases.
- [ ] Backfills are batched and resumable; each batch holds locks
      briefly.
- [ ] Index/constraint creation uses the online mechanism for the
      target database.
- [ ] Important query changes include representative EXPLAIN/ANALYZE
      evidence.
- [ ] Isolation level and retry behavior are explicit for transactional
      changes.
- [ ] State changes and event/job publication cannot diverge silently
      when the workflow depends on both.
- [ ] Rollback and backup/PITR coverage are documented.

## Tripwires

| Trigger | Do this instead | False alarm |
|---|---|---|
| "Small table, online migration is fine" | Use the online mechanism or document why production size/write rate cannot matter. | Test fixture or local-only schema. |
| "The lock is brief" | Measure on representative load or assume the worst-case lock behavior. | Database engine guarantees metadata-only behavior for this exact operation. |
| "We'll backfill async later" | Ship the backfill plan now or leave the schema expand-only. | Follow-up migration already exists in the same rollout plan. |
| "Soft delete is good enough" | Decide the lifecycle rule once and enforce reads/indexes/schema around it. | Explicit audit-retention requirement with tested filters. |
| "No one's using that index" | Observe across a full traffic cycle before dropping it. | Brand-new unused index in an unshipped migration. |
| "Adding a `password` column" | Load `security`. Store only an `argon2id`/`scrypt`/`bcrypt` hash in `password_hash`, never plaintext. The same applies to API keys, OAuth tokens, MFA secrets, and recovery codes. | Read-only mirror of an external auth source the app never writes to. |

## Handoffs

- Use `deployment` for deploy ordering, rollback rehearsal, and feature
  flags.
- Use `performance` when query work is part of a measured
  latency/throughput change.
- Use `observability` for migration and query dashboards/alerts.
- Use `realtime` or `background-jobs` for stream or worker consumer
  semantics after the durable handoff exists.
- Use `security` when the schema touches credentials, secrets, tokens,
  MFA factors, or sensitive PII. Password hashing parameters and
  storage rules live in `security/references/secrets.md`; do not
  invent your own.

## References

- `references/online-ddl.md`: online migration patterns.
- `references/explain-and-isolation.md`: EXPLAIN and isolation notes.
