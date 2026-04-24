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

## Before writing any doc

| Reader's question             | Artefact              | Where                            |
| ----------------------------- | --------------------- | -------------------------------- |
| "How do I start from zero?"   | Tutorial              | `docs/tutorials/`                |
| "How do I do X?"              | How-to                | `docs/how-to/` or README         |
| "What are the exact fields?"  | Reference (generated) | OpenAPI / docstrings             |
| "Why is it built this way?"   | Explanation / ADR     | `docs/explanation/`, `docs/adr/` |
| "It's on fire, what do I do?" | Runbook               | next to the service              |

If the answer exists in code/schema/tests, link it. Do not restate.

---

## Doc change ships in the PR that changes the behaviour

- Behaviour changed → update the doc in the same PR. No "docs follow-up" issues.
- If you cannot update it now, delete the stale section and open an issue to
  rewrite.
- A reviewer who sees a behaviour diff with no doc diff must block the PR.

---

## Progressive disclosure

- Line 1: what this is.
- Paragraph 1: who it's for and when to use it.
- Body: mechanics, edge cases.
- End: next link.

Scan test: reading only the first line under each heading must reveal the doc's
shape. Lead with a concrete example; derive the rule.

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

When duplication is unavoidable, state explicitly which source is authoritative.

---

## The Four Modes (Diátaxis)

Classify before writing: learning / doing / looking-up / understanding. One
purpose per doc. If you need two, write two.

| Mode             | Reader's situation                   | Shape                                            |
| ---------------- | ------------------------------------ | ------------------------------------------------ |
| **Tutorial**     | New to the system, learning by doing | Step-by-step, safe to follow, guaranteed success |
| **How-to guide** | Competent, has a specific goal       | Direct recipe for one task; assumes context      |
| **Reference**    | Working, needs a fact fast           | Accurate, exhaustive, no narrative               |
| **Explanation**  | Trying to understand                 | Discursive, covers _why_ and trade-offs          |

Failure mode: a "getting started" page that mixes tutorial steps with reference
tables and design rationale. Split it into three.

---

## Reference is generated

- API fields → OpenAPI / JSON Schema / protobuf. Render; don't retype.
- CLI flags → `--help` via a generator.
- Config keys → the schema file.
- Types & signatures → the source. Docstrings carry contract + why, not
  mechanics.

When you catch yourself retyping a signature in prose, delete the prose.

---

## README (keep it short; link out)

1. One-line description (what + who for).
2. Install / run: copy-pasteable commands.
3. Minimal working example with expected output.
4. Link to: full docs, CONTRIBUTING, LICENSE, CHANGELOG.

Out of scope in the README: design rationale (→ ADR), full reference (→
generated), runbooks.

---

## Titles are the reader's question, not your taxonomy

```
Author-first (bad):         Reader-first (good):
  "Key Rotation Subsystem"    "How do I rotate an API key?"
  "Error Handling Overview"   "What should I do when a job fails?"
  "Authentication"            "How does login work?"
```

If the doc doesn't answer the title question in the first 30 seconds, the title
is wrong or the doc is wrong.

---

## Co-locate docs with code

- Module README → inside the module directory.
- ADRs → `docs/adr/` in the same repo as the code.
- API reference → generated from the source (docstrings, OpenAPI annotations).
- Runbooks → service repo or a single ops repo _per team_, never a detached
  wiki.

Wikis drift. A doc in the same repo gets reviewed by reviewers who'd notice a
lie.

---

## Prefer executable proofs over prose

Prose rots silently; types, schemas, and tests fail loudly.

- Type signature declares the contract. Prose explains _why_ the contract has
  that shape.
- Contract test pins the API. Prose explains _what_ a consumer must do.
- Schema validates config. Prose explains _which key to tune for which symptom_.

If you're writing "returns an `Order` if the cart is non-empty, otherwise
`None`" — delete it; document the reason for the invariant instead.

---

## ADR rules

- One decision per ADR. If the title needs "and", split it.
- Sections: Status, Date, Context, Decision, Consequences (list positive,
  negative, neutral).
- Immutable after Accepted. Supersede with a new ADR; set old
  `Status: Superseded by ADR-NNNN`.
- Sequential numbers, never reused. Store in `docs/adr/`.
- Write at decision time, not from memory.

Trigger: if a future engineer might ask "why X and not Y?", write the ADR now.

```markdown
# ADR-0007: Use Postgres for the order ledger

Status: Accepted Date: 2026-02-14

## Context

[Forces at play: constraints, requirements, options considered.]

## Decision

[What we decided, stated plainly.]

## Consequences

[Positive, negative, neutral. What becomes easier, what becomes harder, what is
now locked in.]
```

---

## Runbook sections (in order, always)

Symptom → Diagnosis → Remediation → Verification → Escalation.

- Every diagnosis step links a dashboard or query.
- Every remediation step is a command or a named playbook.
- Untested runbook = fiction. Exercise in a drill within 30 days of writing.

```markdown
# Runbook: order-processor high latency

## Symptom

p99 of `order_processor_latency_seconds` > 2s for 5 minutes. Triggers the
`order-processor-slow` alert.

## Diagnosis

1. DB connection pool saturation: [dashboard link]
2. Downstream payment-gateway latency: [dashboard link]
3. Hot-partition lock contention on `orders` table.

## Remediation

- DB pool saturated: scale processor replicas (`kubectl scale ...`).
- Payment-gateway slow: page payments on-call (#payments-oncall).
- Lock contention: apply known mitigation (link to playbook).

## Verification

Latency returns below 500ms within 5 minutes of remediation.

## Escalation

Unresolved in 15 minutes → page the platform lead.
```

---

## Delete or rewrite when

- Code referenced by the doc was renamed, moved, or deleted.
- Feature behaviour changed and the doc was not updated in that PR.
- No one on the team can confirm it's still accurate.
- Last-reviewed date older than last behaviour change.

A stale doc is worse than no doc — readers trust it. Leave a breadcrumb on
delete: redirect, changelog note, or link from adjacent docs.

---

## Signposting

- **Scope sentence near the top:** "This guide covers deploying to staging. For
  production, see [link]."
- **Prerequisites:** what the reader must already know or have set up.
- **Non-goals:** related topics this doc deliberately doesn't cover.
- **Next steps:** end every doc with pointers.

A reader should never wonder "is this the right page?" five minutes in.

---

## Comments

Rule: comment the _why_ (intent, constraint, non-obvious reason). Never the
_what_.

Test: remove the comment — would the next engineer be surprised or misled? If
no, delete it.

Docstring scope: modules and exported functions. Not every internal helper.
Document the contract (inputs, outputs, invariants, failure modes), not the
mechanics.

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

---

## Tiebreaker

When sources disagree: _The Pragmatic Programmer_ (20th ed.). Docs are code:
plain text, version-controlled, DRY, why-not-what, built-in not bolted-on.

---

## Canon

- _The Pragmatic Programmer_, 20th Anniversary Edition —
  [pragprog.com](https://pragprog.com/titles/tpp20/the-pragmatic-programmer-20th-anniversary-edition/);
  [Tips](https://pragprog.com/tips/);
  [DRY chapter extract (PDF)](https://media.pragprog.com/titles/tpp20/dry.pdf).
- _Diátaxis: A systematic approach to technical documentation_ —
  [diataxis.fr](https://diataxis.fr/);
  [start here](https://diataxis.fr/start-here/).
- _Documenting Architecture Decisions_ (2011) —
  [cognitect.com](https://www.cognitect.com/blog/2011/11/15/documenting-architecture-decisions);
  templates at [adr.github.io](https://adr.github.io/);
  [Red Hat overview](https://www.redhat.com/en/blog/architecture-decision-records).
- _Google Developer Documentation Style Guide_ —
  [highlights](https://developers.google.com/style/highlights);
  [second person](https://developers.google.com/style/person);
  [prescriptive documentation](https://developers.google.com/style/prescriptive-documentation).
- _GitLab Handbook — Shared Reality / SSOT_ —
  [handbook.gitlab.com](https://handbook.gitlab.com/teamops/shared-reality/);
  [style guide](https://docs.gitlab.com/development/documentation/styleguide/).
- _Docs-as-Code_ —
  [TechTarget](https://www.techtarget.com/searchapparchitecture/tip/Docs-as-Code-explained-Benefits-tools-and-best-practices);
  [Kong](https://konghq.com/blog/learning-center/what-is-docs-as-code);
  [Hyperlint](https://hyperlint.com/blog/5-critical-documentation-best-practices-for-docs-as-code/).
- _Runbooks / SRE_ —
  [Google SRE Workbook: On-Call](https://sre.google/workbook/on-call/);
  [SRE Book: Being On-Call](https://sre.google/sre-book/being-on-call/);
  [ACM Queue: Why SRE Documents Matter](https://queue.acm.org/detail.cfm?id=3283589).
- _READMEs_ — [makeareadme.com](https://www.makeareadme.com/);
  [freeCodeCamp: How to Structure Your README](https://www.freecodecamp.org/news/how-to-structure-your-readme-file/).
- _Write the Docs_ — [writethedocs.org](https://www.writethedocs.org/).
