# Customer Email Migration

Update the migration files for adding a customer email lookup.

Target engine: PostgreSQL.

Requirements:

- Add an index for customer email lookups without blocking normal writes.
- Add the uniqueness rule in a way that can be validated separately from the
  initial table change. The migration must actually run against PostgreSQL —
  any constraint or index choice you ship has to be one Postgres accepts.
- Include a rollback file.
- Leave a short operations note with rollout and rollback steps.

Do not add external dependencies.
