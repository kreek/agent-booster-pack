---
name: refactoring
description:
  Use when refactoring legacy code, doing a large rename or module extraction,
  migrating from one framework to another, or when the user mentions Mikado
  method, strangler fig, branch by abstraction, characterisation tests, or
  parallel change. Also use when someone is about to do a big-bang rewrite.
---

# Refactoring

## Iron Law

`GREEN BEFORE THE REFACTOR. GREEN AFTER EACH STEP. NEVER MIX STRUCTURE AND BEHAVIOR IN ONE COMMIT.`

## When to Use

- Legacy refactors, large renames, extractions, migrations, branch by
  abstraction, strangler fig, Mikado planning, characterization tests,
  or big-bang rewrite avoidance.

## When NOT to Use

- Behavior-first feature work; use `tests`.
- Commit grouping after changes already exist; use `commit`.
- Git history surgery; use `git`.

## Core Ideas

1. Preserve behavior first; add characterization tests where coverage
   is missing. Separate structural from behavior changes — every commit
   is one or the other, never both.
2. Make every step small, reversible, and shippable.
3. Validate the target shape before moving large amounts of code.
4. Use parallel change for public interfaces: expand, migrate callers,
   contract. Prefer strangler or branch-by-abstraction over big-bang
   rewrites.
5. Delete old paths only when traffic/callers have moved and
   verification proves it.

## Workflow

1. Define the current behavior that must not change. Add or identify
   tests that catch regressions at the public boundary.
2. Pick the smallest safe pattern: rename, extract, move, parallel
   change, branch by abstraction, or strangler.
3. Record a preservation Proof Contract: unchanged behavior claim,
   relevant invariant, public boundary, before/after check, evidence.
4. Make one structural step, run focused tests, commit. Track any old
   path left behind with owner and removal condition.

## Verification

- [ ] Tests were green before the refactor; characterization coverage
      exists for legacy behavior touched.
- [ ] Each commit is structural or behavioral, not both; the system is
      shippable at every commit.
- [ ] Public interface changes use expand-contract or compatibility
      shims; old and new paths both work during migration.
- [ ] Deleted tests were replaced by equal or stronger behavior
      coverage.
- [ ] Leftover migration/deletion work has owner and deadline.
- [ ] Every behavior-preservation claim has before/after proof
      evidence, or the refactor is reported as unproven.

## Handoffs

- Use `proof` when refactor safety depends on explicit preservation
  evidence.
- Use `tests` for characterization and boundary tests.
- Use `commit` to group resulting changes cleanly.
- Use `domain-design` when the refactor is mainly about untangling
  effects, domain shape, or domain/feature locality versus horizontal
  layers.

## References

- _Refactoring_: <https://martinfowler.com/books/refactoring.html>
- _Working Effectively with Legacy Code_:
  <https://www.oreilly.com/library/view/working-effectively-with/0131177052/>
- Branch by abstraction:
  <https://martinfowler.com/bliki/BranchByAbstraction.html>
- Strangler fig: <https://martinfowler.com/bliki/StranglerFigApplication.html>
