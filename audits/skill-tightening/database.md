# Database Skill Tightening Audit

Source: `agents/.agents/skills/database/SKILL.md`

Current length: 1,095 words.

## Keep

- The production-data-first iron law is strong.
- Expand/contract, lock behavior, online indexes, and rollback/PITR guidance
  are central and should remain.
- The DB-level uniqueness rule is important and specific.

## Tightening Opportunities

1. Move database selection stance to a reference.
   Core Idea 1 is long and partly architectural/product guidance. Keep a short
   default stance in the skill and move the SQLite/Postgres/document-store
   explanation to a reference.

2. Split the long index/constraint Core Idea.
   Core Idea 6 does too much: uniqueness invariants, application-layer races,
   known access patterns, same-migration indexes, and hot-path risk. Convert
   to shorter bullets or a small table: `Invariant -> constraint`,
   `Known access path -> index`.

3. Shorten verification for engine-specific elaborations.
   The long parenthetical list of engine-specific features is useful but could
   move to `references/online-ddl.md` or a new engine-specific reference.

4. Compress tripwire explanations.
   The uniqueness, add-index-later, and partial-unique-index tripwires are
   valuable but verbose. Keep the action; move detailed Postgres explanation
   to a reference.

## Do Not Tighten

- Do not remove "review SQL and lock behavior, not just ORM code."
- Do not remove DB-level uniqueness and index timing guidance.
- Do not remove "SQLite passing is not proof of Postgres behavior" unless it
  moves to an equally visible reference.

## Suggested Shape

Moderate pass. Target 20% reduction by moving database-choice and
engine-specific elaborations to references.
