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

A review is evidence-based risk reduction. A comment is useful only when it
names a concrete defect, the impact, and the change that would remove the risk.

## When to Use

- Local code review of unstaged, staged, branch, or patch diffs.
- GitHub PR review through `gh`, including diff, checks, comments, and requested
  changes.
- Review-comment follow-up on the user's own PRs.
- Agent-generated code review before merge or handoff.

## When NOT to Use

- Commit grouping only; use `commit`.
- Git history repair, rebases, conflicts, or force-push decisions; use `git`.
- A narrow domain-only review where a specialist skill is sufficient, such as
  `security`, `database`, `api`, or `accessibility`.

## Core Ideas

1. Review the changed behavior, not just the changed lines.
2. Findings must be reproducible from the diff, surrounding code, tests, or
   documented contract.
3. Safety and correctness outrank maintainability; maintainability outranks
   style.
4. Every review includes a security pass, even when the diff does not look
   security-focused.
5. Every non-trivial “looks fine” claim needs proof evidence or must be scoped
   as unproven.
6. Use domain skills as mandatory lenses when their risk appears.
7. Duplication and dead code are review risks when they can hide divergent
   behavior, stale invariants, unreachable branches, or untested paths.
8. Review comments should be sparse, specific, and actionable.
9. AI-generated code is untrusted until behavior, tests, and security-sensitive
   paths are verified.

## Workflow

1. Resolve the review target.
   - Local: inspect `git status --short`, `git diff --stat`, and the relevant
     unstaged, staged, or branch diff.
   - GitHub: use `gh auth status`, then `gh pr view` and `gh pr diff` for the
     target PR.
2. Identify the intent: what behavior, API, data shape, migration, UI, or
   workflow is supposed to change.
3. Read enough surrounding code to understand call sites, invariants, ownership,
   and existing conventions.
4. Load specialist skills for triggered risks. Always include a security pass;
   load `security` for any auth, trust-boundary, input, dependency, secret,
   cryptography, logging-redaction, or user-controlled sink concern. Load other
   domain skills as needed: `database`, `api`, `tests`, `proof`, `data`,
   `error-handling`, `concurrency`, `resilience`, `deployment`, `observability`,
   `frontend`, `accessibility`, `docs`, `performance`, `cache`, or `realtime`.
5. Identify the language(s) in the diff and load the matching reference under
   `references/` (`rust.md`, `fsharp.md`, `csharp.md`, `python.md`,
   `node-typescript.md`, `ruby.md`, `java.md`, `kotlin.md`, `bash.md`,
   `sql.md`). Apply its tooling-passing checks and high-signal defect list
   before generic correctness review. If the diff touches multiple languages,
   load every matching reference.
6. Check correctness, data integrity, security, error handling, tests,
   observability, compatibility, performance, and maintainability in that order.
7. For the security pass, check secrets, auth/authz, input validation, output
   encoding, unsafe SQL/shell/HTML/SSRF/deserialization sinks, dependency or
   build changes, and logging/error disclosure.
8. Check for harmful duplication, orphaned code, unreachable branches, dead
   feature flags, unused public surface, and stale tests/docs/config. For
   removals and refactors, verify old paths were fully removed or intentionally
   preserved, and that callers now reach the intended path.
9. Classify findings by severity and merge risk.
10. Report findings first. If none are found, say that clearly and name residual
    risk or missing verification.

## Local Review

- Prefer `git diff --cached` for staged review, `git diff` for working-tree
  review, and `git diff <base>...HEAD` for branch review.
- Use `git diff --check` to catch whitespace and conflict-marker issues.
- Inspect new tests and the tests that should have changed but did not.
- When code was removed or refactored, search for leftover call sites,
  duplicated implementations, stale adapters, unused exports, dead
  routes/jobs/handlers, and tests that still exercise the retired path.
- Do not review generated, vendored, lockfile, or formatting-only churn as if it
  were hand-written code; sample only enough to detect obvious risk.
- If the diff is too large, review by risk area and state the partial scope.

## GitHub PR Review

- Run `gh` commands with network access.
- Resolve the PR from the URL, explicit number, or current branch with
  `gh pr view --json number,url,author,headRefName,baseRefName`.
- Gather metadata with
  `gh pr view --json title,body,author,isDraft,reviewDecision,mergeStateStatus,statusCheckRollup,comments`.
- Review code with `gh pr diff --patch`.
- When review-thread state matters, use `gh api graphql` to fetch
  `reviewThreads` with `isResolved`, `isOutdated`, path, line, and comments.
- Treat flat PR comments as incomplete for requested-change follow-up because
  they can lose thread state and inline anchors.

## Addressing Review Feedback

- Only address review feedback locally when the PR is the user's own PR or the
  user explicitly asks to modify it.
- Separate actionable requested changes from discussion, approvals, duplicates,
  resolved threads, and outdated threads.
- Cluster comments by behavior or file, then fix the smallest coherent set.
- If a comment asks for explanation rather than code, draft a reply instead of
  forcing a code change.
- Do not post comments, submit reviews, resolve threads, or push fixes unless
  the user explicitly asks for that GitHub write.
- If comments conflict or imply a behavior regression, stop and surface the
  tradeoff.

## Finding Format

Lead with findings, ordered by severity:

- `Critical`: exploitable security issue, data loss, broken auth, destructive
  migration, or production outage risk.
- `High`: incorrect behavior, broken contract, missing authorization, race,
  serious regression, or untested risky path.
- `Medium`: maintainability, error handling, observability, compatibility, or
  test gap likely to cause future defects.
- `Low`: non-blocking clarity issue. Avoid low-value nits unless the user asks.

Each finding should include:

- file and line, or PR thread anchor
- issue
- impact
- concrete fix direction
- evidence or missing proof

Use questions only for ambiguity that blocks a finding or fix. Put summaries
after findings, not before.

## Verification

- [ ] Review target and base were identified.
- [ ] Diff and enough surrounding context were read.
- [ ] A security pass checked secrets, auth/authz, input handling, unsafe sinks,
      dependencies, and logging/error disclosure.
- [ ] Duplication and dead-code risks were checked, especially for removals,
      refactors, renamed paths, feature flags, routes, jobs, exports, and tests.
- [ ] Triggered domain skills were used and named.
- [ ] Language reference(s) under `code-review/references/` were loaded for every
      language touched by the diff, and their tooling-gates were checked.
- [ ] Findings are ordered by severity and grounded in file/line or PR thread
      anchors.
- [ ] Each blocking finding explains impact and fix direction.
- [ ] Test, build, CI, or proof evidence was checked, or missing evidence was
      reported as unproven.
- [ ] GitHub writes were not performed without explicit user request.
- [ ] If no issues were found, residual risk and unreviewed scope were named.

## Handoffs

- Use `security` for auth, trust boundaries, secrets, crypto, dependencies, or
  injection risks.
- Use `database` for migrations, locking, transactions, schema, indexes, or
  production data access.
- Use `proof` when review claims need explicit proof obligations.
- Use `tests` for test quality, missing behavior coverage, mocks, or flakes.
- Use `git` for branch mechanics and `commit` for packaging accepted fixes.

## References

- Language-specific reviewer guides (load whichever language(s) appear in the
  diff): `references/rust.md`, `references/fsharp.md`, `references/csharp.md`,
  `references/python.md`, `references/node-typescript.md`,
  `references/ruby.md`, `references/java.md`, `references/kotlin.md`,
  `references/bash.md`, `references/sql.md`.
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
