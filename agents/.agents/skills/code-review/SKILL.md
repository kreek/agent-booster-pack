---
name: code-review
description: Use to review diffs and PRs for bugs, regressions, edge cases, proof, and merge readiness.
---

# Code Review

## Iron Law

`FINDINGS FIRST. BLOCK ON CORRECTNESS, SAFETY, DATA LOSS, AND UNPROVEN CLAIMS; DO NOT BLOCK ON TASTE.`

## When to Use

- Self-review of your own implementation diff in the `workflow`
  completion loop before invoking `proof` or claiming done. Default for
  any non-trivial agent-generated change; a second pass by the same
  agent reliably surfaces bugs, dead code, and missed edge cases the
  implementation pass overlooks.
- Diff review (local, branch, or GitHub PR via `gh`).
- Review-comment follow-up on the user's own PRs.
- Agent-generated code review before merge or handoff.

## When NOT to Use

- Commit grouping or git history repair only; use `git-workflow`.
- A narrow domain-only review where a specialist skill is sufficient
  (`security`, `database`, `api`, `accessibility`).

## Core Ideas

1. Every review includes a security pass, even when the diff doesn't look
   security-focused.
2. Every non-trivial "looks fine" claim needs proof evidence or must be
   scoped as unproven.
3. Identify declared runtime and toolchain constraints (manifests, lockfiles,
   CI, framework versions, support policy) before applying language advice.
   Repository compatibility wins over language-reference defaults.
4. Duplication and dead code are review risks: they hide divergent behavior,
   stale invariants, unreachable branches, and untested paths. For removals
   and refactors, verify old paths were fully removed or intentionally
   preserved, and that callers reach the intended path.
5. AI-generated code is untrusted until behavior, tests, and
   security-sensitive paths are verified.
6. Maintainability findings are valid when complexity creates real risk:
   deep nesting, long functions, hidden mutable state, clever expressions,
   unnecessary indirection, or behavior scattered across unrelated places.
7. Simpler-looking code is not automatically simpler. Fewer files, shared
   helpers, or a new layer are findings when they couple concerns that change
   independently or hide state/effects from callers.
8. Complexity findings should name the concrete cost: hidden state,
   tangled effect, broad abstraction, dead compatibility shim, stale flag,
   duplicated rule with divergent meaning, or behavior split across
   unrelated lifecycles.

## Workflow

1. Resolve the review target. Local: `git diff`, `git diff --cached`, or
   `git diff <base>...HEAD`. GitHub: `gh pr view` for metadata,
   `gh pr diff --patch` for code, and `gh api graphql` for
   `reviewThreads` when thread state (resolved/outdated, path, line)
   matters.
2. Read the intent: what behavior, API, data shape, migration, UI, or
   workflow is supposed to change.
3. Load the language reference under `references/` for every language in
   the diff (`rust.md`, `fsharp.md`, `csharp.md`, `python.md`,
   `typescript.md`, `ruby.md`, `java.md`, `kotlin.md`, `bash.md`,
   `sql.md`). Defer recommendations incompatible with the repo's
   declared toolchain.
4. Load triggered domain skills as mandatory lenses. Always include a
   `security` pass for any auth, trust-boundary, input, dependency, secret,
   crypto, logging-redaction, or user-controlled-sink concern. Add others
   as triggered: `database`, `api`, `proof`, `domain-modeling`, `architecture`,
   `error-handling`, `async-systems`, `release`, `observability`,
   `ui-design`, `accessibility`, `documentation`, `performance`.
5. Sweep for harmful duplication, orphaned code, unreachable branches, dead
   feature flags, unused public surface, and stale tests/docs/config. For
   maintainability, ask what independent concerns the diff couples or
   separates, and whether simplification preserves behavior with evidence.
6. Don't review generated, vendored, or lockfile churn as if it were
   hand-written; sample only enough to detect obvious risk. If the diff
   is too large, review by risk area and state the partial scope.

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

Each finding includes: file/line or PR thread anchor, issue, impact, concrete
fix direction, and evidence or missing proof. Use questions only for
ambiguity that blocks a finding or fix.

| Severity | When to use |
|---|---|
| Critical | Exploitable security, data loss, broken auth, destructive migration, production outage risk |
| High | Incorrect behavior, broken contract, missing authorization, race, serious regression |
| Medium | Maintainability, error handling, observability, compatibility, or test gaps likely to cause defects |
| Low | Non-blocking clarity — skip unless asked |

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
- [ ] Coupling risks were checked: business logic mixed with I/O,
      transport, persistence, time, shared state, framework lifecycle,
      or unrelated feature behavior.
- [ ] Simplification claims were checked for preserved behavior, not only
      fewer files or fewer lines.
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
| "This is simpler because it has fewer files" | Check whether the diff couples independent behavior, data, effects, or lifecycles. | Generated or framework-required layout with no hand-written behavior. |
| "This compatibility shim is harmless" | Require owner, removal condition, and proof that callers still need it, or remove it in a proven refactor. | Public contract or migration policy explicitly requires it. |
| "I trust this author" | Review the diff with the same lenses; trust changes tone, not coverage. | Pair review where the same evidence was already inspected in this turn. |
| "Skip the security pass this once" | Run the security lens and name why it is or is not relevant. | Files are provably outside executable, config, dependency, and data surfaces. |
| Test re-encodes implementation: asserts substring in config/Makefile/manifest, deleted-file absence, trivial constants, or only that a mock was called | Flag as test theater. Recommend deletion or rewrite to assert behavior caused by the change. Load `proof` for the detailed test-theater taxonomy. | Asserted string is a public contract a downstream consumer parses, or the call itself is the contract (e.g. outbox writer). |

## Handoffs

- Use `whiteboarding` to compare the diff against the agreed RFC/ADR and
  catch plan-to-code divergence; missing or contradicted contracts are
  blocking findings.
- Use `security` for auth, trust boundaries, secrets, crypto,
  dependencies, or injection risks.
- Use `database` for migrations, locking, transactions, schema, indexes,
  or production data access.
- Use `proof` for review-claim proof obligations, test quality, missing
  behavior coverage, mocks, and flakes.
- Use `git-workflow` for branch mechanics and packaging accepted
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
