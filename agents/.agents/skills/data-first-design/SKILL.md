---
name: data-first-design
description:
  Use when designing data models, choosing between records/classes/tuples/maps,
  handling state transitions, deciding what should be a value vs a mutable
  place, reasoning about side effects, or reviewing code that mixes I/O with
  pure logic. Also use when the user mentions immutability,
  parse-don't-validate, illegal states, Hickey, Normand, Grokking Simplicity,
  functional core, or effect isolation.
---

# Data-First Design

The single highest-leverage architectural frame for backend systems. Get the
data shapes right and the code almost writes itself; get them wrong and every
layer fights you.

> Not to be confused with Acton-style data-oriented design (cache locality,
> struct-of-arrays) — different tradition, aimed at hot loops, not domain
> modelling.

## Simple vs Easy

- **Simple** = one role, one concept, one task. Objective. Un-braided.
- **Easy** = familiar, near-to-hand. Subjective.
- **Complect** = to braid together. The defect.
- **Incidental complexity** = complexity you added. **Problem complexity** =
  complexity the domain forced on you. Only the second is unavoidable.
- Data-first is a simplicity move, not a style preference. Pick simple even when
  unfamiliar.

## The Three-Way Split: Data / Calculations / Actions

Every piece of code is one of three things:

**Data** — inert values. Facts about the world. Records, strings, numbers,
lists. No behaviour. Cannot be "wrong" by themselves.

**Calculations** — pure functions. Same inputs → same outputs. No side effects,
no I/O, no mutation of state outside the function. Referentially transparent;
safe to call from anywhere, including tests.

**Actions** — anything with side effects. Network calls, database reads/writes,
file I/O, clock reads, random number generation, mutable state updates. The
_only_ place external effects live.

### Classification drill

```
getUser(id)          — Action (hits database)
calculateTax(amount) — Calculation (pure math)
UserRecord           — Data (a value)
sendEmail(msg)       — Action (network)
formatAddress(addr)  — Calculation (string manipulation)
Date.now()           — Action (reads the clock)
```

### Why it matters

- Calculations are trivially testable with no mocks needed.
- Actions are hard to test — minimise their surface area.
- Code that mixes actions and calculations creates hidden dependencies and flaky
  tests.

**Refactoring pattern:** extract calculations out of actions. Turn "fetch user
and compute tax" into: fetch user (action) → user record (data) →
`computeTax(user.income)` (calculation) → write result (action).

---

## Values Over Places

A **value** is immutable. Once created, it never changes. You can share it
freely; no one can corrupt your copy.

A **place** is a variable, field, or reference that can be updated. Every
mutation is a potential source of bugs — concurrent writes, unexpected aliasing,
debugging state that changes over time.

**Epochal-time model:** values succeed one another. _Identity_ is a sequence of
values over time, not a mutable cell. State transitions are pure functions
`(oldValue, event) -> newValue`. The search term for the anti-pattern is
"place-oriented programming".

**Default to values.** Mutate only when:

- Performance profiling shows immutable copies are a measured bottleneck, OR
- You are modelling inherently stateful entities (a connection pool, a CRDT)

### Defensive copies at trust boundaries

```python
# Bad: caller's list is aliased into the object
def __init__(self, items: list):
    self.items = items  # shared reference!

# Good: own your copy
def __init__(self, items: list):
    self.items = list(items)  # copy on entry
```

Copy on exit too when returning mutable internals. Or better: return a new
immutable value.

In languages with persistent data structures (Clojure, Scala, Kotlin immutable
collections, Immer in TS), this copy is free and the hazard disappears.

---

## Parse, Don't Validate

**Validation** checks a value and returns bool/error, leaving the original type
unchanged. The caller must remember to re-validate everywhere the value is used.

**Parsing** transforms an unvalidated value into a _new type_ that encodes the
proof that validation occurred. You can never accidentally pass an unparsed
value where a parsed one is required — the type system prevents it.

```typescript
// Validate (weak): string stays string, proof is ephemeral
function isValidEmail(s: string): boolean { ... }

// Parse (strong): string becomes Email, proof is structural
type Email = { readonly _tag: 'Email'; address: string };
function parseEmail(s: string): Email | ParseError { ... }

// Function signatures now document their requirements
function sendWelcome(to: Email): void { ... }
// Compiler rejects: sendWelcome("raw@string.com")
```

**Where to parse:** at every trust boundary — HTTP request bodies, CLI args,
config files, DB rows from external systems, queue messages. Parse once at the
edge; pass typed values everywhere inside.

**Corollary:** never re-validate what you already parsed. If you hold an
`Email`, it's valid — checking again is noise and signals unclear ownership.

### Absence vs `Maybe`/`Option`

Wrapping every optional value in `Option`/`Maybe` forces every caller to unwrap
and couples producers to consumers: you can't relax a required field to optional
without breaking downstream. At external boundaries (API payloads, events,
queues), prefer open maps with optional keys where _absence = not present_.
Reserve `Option`/`Maybe` for internal domain values where the caller genuinely
must handle both cases.

---

## Make Illegal States Unrepresentable

If a state is impossible, encode that impossibility in the type system. The
compiler catches bugs you haven't written yet.

### Anti-pattern: boolean flags that conflict

```python
@dataclass
class Connection:
    connected: bool
    authenticated: bool
    # connected=False, authenticated=True is representable but nonsensical
```

### Pattern: discriminated union / sum type

```python
from dataclasses import dataclass
from typing import Union

@dataclass
class Disconnected: pass

@dataclass
class Connected:
    socket: socket.socket

@dataclass
class Authenticated:
    socket: socket.socket
    user_id: str

ConnectionState = Union[Disconnected, Connected, Authenticated]
# Authenticated without Connected is now impossible to construct
```

### Pattern: non-empty collections

```python
# Bad: empty Order is constructable
@dataclass
class Order:
    items: list[Item]  # could be []

# Good: first item is structurally required
@dataclass
class Order:
    first_item: Item
    rest: list[Item]
```

### Pattern: validated wrapper types

```python
@dataclass(frozen=True)
class UserId:
    value: str
    def __post_init__(self):
        if not self.value:
            raise ValueError("UserId cannot be empty")
        if len(self.value) > 128:
            raise ValueError("UserId too long")
# Now "empty user id" cannot reach domain logic
```

**Cost:** every new consumer couples to the wrapper. Use wrappers only for
domain invariants that can't be expressed in plain data (e.g. "this string was
cryptographically verified", "this id was authenticated"). Don't wrap every
stringly-typed field reflexively.

### Open data vs closed types — when to use which

| Where                               | Prefer                                  | Why                                                    |
| ----------------------------------- | --------------------------------------- | ------------------------------------------------------ |
| Domain core (internal)              | Closed sum types / discriminated unions | Compile-time exhaustiveness; forces change propagation |
| System seams (HTTP, queues, events) | Open maps/records + descriptive schema  | Tolerates added/missing fields; evolvable contracts    |

Closed types give guarantees; open maps give composability and evolution. At
boundaries where producers and consumers evolve independently, closed types turn
into coupling. Inside a bounded core, they turn into safety.

---

## Functional Core / Imperative Shell

Structure every system as two concentric layers:

**Functional core** — pure calculations. All domain logic, business rules, state
transitions, validation. No I/O. Fully testable without mocks or fakes.

**Imperative shell** — thin orchestration. Reads input (HTTP, DB, filesystem),
calls the functional core with plain data, writes output. Keep it thin; test it
with integration tests.

```
┌──────────────────────────────────────┐
│          Imperative Shell            │
│  HTTP handler → parse → plain data   │
│         ↓                            │
│  ┌────────────────────────────────┐  │
│  │       Functional Core          │  │
│  │  validateOrder()               │  │
│  │  applyDiscounts()              │  │
│  │  calculateTotal()              │  │
│  │  buildConfirmation()           │  │
│  └────────────────────────────────┘  │
│         ↓                            │
│  write to DB, emit event, respond    │
└──────────────────────────────────────┘
```

**Smell:** functions in the core that accept a `db`, `logger`, or `http_client`
parameter. Those are actions disguised as calculations. Move I/O to the shell;
pass in data.

---

## Stratified Design

Each module hides a **design decision likely to change** — that's the secret.
Layers are one expression of this, not the definition. Two modules at the same
layer can each hide a different secret. The point is change-locality: when a
decision changes, only its owning module changes.

Typical backend service layers (one common expression):

```
HTTP / CLI handlers           ← secret: transport protocol
Application / Use-case layer  ← secret: business workflows and orchestration
Domain model                  ← secret: business rules and invariants
Infrastructure (DB, queues)   ← secret: storage and messaging technology
```

Violation symptoms: domain logic in HTTP handlers; database queries in domain
models; business rules in SQL migrations.

**Change-locality test:** if you change the technology at one layer (swap
Postgres for MySQL, REST for gRPC), how many other modules must change? The
answer should be: only the module that owns that secret.

---

## Effect Isolation

Side effects spread. Once a function calls a database, every function in its
call stack is infected — it can no longer be a pure calculation.

**Rules:**

1. Keep effects at the boundary (top of the call tree / the shell).
2. Never call an effectful function from a calculation.
3. Model effects explicitly: `IO<T>` (Haskell), `async` (JS/Python/Rust),
   `Result<T, E>` (Rust/Go).
4. Inject effects as parameters — pass the clock, the DB client, the mailer — so
   the core stays testable and the shell stays thin.

**Signature discipline:** if the type signature doesn't mention `IO`/`async`/
`Result`, the function should be provably pure. Enforce this at review time even
in languages that don't check it.

---

## Decision Heuristics

| Question                                        | Heuristic                                                               |
| ----------------------------------------------- | ----------------------------------------------------------------------- |
| Should this be a function or a method?          | If it's a calculation, it doesn't need `self` — make it a free function |
| Should I use a class or a record?               | If it has no behaviour, use a record/dataclass                          |
| Should I mutate in place or return a new value? | Return a new value unless profiling says otherwise                      |
| Where does validation live?                     | At the boundary; return a typed result, not a bool                      |
| Is this function testable without mocks?        | If not, it's an action — try to extract a calculation                   |
| Am I about to start typing new types?           | Spend time with the data first — sketch example values before shapes    |

---

## Canon

- Hickey, "Simple Made Easy" — simple (un-braided) vs easy (familiar); the
  defining frame for incidental complexity.
  https://www.infoq.com/presentations/Simple-Made-Easy/
- Hickey, "The Value of Values" — why values beat mutable places.
  https://www.infoq.com/presentations/Value-Values/
- Hickey, "Are We There Yet?" — epochal time, persistent data structures.
  https://github.com/matthiasn/talk-transcripts/blob/master/Hickey_Rich/AreWeThereYet.md
- Hickey, "Effective Programs" — open data, generic maps, the case against
  closed types at system seams.
  https://github.com/matthiasn/talk-transcripts/blob/master/Hickey_Rich/EffectivePrograms.md
- Hickey, "Maybe Not" — the critique of `Option`/`Maybe` and requirement
  relaxation. https://www.youtube.com/watch?v=YR5WdGrpoug
- Hickey, "Hammock Driven Development" — think before you type; understand the
  data first.
  https://github.com/matthiasn/talk-transcripts/blob/master/Hickey_Rich/HammockDrivenDev.md
- Normand, _Grokking Simplicity_ (Manning, 2021) — data / calculations / actions
  made practical with worked examples.
  https://www.manning.com/books/grokking-simplicity
- Bernhardt, "Boundaries" — functional core, imperative shell.
  https://www.destroyallsoftware.com/talks/boundaries
- Parnas, "On the Criteria To Be Used in Decomposing Systems into Modules"
  (CACM 1972) — information hiding is hiding decisions likely to change.
  https://www.win.tue.nl/~wstomv/edu/2ip30/references/criteria_for_modularization.pdf
- King, "Parse, don't validate" — parsing produces evidence in the type.
  https://lexi-lambda.github.io/blog/2019/11/05/parse-don-t-validate/
- Wlaschin, _Domain Modeling Made Functional_ (Pragmatic, 2018) — sum types,
  railway-oriented programming, DDD in F#.
  https://pragprog.com/titles/swdddf/domain-modeling-made-functional/
- Acton, "Data-Oriented Design and C++" (CppCon 2014) — the _other_
  data-oriented tradition (cache locality); cited here only for disambiguation.
  https://www.youtube.com/watch?v=rX0ItVEVjHc
