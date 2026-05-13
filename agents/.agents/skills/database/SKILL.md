---
name: database
description: Use for databases, schemas, migrations, indexes, transactions, query plans, and locking.
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
- Rollout sequencing outside the database; pair with `release`.
- Cache freshness and invalidation; use `performance`.

## Core Ideas

1. Use the project's existing database unless the task is choosing a
   store. For greenfield server work, default to Postgres; for
   embedded or local-first work, default to SQLite. Reach for a
   document store only when its native document API, global scale,
   offline sync, or change streams are required.
2. Expand, migrate, verify, switch, then contract in separate
   deployable steps.
3. Review SQL and lock behavior, not just ORM code.
4. Backfills are batched, resumable, observable, and rollback-aware.
5. Constraints enforce invariants. Every uniqueness invariant needs a DB-level
   `UNIQUE`, `EXCLUDE`, composite, or partial equivalent. Application-layer
   checks race under concurrency.
6. Indexes support known access paths. New foreign keys and known predicates
   reached by `WHERE`, `JOIN`, or `ORDER BY` need supporting indexes in the
   same migration, or a stated reason they do not.
7. Query changes need plans on production-shaped data.
8. Isolation level is a design decision; retries are part of
   serializable correctness.
9. State changes and durable publication need atomicity through
   transactional outbox, CDC, or an equivalent handoff when the two
   cannot silently diverge.
10. Data recovery is part of the change: backup/PITR must cover the
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
- [ ] Every uniqueness invariant in the change is enforced by a DB constraint
      or equivalent engine-specific mechanism, not application-layer logic.
- [ ] New FK columns and known query predicates (`WHERE`, `JOIN`, `ORDER BY`)
      have supporting indexes in the same migration, or the omission is
      explicitly justified.
- [ ] Index/constraint creation uses the online mechanism for the
      target database.
- [ ] Engine-specific elaborations (partial unique, expression,
      deferrable, exclusion, GIN/GIST/BRIN indexes, `CONCURRENTLY`,
      `USING INDEX` attachments; see `references/online-ddl.md`) are
      verified against the target engine: the migration ran locally
      against the project's target before claiming done. SQLite
      passing is not proof of Postgres behavior. Plain index, column,
      and FK migrations do not require this.
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
| "We'll enforce uniqueness in the application layer" | Add a DB-level `UNIQUE` or `EXCLUDE` constraint. Application-layer checks race under concurrency and fail open under retries. | The field is genuinely advisory and a duplicate is a recoverable UX issue, not a correctness violation. |
| "We can add the index later if queries get slow" | Add it in the same migration when the access pattern is known (FK columns, predicates in known queries). Later additions on hot tables need `CONCURRENTLY` and rollout coordination. | The column is genuinely write-only or the query pattern is unknown and will be measured first. |
| "Partial unique index gives me uniqueness" | Check the target engine. Decide whether the invariant needs a constraint, a partial unique index, or an exclusion constraint, then test the migration there. | The requirement explicitly asks for a partial unique index and accepts its engine-specific semantics. |
| "Adding a `password` column" | Load `security`. Store only an `argon2id`/`scrypt`/`bcrypt` hash in `password_hash`, never plaintext. The same applies to API keys, OAuth tokens, MFA secrets, and recovery codes. | Read-only mirror of an external auth source the app never writes to. |

## Handoffs

- Use `release` for deploy ordering, rollback rehearsal, and feature
  flags.
- Use `performance` when query work is part of a measured
  latency/throughput change.
- Use `observability` for migration and query dashboards/alerts.
- Use `async-systems` for stream or worker consumer
  semantics after the durable handoff exists.
- Use `security` when the schema touches credentials, secrets, tokens,
  MFA factors, or sensitive PII. Password hashing parameters and
  storage rules live in `security/references/secrets.md`; do not
  invent your own.

## References

- `references/online-ddl.md`: online migration patterns.
- `references/explain-and-isolation.md`: EXPLAIN and isolation notes.
