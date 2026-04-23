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

## The Three-Way Split: Data / Calculations / Actions

From _Grokking Simplicity_ (Normand, 2021). Every piece of code is one of three
things:

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

---

## Parse, Don't Validate

_From Alexis King's 2019 essay._

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

---

## Functional Core / Imperative Shell

_Popularised by Gary Bernhardt._

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

## Stratified Design (Parnas / Normand)

Organise code into layers where each layer depends only on the layer below it.
Each layer hides a single **secret** — the design decision that only that layer
knows.

Typical backend service layers:

```
HTTP / CLI handlers           ← secret: transport protocol
Application / Use-case layer  ← secret: business workflows and orchestration
Domain model                  ← secret: business rules and invariants
Infrastructure (DB, queues)   ← secret: storage and messaging technology
```

Violation symptoms: domain logic in HTTP handlers; database queries in domain
models; business rules in SQL migrations.

**Parnas's test:** if you change the technology at one layer (swap Postgres for
MySQL, REST for gRPC), how many other layers must change? The answer should be:
only the layer that owns that secret.

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

**Haskell's lesson:** if the type signature doesn't mention `IO`, the function
is provably pure. Adopt this discipline as a code-review standard even in
languages that don't enforce it.

---

## Decision Heuristics

| Question                                        | Heuristic                                                               |
| ----------------------------------------------- | ----------------------------------------------------------------------- |
| Should this be a function or a method?          | If it's a calculation, it doesn't need `self` — make it a free function |
| Should I use a class or a record?               | If it has no behaviour, use a record/dataclass                          |
| Should I mutate in place or return a new value? | Return a new value unless profiling says otherwise                      |
| Where does validation live?                     | At the boundary; return a typed result, not a bool                      |
| Is this function testable without mocks?        | If not, it's an action — try to extract a calculation                   |

---

## Canon

- **Rich Hickey** — "Value of Values", "Simple Made Easy" (InfoQ). Core insight:
  values are simple; mutable places create incidental complexity.
- **Eric Normand** — _Grokking Simplicity_ (Manning, 2021). The
  data/calculations/actions framework made practical with worked examples.
- **David Parnas** — "On the Criteria To Be Used in Decomposing Systems into
  Modules" (CACM 1972). Information hiding and module secrets.
- **Alexis King** — "Parse, don't validate" (lexi-lambda.github.io, 2019).
- **Scott Wlaschin** — _Domain Modeling Made Functional_ (Pragmatic, 2018).
  Applying these ideas with sum types and railway-oriented programming.
- **Gary Bernhardt** — "Functional Core, Imperative Shell" (Destroy All Software
  screencasts, 2012).
