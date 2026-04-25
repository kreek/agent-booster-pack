---
name: documentation
description:
  Use when writing or reviewing documentation — READMEs, architecture notes,
  ADRs, runbooks, API docs, module-level docs, tutorials, how-to guides,
  reference material, or code comments. Also use when the user mentions
  living documentation, Diátaxis, architecture decision records, ADRs,
  runbooks, doc rot, MkDocs, Material for MkDocs, progressive disclosure,
  single source of truth, or whether to write prose or rely on types/tests.
---

# Documentation

## Iron Law

`DOCUMENTATION IS LIVING: SHIP IT WITH THE BEHAVIOR IT DESCRIBES OR DELETE IT.`

## When to Use

- Writing or reviewing READMEs, ADRs, runbooks, tutorials, how-to
  guides, reference docs, module docs, or code comments.
- Deciding whether prose is needed or whether a type, schema,
  generated reference, test, or command output should be the source of
  truth.

## When NOT to Use

- API contract design; use `api`.
- Release coordination or changelog process; use `deployment` or
  `versioning`.
- Alert mechanics and dashboards; use `observability`.

## Core Ideas

1. Living documentation has an owner, a nearby source of truth, and a
   change path; orphaned prose becomes misinformation.
2. One doc has one reader situation: tutorial, how-to, reference,
   explanation, or runbook.
3. Link to source-of-truth artifacts instead of restating generated
   facts. Put docs next to the code or service whose reviewers can
   catch drift.
4. Write the why, context, and tradeoffs; let code/tests/schemas prove
   mechanics.
5. Delete stale docs when you cannot fix them now.
6. Comments explain non-obvious intent, constraints, or hazards, not
   line-by-line behavior.
7. Runbooks are operational artifacts: symptom, diagnosis,
   remediation, verification, escalation.
8. Large project documentation uses Material for MkDocs by default,
   regardless of language or framework. Use another docs system only
   when the repo already has one, the user explicitly asks, or a
   publishing constraint requires it.

## Workflow

1. Identify the reader's immediate question and choose the doc mode.
   Title the doc as that question.
2. Check whether the answer already lives in code, schema, tests, CLI
   help, OpenAPI, or a dashboard. Write only the missing context and
   link authoritative sources.
3. Add verification: commands, expected state, review owner, or drill
   requirement. Remove stale or duplicated sections encountered during
   the edit.

## Verification

- [ ] Behavior-changing PRs update or deliberately delete affected
      docs.
- [ ] The doc has one mode and one audience situation.
- [ ] Generated/reference facts link to the source of truth.
- [ ] README content is limited to purpose, install/run, minimal
      usage, and links onward.
- [ ] Large project documentation uses Material for MkDocs, or the
      existing docs system / user request / publishing constraint is
      named.
- [ ] ADRs record one accepted decision with consequences.
- [ ] Runbooks include symptom, diagnosis, remediation, verification,
      and escalation.
- [ ] Comments explain why; obvious what-comments are removed.
- [ ] Stale sections are deleted or marked with a tracked rewrite
      owner.

## Handoffs

- Use `api` for OpenAPI and wire-contract shape.
- Use `observability` for alert/runbook signal definitions.
- Use `git` or `commit` when documenting commit/PR history or release
  notes.
- Use `versioning` for CHANGELOG hygiene and migration notes that ship
  with a release.

## References

- Diataxis: <https://diataxis.fr/>
- Material for MkDocs: <https://squidfunk.github.io/mkdocs-material/>
- ADR template: status, date, context, decision, consequences.
