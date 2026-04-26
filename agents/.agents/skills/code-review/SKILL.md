---
name: code-review
description:
  Use when performing code review of local diffs, staged changes, branches,
  GitHub pull requests, or agent-generated code; when asked to review a PR,
  inspect requested changes, fetch review comments, address review feedback on
  the user's own PR, or decide whether code is ready to merge. Also use before
  merging broad changes when no narrower domain skill fully covers the review.
---

# Code Review

## Iron Law

`FINDINGS FIRST. BLOCK ON CORRECTNESS, SAFETY, DATA LOSS, AND UNPROVEN CLAIMS; DO NOT BLOCK ON TASTE.`

## When to Use

- Local review of unstaged, staged, branch, or patch diffs.
- GitHub PR review through `gh`.
- Review-comment follow-up on the user's own PRs.
- Agent-generated code review before merge or handoff.

## When NOT to Use

- Commit grouping only; use `commit`.
- Git history repair, rebases, conflicts, or force-push decisions; use `git`.
- A narrow domain-only review where a specialist skill is sufficient
  (`security`, `database`, `api`, `accessibility`).

## Core Ideas

1. Review the changed *behavior*, not just the changed lines. Read enough
   surrounding code to understand call sites, invariants, ownership, and
   existing conventions.
2. Findings must be reproducible from the diff, surrounding code, tests, or
   documented contract. A comment is useful only when it names a concrete
   defect, the impact, and the change that would remove the risk.
3. Safety and correctness outrank maintainability; maintainability outranks
   style. Every review includes a security pass, even when the diff doesn't
   look security-focused.
4. Every non-trivial "looks fine" claim needs proof evidence or must be
   scoped as unproven.
5. Identify declared runtime and toolchain constraints (manifests, lockfiles,
   CI, framework versions, support policy) before applying language advice.
   Repository compatibility wins over language-reference defaults.
6. Duplication and dead code are review risks: they hide divergent behavior,
   stale invariants, unreachable branches, and untested paths. For removals
   and refactors, verify old paths were fully removed or intentionally
   preserved, and that callers reach the intended path.
7. AI-generated code is untrusted until behavior, tests, and
   security-sensitive paths are verified.
8. Review comments should be sparse, specific, and actionable.
9. Maintainability findings are valid when complexity creates real risk:
   deep nesting, long functions, hidden mutable state, clever expressions,
   unnecessary indirection, or code organized so one behavior is scattered
   across unrelated places.

## Workflow

1. Resolve the review target. Local: `git diff`, `git diff --cached`, or
   `git diff <base>...HEAD`. GitHub: `gh pr view` for metadata,
   `gh pr diff --patch` for code, `gh api graphql` to fetch
   `reviewThreads` (with `isResolved`, `isOutdated`, path, line) when
   thread state matters; flat `comments` lose thread state.
2. Read the intent: what behavior, API, data shape, migration, UI, or
   workflow is supposed to change.
3. Load the language reference under `references/` for every language in
   the diff (`rust.md`, `fsharp.md`, `csharp.md`, `python.md`,
   `typescript.md`, `ruby.md`, `java.md`, `kotlin.md`, `bash.md`,
   `sql.md`). Defer recommendations incompatible with the repo's
   declared toolchain.
4. Load triggered domain skills as mandatory lenses. **Always** include a
   security pass for any auth, trust-boundary, input, dependency, secret,
   crypto, logging-redaction, or user-controlled-sink concern. Add others
   as triggered: `database`, `api`, `testing`, `proof`, `data-first`,
   `architecture`, `error-handling`, `concurrency`, `deployment`,
   `observability`, `ui-design`, `accessibility`, `documentation`,
   `performance`, `caching`, `realtime`.
5. Check in this order: correctness → data integrity → security → error
   handling → tests → observability → compatibility → performance →
   maintainability. Sweep for harmful duplication, orphaned code,
   unreachable branches, dead feature flags, unused public surface, and
   stale tests/docs/config.
6. Don't review generated, vendored, or lockfile churn as if it were
   hand-written; sample only enough to detect obvious risk. If the diff
   is too large, review by risk area and state the partial scope.
7. Report findings first, ordered by severity. If none, say so and name
   residual risk or missing verification.

## Addressing Review Feedback

- Only modify a PR when it's the user's own or the user explicitly asks.
- Separate actionable requested changes from discussion, approvals,
  duplicates, resolved threads, and outdated threads.
- Cluster comments by behavior or file; fix the smallest coherent set.
- If a comment asks for explanation rather than code, draft a reply
  instead of forcing a code change.
- Do not post comments, submit reviews, resolve threads, or push fixes
  unless the user explicitly asks for that GitHub write.
- If comments conflict or imply a behavior regression, stop and surface
  the tradeoff.

## Finding Format

Lead with findings, ordered by severity:

| Severity | Use for |
|---|---|
| **Critical** | Exploitable security issue, data loss, broken auth, destructive migration, production outage risk. |
| **High** | Incorrect behavior, broken contract, missing authorization, race, serious regression, untested risky path. |
| **Medium** | Maintainability, error handling, observability, compatibility, or test gap likely to cause future defects. |
| **Low** | Non-blocking clarity issue. Skip unless asked. |

Each finding includes: file/line or PR thread anchor, issue, impact,
concrete fix direction, evidence or missing proof. Use questions only
for ambiguity that blocks a finding or fix. Put summaries after
findings, not before.

## Verification

- [ ] Declared runtime, dependency, framework, and tooling constraints
      were checked before applying language-reference guidance.
- [ ] A security pass checked secrets, auth/authz, input handling,
      unsafe sinks, dependencies, and logging/error disclosure.
- [ ] Duplication and dead-code risks were checked, especially for
      removals, refactors, renames, feature flags, routes, jobs,
      exports, and tests.
- [ ] Complexity risks were checked: deep nesting, oversized functions,
      hidden mutable state, clever code, and unnecessary indirection.
- [ ] Triggered domain skills and language reference(s) were loaded and
      named.
- [ ] Findings are ordered by severity and grounded in file/line or PR
      thread anchors; each blocking finding explains impact and fix.
- [ ] Test, build, CI, or proof evidence was checked, or missing
      evidence was reported as unproven.
- [ ] GitHub writes were not performed without explicit user request.
- [ ] If no issues, residual risk and unreviewed scope were named.

## Tripwires

| Trigger | Do this instead | False alarm |
|---|---|---|
| "Small PR, skim is enough" | Sweep lifecycle, security, data, tests, and dead-code risk anyway. | Documentation-only typo with no executable surface. |
| "Tests pass, ship it" | Check what the tests prove and still review safety/data lenses. | The task is only to report current CI status. |
| "Style nits are blocking" | Separate style notes from correctness, security, and maintainability findings. | Style issue hides a real ambiguity or risky control flow. |
| "I trust this author" | Review the diff with the same lenses; trust changes tone, not coverage. | Pair review where the same evidence was already inspected in this turn. |
| "Skip the security pass this once" | Run the security lens and name why it is or is not relevant. | Files are provably outside executable, config, dependency, and data surfaces. |

## Handoffs

- Use `security` for auth, trust boundaries, secrets, crypto,
  dependencies, or injection risks.
- Use `database` for migrations, locking, transactions, schema, indexes,
  or production data access.
- Use `proof` when review claims need explicit proof obligations.
- Use `testing` for test quality, missing behavior coverage, mocks, or
  flakes.
- Use `git` for branch mechanics and `commit` for packaging accepted
  fixes.

## References

- Language-specific reviewer guides: `references/rust.md`,
  `references/fsharp.md`, `references/csharp.md`, `references/python.md`,
  `references/typescript.md`, `references/ruby.md`, `references/java.md`,
  `references/kotlin.md`, `references/bash.md`, `references/sql.md`.
- Google Engineering Practices, Code Review:
  <https://google.github.io/eng-practices/review/>
- Google Engineering Practices, What to Look For:
  <https://google.github.io/eng-practices/review/reviewer/looking-for.html>
- GitHub Docs, Helping Others Review Your Changes:
  <https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/getting-started/helping-others-review-your-changes>
- GitHub Copilot Code Review Responsible Use:
  <https://docs.github.com/en/copilot/responsible-use/code-review>
- NIST DevSecOps, AI Validation Guidance:
  <https://pages.nist.gov/nccoe-devsecops/introduction.html>
