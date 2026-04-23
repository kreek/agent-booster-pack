---
name: documentation
description:
  Use when writing or reviewing documentation — READMEs, architecture notes,
  ADRs, runbooks, API docs, module-level docs, tutorials, how-to guides,
  reference material, or code comments. Also use when the user mentions
  Diátaxis, architecture decision records, ADRs, runbooks, doc rot, progressive
  disclosure, single source of truth, or whether to write prose or rely on
  types/tests.
---

# Documentation

Docs that pay rent: they answer a question the reader actually has, stay true as
the system changes, and are cheaper to read than the code they describe.
Everything below is in service of those three tests.

## Progressive Disclosure

Structure every document so a reader who bails early still leaves with something
useful.

- **First sentence** — the gist. What is this, in one line.
- **First paragraph** — why the reader should care and when to use it.
- **Body** — how it works, edge cases, detail.
- **End** — pointers to the next thing.

Treat each heading the same way: its first line should stand alone. A reader
scanning only the first line under every heading should still understand the
doc's shape.

Symptom of failure: the reader has to scroll to paragraph three before learning
whether the doc is even relevant to them.

---

## Single Source of Truth

When the same fact appears in two places, one of them will eventually lie. Link,
don't duplicate.

- API parameters: link the OpenAPI spec; don't re-list them in prose.
- Config keys: link the schema or default-values file.
- CLI flags: embed `--help` output via a generator, or link it — don't retype
  it.
- Cross-references: link to the authoritative file in the repo, not a prose
  summary.

When duplication is unavoidable (e.g. a conceptual overview that paraphrases a
spec), state explicitly which source is authoritative so readers know where to
go when the two disagree.

---

## The Four Modes (Diátaxis)

From Daniele Procida. Every doc serves exactly one of these purposes. Mixing
them produces prose that fails at all four.

| Mode             | Reader's situation                   | Shape                                            |
| ---------------- | ------------------------------------ | ------------------------------------------------ |
| **Tutorial**     | New to the system, learning by doing | Step-by-step, safe to follow, guaranteed success |
| **How-to guide** | Competent, has a specific goal       | Direct recipe for one task; assumes context      |
| **Reference**    | Working, needs a fact fast           | Accurate, exhaustive, no narrative               |
| **Explanation**  | Trying to understand                 | Discursive, covers _why_ and trade-offs          |

**Test:** what does the reader want to _do_ with this page?

- "I want to learn" → Tutorial
- "I want to accomplish X" → How-to
- "I want to look up X" → Reference
- "I want to understand X" → Explanation

Common failure: a "getting started" page that mixes tutorial steps with
reference tables and design rationale. Split it into three documents, each doing
one job well.

---

## Write for the Reader's Question

Phrase titles and headings as the goal the reader brought to the page, not the
author's taxonomy.

```
Author-first (bad):         Reader-first (good):
  "Key Rotation Subsystem"    "How do I rotate an API key?"
  "Error Handling Overview"   "What should I do when a job fails?"
  "Authentication"            "How does login work?"
```

Reverse-engineer the search query that landed them here. If the doc doesn't
answer that question in the first 30 seconds, the title is wrong or the doc is
wrong.

---

## Concrete Before Abstract

A worked example sticks faster than the rule it demonstrates. Lead with the
example; derive the rule.

```
Abstract-first (bad):
  "The API supports resource retrieval via HTTP GET with a path
  parameter identifying the resource instance."

Concrete-first (good):
  GET /users/42
  → 200 OK
  → { "id": 42, "email": "..." }

  Retrieve any user by ID. 404 if the user doesn't exist.
```

Even for explanation-mode docs, open with a scenario. "Imagine you're processing
10 000 orders a minute" lands better than "Under high throughput…".

---

## Co-locate Docs with Code

A document maintained away from the thing it describes will drift. Keep docs
close enough that they're reviewed in the same PR as the change.

- Module README → inside the module directory.
- ADRs → `docs/adr/` in the same repo as the code.
- API reference → generated from the source (docstrings, OpenAPI annotations).
- Runbooks → either in the service repo or a single ops repo _per team_, never
  in a detached wiki.

Wikis drift. Confluence drifts. A doc in the same repo as the code gets reviewed
by reviewers who'd notice a lie.

---

## Prefer Executable Proofs Over Prose

Prose rots silently; types, schemas, and tests fail loudly. Let the executable
artifact carry the invariant; let prose carry the intent.

- A type signature declares the contract better than English. Use prose to
  explain _why_ the contract has that shape.
- A contract test pins the API. Use prose to explain _what_ a consumer is
  expected to do.
- A schema validates the config. Use prose to explain _which key to tune for
  which symptom_.

Rule of thumb: if you find yourself writing "this function returns an `Order` if
the cart is non-empty, otherwise `None`", that sentence is redundant with the
signature — delete it and document the _reason_ for the invariant instead.

---

## ADRs (Architecture Decision Records)

Record significant decisions in a lightweight, durable format. Michael Nygard's
structure:

```markdown
# ADR-0007: Use Postgres for the order ledger

Status: Accepted Date: 2026-02-14

## Context

[The forces at play: constraints, requirements, options considered.]

## Decision

[What we decided, stated plainly.]

## Consequences

[What becomes easier, what becomes harder, what is now locked in.]
```

Rules:

- **One decision per ADR.** If you're writing "and", split it.
- **Immutable once accepted.** Don't edit an ADR to reflect a later change —
  write a new ADR that supersedes it (`Status: Superseded by ADR-0023`).
- **Number sequentially.** ADR-0001, ADR-0002, etc. Never reuse a number.
- **Write it when the decision is made**, not months later from memory.

An ADR's value is the _why_ and the _alternatives considered_. If a future
engineer asks "why did we use X instead of Y?" and no ADR answers them, the ADR
shouldn't have been skipped.

---

## Runbooks

A runbook is a doc the on-call engineer reads at 3am while an alert is firing.
Optimise for that reader.

```markdown
# Runbook: order-processor high latency

## Symptom

p99 of `order_processor_latency_seconds` > 2s for 5 minutes. Triggers the
`order-processor-slow` alert.

## Diagnosis

1. Check DB connection pool saturation: [dashboard link]
2. Check downstream payment-gateway latency: [dashboard link]
3. Check for hot-partition lock contention on `orders` table.

## Remediation

- If DB pool saturated: scale processor replicas (`kubectl scale ...`).
- If payment-gateway slow: page payments on-call (#payments-oncall).
- If lock contention: apply the known mitigation (link to playbook).

## Verification

Latency returns below 500ms within 5 minutes of remediation.

## Escalation

If unresolved in 15 minutes, page the platform lead.
```

Test runbooks in drills. A runbook that's never been exercised is speculative
fiction.

---

## Delete Aggressively

A stale doc is worse than no doc because readers trust it. Audit regularly and
delete anything you can't commit to maintaining.

Delete when:

- The feature it describes has been removed or significantly changed.
- The "last reviewed" date is older than the feature's current behaviour.
- No one on the team can confirm whether it's still accurate.

Prefer a short, correct doc over a long, speculative one. "We don't document X
yet" is a legitimate answer.

When deleting, leave a breadcrumb: a redirect, a note in the changelog, or a
link in the adjacent docs that used to reference it.

---

## Signposting

Tell the reader what's coming, what's out of scope, and where to go next.

- **Scope sentence near the top:** "This guide covers deploying to staging. For
  production, see [link]."
- **Prerequisites:** list what the reader must already know or have set up.
- **Non-goals:** list related topics this doc deliberately doesn't cover.
- **Next steps:** end every doc with pointers. Where do they go after reading
  this?

A reader should never wonder "wait, is this the right page for my situation?"
after five minutes of reading.

---

## Comments: the _Why_ is Load-Bearing

Reinforces the AGENTS.md rule with the test: remove the comment — would a future
reader be surprised or misled?

**Delete these — they narrate what the code says:**

```python
# Increment the counter
counter += 1

# Loop over users
for user in users:
    ...
```

**Keep these — they record non-obvious _why_:**

```python
# Stripe rate-limits to 100/s per account; batch to stay below.
# Violating this caused the 2025-11-03 outage (PR #4821).
send_in_batches(payments, batch_size=80)

# Don't use the official SDK here — it buffers the whole response,
# which OOMs on > 500MB exports. This streaming path is deliberate.
with raw_http_client() as client:
    ...

# Off-by-one is intentional: the API treats `end` as exclusive,
# but our callers expect inclusive ranges.
return fetch(start, end + 1)
```

Rule of thumb: if the comment is a restatement of the code, delete it. If
removing it would cause the next engineer to "fix" something that shouldn't be
changed, keep it.

Docstrings follow the same rule: document the contract (inputs, outputs,
invariants, failure modes), not the mechanics.

---

## Canon

- **Daniele Procida** — _Diátaxis: A systematic approach to technical
  documentation_ (diataxis.fr). The four-modes framework.
- **Michael Nygard** — "Documenting Architecture Decisions" (cognitect.com,
  2011). Originated the ADR format.
- **Google** — _Developer Documentation Style Guide_
  (developers.google.com/style). Practical conventions for reader-first prose.
- **Write the Docs** — _writethedocs.org_. Community for documentation
  practitioners; useful talks on doc rot, audience analysis, and information
  architecture.
- **Julia Evans** — on concrete examples and teaching by showing, not telling.
  Her zines are a masterclass in progressive disclosure.
