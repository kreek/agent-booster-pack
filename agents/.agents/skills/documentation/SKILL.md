---
name: documentation
description: Use when docs are requested or approved: READMEs, guides, ADRs, runbooks, API docs, comments.
---

# Documentation

## Iron Law

`DOCUMENT THE DECISION, CONTRACT, OR WORKFLOW WHERE IT WILL ROT LEAST.`

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
   local structure cannot. Encode the rule in a name, type, function,
   schema, or test first. Add a comment only when the reason still
   is not locally obvious. Avoid comment-count targets and line-by-line
   narration.
9. Runbooks are operational artifacts: symptom, diagnosis,
   remediation, verification, escalation.
10. Large project documentation uses Material for MkDocs by default,
   regardless of language or framework. Use another docs system only
   when the repo already has one, the user asks, or a publishing
   constraint requires it.
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
- [ ] Behavior-changing PRs update or deliberately delete affected
      docs only when docs are in scope. CHANGELOG, release notes, and version
      manifests are out of scope here; they are touched only during release
      prep under `release`.
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

## Tripwires

| Trigger | Do this instead | False alarm |
|---|---|---|
| "Copy the generated API output into docs" | Link to the source of truth and write only missing context. | The generated output is not available to the reader and the copy has an owner. |
| "README should explain everything" | Keep README to purpose, install/run, minimal usage, and links onward. | Tiny project where README is the only docs surface. |
| "Add comments so the code is documented" | Encode the rule in names, types, schemas, or tests first. Comment only non-obvious why/how. | A safety invariant or protocol rule is not locally obvious. |
| "Update CHANGELOG while editing docs" | Use `release`; changelog and release notes are release-prep artifacts. | The user explicitly asked for release prep. |
| "This code change should probably update docs" | Ask whether docs are in scope, or report the docs gap as deferred/unproven. | The user requested docs or a validator requires the update. |
| "Use the user-story template and move on" | Write concrete behavior, constraints, non-goals, and proof. | The team requires the template and concrete acceptance is still present. |
| "Leave stale docs for later" | Delete stale prose or mark it with a tracked rewrite owner. | The stale section is outside scope and clearly labeled already. |
| "This sounds more polished with a longer explanation" | Split the sentence. Keep the concrete decision, contract, workflow, or reader action. | A formal legal, compliance, or policy document requires exact wording. |

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
