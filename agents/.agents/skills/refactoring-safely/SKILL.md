---
name: refactoring-safely
description:
  Use when refactoring legacy code, doing a large rename or module extraction,
  migrating from one framework to another, or when the user mentions Mikado
  method, strangler fig, branch by abstraction, characterisation tests, or
  parallel change. Also use when someone is about to do a big-bang rewrite.
---

# Refactoring Safely

## When to Refactor

| Situation                                   | Action                                                   |
| ------------------------------------------- | -------------------------------------------------------- |
| About to add a feature to messy code        | Tidy the affected area first, in a separate commit.      |
| Just fixed a bug, see why it happened       | Rename/extract so the shape makes the bug obvious.       |
| Code smell noticed in passing, not blocking | Fix it now if < 5 min; else open a ticket.               |
| Large rewrite tempting                      | Don't. Pick a strangler fig / BBA path instead.          |
| Mid-feature, tests red                      | Stop. Finish the feature. Refactor after green.          |
| No tests on the target code                 | Write characterisation tests before any structural edit. |

---

## Structural vs Behavioural Commits

- One commit = one kind of change. Never mix a rename with a bug fix.
- Structural commits (rename, extract, inline, move) must be behaviour-
  preserving and pass the same tests they started with.
- Behavioural commits change outputs; they may add tests but must not reshape
  unrelated code.
- If a behaviour change is hard, stop and do structural tidying first, in its
  own commit. Then do the behaviour change.
- Reviewers and `git bisect` depend on this separation. Do not break it for
  convenience.

---

## Reversibility

- Prefer the refactoring step you can revert in one command.
- If a step cannot be cheaply reverted, split it.
- The system must be shippable after every commit, not just at the end.
- Feature-flag irreversible-looking changes so runtime rollback exists.
- A long-lived refactor branch is a smell — integrate via parallel change or
  branch by abstraction instead.

---

## Leave It Better

- Every PR that touches a file may include one small improvement: rename,
  extract, delete dead code, add a missing test.
- One improvement per visit, not a rewrite.
- Never disguise a behaviour change as a refactor. Separate commits.
- If you see rot you can't fix in-PR, open a ticket now, not "someday".

---

## Characterisation Tests First

Before touching any legacy code without tests: **write characterisation tests
that describe what the code currently does**, not what it should do.

```python
def test_current_behaviour_of_calculate_price():
    # This test is NOT checking correctness — it's capturing current behaviour
    result = calculate_price(product_id=42, quantity=5, user_type="premium")
    assert result == 47.50  # whatever it returns today
```

- Characterisation tests pin behaviour, they do not assert correctness.
- A failing characterisation test means behaviour changed — intentionally or
  not.
- Write them before you understand the code. Writing the pin _is_ the reading.
- Freeze clocks, seeds, and I/O before recording outputs.
- If output is huge, snapshot and diff; pin the hash, not a hand-written
  expectation.
- Re-run the test against unchanged code at least twice before trusting it.

---

## Choosing the Pattern

| Scope of change                               | Pattern                      |
| --------------------------------------------- | ---------------------------- |
| Function/method signature                     | Parallel Change              |
| Module, library, framework inside one process | Branch by Abstraction        |
| Subsystem, service, or whole application      | Strangler Fig                |
| Many tangled prerequisites, unknown order     | Mikado (on top of above)     |
| Untested legacy anywhere in the above         | Characterisation tests first |

---

## Validate the Target Shape First

- Before refactoring broadly, wire one end-to-end slice through the new shape
  (one call site, one caller, one test).
- If the new shape doesn't survive the slice, the wider refactor would have been
  wasted work. Revise the target.
- Only expand the refactor after the slice is green and reviewed.

---

## Mikado Method

For large refactors with many tangled dependencies, the Mikado method sequences
the work without getting stuck:

1. Write down the goal (the final desired state).
2. Try to make the change naively. When it fails or breaks something, write down
   what prerequisite is needed.
3. Revert all changes.
4. Work on the prerequisite. Repeat from step 2 for the prerequisite.
5. Continue building the prerequisite graph.
6. Once a leaf prerequisite is complete, move up the tree.

- Always revert after discovering a dependency. Never leave the codebase in a
  broken state while exploring.
- The Mikado graph is a living document, not an up-front plan.
- Short feedback loops.

---

## Parallel Change (Expand-Contract for Code)

Same pattern as database expand-contract, applied to interfaces and module
boundaries.

When you want to change a function signature or split a module:

**Phase 1 — Expand:** add the new interface alongside the old. Both exist
simultaneously.

```python
# Old
def process_order(order_id: int, user_id: int): ...

# New (added alongside)
def process_order_v2(order: Order, user: User): ...
```

**Phase 2 — Migrate:** update callers one by one to use the new interface. Both
still exist.

**Phase 3 — Contract:** remove the old interface once all callers are migrated.

This is safe to deploy at any point in the migration — the system always has at
least one working path.

---

## Branch by Abstraction

For replacing a large component (e.g. swapping the ORM, replacing the HTTP
client library):

1. Create an **abstraction layer** (interface/trait/protocol) in front of the
   component to replace.
2. Make the existing implementation implement the abstraction.
3. Build the new implementation behind the same abstraction.
4. Switch clients to the abstraction (not the old implementation directly).
5. Gradually migrate traffic to the new implementation behind a feature flag.
6. Delete the old implementation once migration is complete.

At every step, the system is shippable. No big-bang switchover.

---

## Strangler Fig

For large-scale rewrites: never do a big-bang rewrite. Build the new system
alongside the old, intercept traffic at the edge, and route incrementally.

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

**Why strangler fig wins:**

- Always shippable.
- Rollback is always possible (re-route to old system).
- You learn from real traffic.

**Why big-bang rewrites fail:**

- You can't ship until everything is done.
- You discover requirements you didn't know existed.
- The old system keeps changing while you rewrite it.

---

## Fowler's Code Smell Reference

Common smells and their refactoring:

| Smell                  | Symptom                                            | Refactoring                           |
| ---------------------- | -------------------------------------------------- | ------------------------------------- |
| Long Method            | Function > 20-30 lines                             | Extract Method                        |
| Large Class            | Class does too many things                         | Extract Class                         |
| Long Parameter List    | >3-4 parameters                                    | Introduce Parameter Object            |
| Divergent Change       | Class changes for many different reasons           | Split into two classes                |
| Shotgun Surgery        | One change requires many small edits elsewhere     | Move Method/Field                     |
| Feature Envy           | Method uses another class's data more than its own | Move Method                           |
| Data Clumps            | Same group of fields appears together repeatedly   | Extract Class                         |
| Primitive Obsession    | Using primitives instead of domain types           | Replace Primitive with Object         |
| Switch Statements      | Switch on type tag                                 | Replace Conditional with Polymorphism |
| Speculative Generality | Code for hypothetical future requirements          | Delete it                             |

---

## Refactor in Green

Every commit during a refactoring must leave all tests passing. "I'll fix the
tests later" is how refactoring turns into a broken codebase that can't ship.

Workflow:

1. Ensure all tests pass before starting.
2. Make one small refactoring.
3. Run the tests.
4. Commit.
5. Repeat.

If you can't get tests to pass after a refactoring step, revert and split the
step into smaller pieces. Staying green is more important than making progress.

---

## Canon

- [Hunt & Thomas, _The Pragmatic Programmer_ 20th Anniversary Edition](https://pragprog.com/titles/tpp20/the-pragmatic-programmer-20th-anniversary-edition/)
- [Pragmatic Programmer Tips](https://pragprog.com/tips/)
- [Fowler, _Refactoring_ 2nd ed.](https://martinfowler.com/books/refactoring.html)
- [Beck, _Tidy First?_](https://www.amazon.com/Tidy-First-Personal-Exercise-Empirical/dp/1098151240)
- [Feathers, _Working Effectively with Legacy Code_](https://bssw.io/items/working-effectively-with-legacy-code)
- [Ellnestam & Brolund, _The Mikado Method_](https://www.manning.com/books/the-mikado-method)
- [Fowler, Branch by Abstraction](https://martinfowler.com/bliki/BranchByAbstraction.html)
- [Hammant, Introducing Branch by Abstraction](https://paulhammant.com/blog/branch_by_abstraction)
- [Fowler, Strangler Fig Application](https://martinfowler.com/bliki/StranglerFigApplication.html)
- [Fowler, Rewriting Strangler Fig (2024)](https://martinfowler.com/articles/2024-strangler-fig-rewrite.html)
- [Fowler, Parallel Change](https://martinfowler.com/bliki/ParallelChange.html)
- [Fowler, Legacy Seam](https://martinfowler.com/bliki/LegacySeam.html)
