---
name: database-safety
description:
  Use when designing database schemas, running migrations, optimising queries,
  analysing EXPLAIN output, choosing indexes, deciding on transaction isolation
  levels, or debating soft delete. Also use when the user mentions N+1 queries,
  connection pooling, online DDL, expand-contract, or locking concerns.
---

# Database Safety

## Iron Law

`NO DESTRUCTIVE SCHEMA CHANGE WITHOUT EXPAND-CONTRACT.`

The deploy that removes or tightens a database contract must not be the deploy
that first makes application code depend on the new shape.

## When to Use

- Schema design, migrations, indexes, query plans, isolation levels, connection
  pools, soft delete, N+1 fixes, online DDL, or production data changes.

## When NOT to Use

- API contract design; use `api-design`.
- Rollout sequencing outside the database; pair with `deployment-and-cicd`.
- Cache freshness and invalidation; use `caching-strategies`.

## Core Ideas

1. Expand, migrate, verify, switch, then contract in separate deployable steps.
2. Review SQL and lock behavior, not just ORM code.
3. Backfills are batched, resumable, observable, and rollback-aware.
4. New indexes and constraints must be online or staged for the target database.
5. Query changes need plans on production-shaped data.
6. Isolation level is a design decision; retries are part of serializable
   correctness.
7. Data recovery is part of the change: backup/PITR must cover the blast radius.

## Workflow

1. Classify the change as schema, data, query, index, constraint, transaction,
   or operational tuning.
2. Identify table size, write rate, lock risk, rollback path, and deploy order.
3. Run `scripts/migration-preflight.sh <file>` for migration files.
4. Capture EXPLAIN/ANALYZE for important query changes on representative data.
5. Split unsafe changes into expand-contract phases.
6. Document verification and rollback in the PR or deploy note.

## Verification

- [ ] Migration SQL was reviewed for destructive changes and locking.
- [ ] `scripts/migration-preflight.sh <file>` output is clean or findings are
      addressed.
- [ ] Destructive or tightening changes are split across expand-contract phases.
- [ ] Backfills are batched and resumable; each batch holds locks briefly.
- [ ] Index/constraint creation uses the online mechanism for the target
      database.
- [ ] Important query changes include representative EXPLAIN/ANALYZE evidence.
- [ ] Isolation level and retry behavior are explicit for transactional changes.
- [ ] Rollback and backup/PITR coverage are documented.

## Handoffs

- Use `deployment-and-cicd` for deploy ordering, rollback rehearsal, and feature
  flags.
- Use `performance-profiling` when query work is part of a measured
  latency/throughput change.
- Use `observability-for-services` for migration and query dashboards/alerts.

## Tools and References

- `scripts/migration-preflight.sh <file>`: warning-only migration scan.
- `references/online-ddl.md`: online migration patterns.
- `references/explain-and-isolation.md`: EXPLAIN and isolation notes.
