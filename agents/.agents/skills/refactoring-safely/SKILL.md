---
name: refactoring-safely
description: Use when refactoring legacy code, doing a large rename or module extraction, migrating from one framework to another, or when the user mentions Mikado method, strangler fig, branch by abstraction, characterisation tests, or parallel change. Also use when someone is about to do a big-bang rewrite.
---

# Refactoring Safely

## Boy-Scout Rule

Leave every module you touch slightly better than you found it. Not a full rewrite — one small improvement per visit.

Acceptable as part of any PR:
- Rename a confusing variable or function.
- Extract a long function into two named pieces.
- Remove dead code.
- Add a missing test for a branch you just changed.

Not acceptable: use refactoring as cover for a behaviour change, or use a PR as an excuse for a whole-module rewrite when the task was a one-line fix. Keep refactoring and behaviour changes in separate commits.

---

## Characterisation Tests First

Before touching any legacy code without tests: **write characterisation tests that describe what the code currently does**, not what it should do.

```python
def test_current_behaviour_of_calculate_price():
    # This test is NOT checking correctness — it's capturing current behaviour
    result = calculate_price(product_id=42, quantity=5, user_type="premium")
    assert result == 47.50  # whatever it returns today
```

Characterisation tests are a safety net, not a specification. They exist to tell you when your refactoring changes something. If a characterisation test fails, you changed behaviour — intentionally or not.

Write them before you understand the code. The act of writing them teaches you the code.

---

## Mikado Method

For large refactors with many tangled dependencies, the Mikado method helps you sequence the work without getting stuck:

1. Write down the goal (the final desired state).
2. Try to make the change naively. When it fails or breaks something, write down what prerequisite is needed.
3. Revert all changes.
4. Work on the prerequisite. Repeat from step 2 for the prerequisite.
5. Continue building the prerequisite graph.
6. Once a leaf prerequisite is complete, move up the tree.

The Mikado graph tells you what to do next and why. It's a living document, not a big plan upfront.

**Key discipline:** always revert after discovering a dependency. Never leave the codebase in a broken state while exploring. Short feedback loops.

---

## Parallel Change (Expand-Contract for Code)

Same pattern as database expand-contract, applied to interfaces and module boundaries.

When you want to change a function signature or split a module:

**Phase 1 — Expand:** add the new interface alongside the old. Both exist simultaneously.
```python
# Old
def process_order(order_id: int, user_id: int): ...

# New (added alongside)
def process_order_v2(order: Order, user: User): ...
```

**Phase 2 — Migrate:** update callers one by one to use the new interface. Both still exist.

**Phase 3 — Contract:** remove the old interface once all callers are migrated.

This is safe to deploy at any point in the migration — the system always has at least one working path.

---

## Branch by Abstraction

For replacing a large component (e.g. swapping the ORM, replacing the HTTP client library):

1. Create an **abstraction layer** (interface/trait/protocol) in front of the component to replace.
2. Make the existing implementation implement the abstraction.
3. Build the new implementation behind the same abstraction.
4. Switch clients to the abstraction (not the old implementation directly).
5. Gradually migrate traffic to the new implementation behind a feature flag.
6. Delete the old implementation once migration is complete.

At every step, the system is shippable. No big-bang switchover.

---

## Strangler Fig

For large-scale rewrites: never do a big-bang rewrite. Build the new system alongside the old, intercept traffic at the edge, and route incrementally.

```
             ┌─── new system (handles /new-endpoint) ───┐
Client → Proxy                                          Backend
             └─── old system (handles everything else) ─┘
```

Steps:
1. Put a proxy or router in front of the old system.
2. Build the new system for one endpoint or subsystem at a time.
3. Route traffic for that endpoint to the new system.
4. Repeat until the old system handles nothing.
5. Remove the old system.

**The strangler fig wins because:** it's always shippable, rollback is always possible (re-route to old system), and you learn from real traffic.

**Big-bang rewrites fail because:** you can't ship until everything is done, you discover requirements you didn't know existed, and the old system is still being changed while you rewrite it.

---

## Fowler's Code Smell Reference

Common smells and their refactoring:

| Smell | Symptom | Refactoring |
|---|---|---|
| Long Method | Function > 20-30 lines | Extract Method |
| Large Class | Class does too many things | Extract Class |
| Long Parameter List | >3-4 parameters | Introduce Parameter Object |
| Divergent Change | Class changes for many different reasons | Split into two classes |
| Shotgun Surgery | One change requires many small edits elsewhere | Move Method/Field |
| Feature Envy | Method uses another class's data more than its own | Move Method |
| Data Clumps | Same group of fields appears together repeatedly | Extract Class |
| Primitive Obsession | Using primitives instead of domain types | Replace Primitive with Object |
| Switch Statements | Switch on type tag | Replace Conditional with Polymorphism |
| Speculative Generality | Code for hypothetical future requirements | Delete it |

---

## Refactor in Green

Every commit during a refactoring must leave all tests passing. "I'll fix the tests later" is how refactoring turns into a broken codebase that can't ship.

Workflow:
1. Ensure all tests pass before starting.
2. Make one small refactoring.
3. Run the tests.
4. Commit.
5. Repeat.

If you can't get tests to pass after a refactoring step, revert and split the step into smaller pieces. Staying green is more important than making progress.
