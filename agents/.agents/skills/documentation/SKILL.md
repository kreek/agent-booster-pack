---
name: documentation
description: Use for docs, READMEs, guides, ADRs, runbooks, API docs, comments, and structure.
---

# Documentation

## Iron Law

`DOCUMENT THE DECISION, CONTRACT, OR WORKFLOW WHERE IT WILL ROT LEAST.`

## When to Use

- Writing or reviewing READMEs, ADRs, runbooks, tutorials, how-to
  guides, reference docs, module docs, requirements, acceptance
  criteria, user stories, or code comments.
- Deciding whether prose is needed or whether a type, schema,
  generated reference, test, or command output should be the source of
  truth.

## When NOT to Use

- API contract design; use `api`.
- Release coordination or changelog process; use `release`. Do not edit
  `CHANGELOG.md`, release notes, version manifests, or migration notes
  from this skill, even when behavior changes. Those are release-prep
  artifacts and only land when a release is being cut, under `release`.
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
6. Comments explain why and how when names, types, schemas, tests, or
   local structure cannot. Encode the rule in a name, type, function,
   schema, or test first; add a comment only when the reason still
   isn't locally obvious. Avoid comment-count targets and line-by-line
   narration. (Verification names which subjects deserve a comment.)
7. Runbooks are operational artifacts: symptom, diagnosis,
   remediation, verification, escalation.
8. Large project documentation uses Material for MkDocs by default,
   regardless of language or framework. Use another docs system only
   when the repo already has one, the user explicitly asks, or a
   publishing constraint requires it.
9. Requirements docs should make behavior, constraints, and acceptance
   explicit. Use user-story format only when it helps; do not let
   template wording replace concrete acceptance criteria.

## Workflow

1. Identify the reader's immediate question and choose the doc mode.
   Title the doc as that question.
2. Check whether the answer already lives in code, schema, tests, CLI
   help, OpenAPI, or a dashboard. Write only the missing context and
   link authoritative sources.
3. Add verification: commands, expected state, review owner, or drill
   requirement. Remove stale or duplicated sections encountered during
   the edit.
4. For PRDs, specs, issues, user stories, or acceptance criteria, read
   `references/requirements-and-acceptance.md` and write from the
   user's goal to observable behavior.

## Verification

- [ ] Behavior-changing PRs update or deliberately delete affected
      docs. CHANGELOG, release notes, and version manifests are out of
      scope here; they are touched only during release prep under
      `release`.
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
- [ ] Comments explain non-obvious why/how context for business rules,
      domain constraints, safety invariants, protocol/lifecycle
      assumptions, and workarounds; obvious what-comments are removed.
- [ ] Stale sections are deleted or marked with a tracked rewrite
      owner.
- [ ] Requirements and acceptance criteria name caller-visible
      behavior, constraints, non-goals, and proof, not implementation
      guesses.

## Handoffs

- Use `api` for OpenAPI and wire-contract shape.
- Use `observability` for alert/runbook signal definitions.
- Use `git-workflow` when documenting commit/PR history.
- Use `release` for CHANGELOG hygiene, release notes, and migration
  notes that ship with a release.
- Use `proof` when acceptance criteria need to become completion
  evidence.

## References

- Diataxis: <https://diataxis.fr/>
- Material for MkDocs: <https://squidfunk.github.io/mkdocs-material/>
- ADR template: status, date, context, decision, consequences.
- Requirements and acceptance criteria:
  `references/requirements-and-acceptance.md`.
