---
name: documentation
description: Use for requested/approved docs, READMEs, ADRs, runbooks, API docs, comments.
---

# Documentation

## Iron Law

`DOCUMENT ONLY WHAT NEEDS PROSE. KEEP DOCS NEAR THE CODE, CONTRACT, OR TEAM THAT MAINTAINS THEM.`

## When to Use

- The user asks for or approves writing/reviewing READMEs, ADRs, runbooks,
  tutorials, how-to guides, reference docs, module docs, requirements,
  acceptance criteria, user stories, or code comments.
- Deciding whether prose is needed or whether a type, schema,
  generated reference, test, or command output should be the source of
  truth.

## When NOT to Use

- Ordinary implementation where docs might later be useful but were not
  requested, approved, or required by a validator. Name the possible docs gap
  in the final response instead of editing docs.
- API contract design; use `api`.
- Release coordination, changelog process, release notes, version manifests,
  or migration notes; use `release`. Those artifacts land only during
  release prep.
- Alert mechanics and dashboards; use `observability`.

## Core Ideas

1. Documentation is a separate work product, not an implementation reflex.
   Before editing docs outside the user's request, ask whether docs are in
   scope unless a repo validator requires the update.
2. Living documentation has an owner, a nearby source of truth, and a
   change path; orphaned prose becomes misinformation.
3. One doc has one reader situation: tutorial, how-to, reference,
   explanation, or runbook.
4. Link to source-of-truth artifacts instead of restating generated
   facts. Put docs next to the code or service whose reviewers can
   catch drift.
5. Write the why, context, and tradeoffs; let code/tests/schemas prove
   mechanics.
6. Write in short, direct sentences. Prefer concrete nouns and verbs. Split
   long sentences. Remove throat-clearing, ornate phrasing, and clever style.
7. Delete stale docs when you cannot fix them now.
8. Comments explain why and how when names, types, schemas, tests, or
   local structure cannot. Encode the rule in code or tests first; add a
   comment only when the reason remains non-obvious.
9. Runbooks are operational artifacts: symptom, diagnosis,
   remediation, verification, escalation.
10. Large project docs use the repo's existing docs system. If none exists,
    choose one during scaffolding or with user approval.
11. Requirements docs should make behavior, constraints, and acceptance
   explicit. Use user-story format only when it helps; do not let
   template wording replace concrete acceptance criteria.

## Workflow

1. Confirm documentation should run now. Continue only when docs are requested,
   approved after a concrete gap is found, or required by validation.
2. Identify the reader's immediate question and choose the doc mode.
   Title the doc as that question.
3. Check whether the answer already lives in code, schema, tests, CLI
   help, OpenAPI, or a dashboard. Write only the missing context and
   link authoritative sources.
4. Add verification: commands, expected state, review owner, or drill
   requirement. Remove stale or duplicated sections encountered during
   the edit.
5. For PRDs, specs, issues, user stories, or acceptance criteria, read
   `references/requirements-and-acceptance.md` and write from the
   user's goal to observable behavior.

## Verification

- [ ] The skill ran because docs were requested, approved after a concrete
      docs gap was found, or required by validation.
- [ ] The doc has one mode and one audience situation.
- [ ] Generated/reference facts link to the source of truth.
- [ ] README, ADR, runbook, comment, requirements, or acceptance content matches
      its mode: concise README, one-decision ADR, operational runbook,
      non-obvious why/how comments, observable acceptance criteria.
- [ ] Stale sections are deleted or marked with a tracked rewrite owner.
- [ ] CHANGELOG, release notes, migration notes, and version manifests remain
      under `release`.

## Tripwires

Use these when the shortcut thought appears:

- Link generated or authoritative sources and write only missing context.
- Keep README to purpose, install/run, minimal usage, and links onward.
- Encode rules in names, types, schemas, or tests before adding comments.
- Route CHANGELOG, release notes, migration notes, and version manifests to
  `release`.
- Ask before editing docs for an implementation change unless docs were
  requested or validation requires them.
- Write concrete behavior, constraints, non-goals, and proof; templates do not
  replace acceptance criteria.
- Delete stale prose or mark it with a tracked rewrite owner.
- Split long sentences and keep the concrete decision, contract, workflow, or
  reader action.

## Handoffs

- `api`: OpenAPI and wire-contract shape.
- `observability`: alert/runbook signal definitions.
- `git-workflow`: commit/PR history docs.
- `release`: CHANGELOG, release notes, migration notes, version manifests.
- `proof`: acceptance criteria as completion evidence.

## References

- Diataxis: <https://diataxis.fr/>
- Material for MkDocs: <https://squidfunk.github.io/mkdocs-material/>
- ADR template: status, date, context, decision, consequences.
- Requirements and acceptance criteria:
  `references/requirements-and-acceptance.md`.
