---
name: code-review
description: Use to review diffs and PRs for bugs, regressions, edge cases, proof, and merge readiness.
---

# Code Review

## Iron Law

`FINDINGS FIRST. BLOCK ON CORRECTNESS, SAFETY, DATA LOSS, AND UNPROVEN CLAIMS`

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
   security-sensitive paths are verified. The patterned failures are
   enumerated under AI-Agent Failure Modes.
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

## AI-Agent Failure Modes

Agent-generated diffs fail in patterned ways. Treat each as a blocking
finding unless the diff names a real caller, requirement, or removal
condition. Blocking means the done or merge claim is blocked and the
finding is surfaced to the user, not that the review loops internally:
make one pass, list findings, hand back. Do not re-review after fixing
unless the user asks.

1. **Speculative abstraction.** New interface, factory, generic, strategy,
   wrapper, or config knob with fewer than two real callers in this or a
   queued diff. Inline or delete.
2. **Unnecessary backwards compatibility.** Deprecated alias, old-name
   shim, or compatibility branch lacking (a) a named caller that needs
   it, (b) a removal trigger, and (c) an owner. Concentrate at a single
   translation boundary or remove. Approval of a new name or shape is
   not approval to keep the old one.
3. **Dead defensive code.** Guard, sentinel, try/except, fallback, or
   default-return covering a state no in-scope caller produces. Convert
   to a boundary assertion or remove. Swallowed exceptions and silent
   fallbacks are data-loss risk, not robustness.
4. **Test theater.** Assertions of `mock.was_called` without an
   observable side effect, return value, or persisted state; assertions
   against the implementation's own constants, regex, or string literals
   imported from the module under test; snapshot updates without a
   behavior-change reason; suites that survive a one-assertion or
   one-branch mutation. Rewrite to assert user-visible behavior at the
   data-shape boundary (see `proof`).
5. **Fabricated API.** Imported symbol, method, parameter, framework
   feature, or CLI flag the type checker, language server, or installed
   package cannot resolve. Block until resolved against the declared
   toolchain.
6. **Scope creep.** Requested change bundled with reformatting, import
   reordering, unrelated docstrings, or speculative refactors. Require a
   split before deep review.
7. **Refactor drift.** Diff labeled refactor or cleanup but observable
   return, effect, error shape, or ordering changes. Reclassify as a
   feature change and route to `proof`.

## Workflow

1. Resolve the review target. Local: `git diff`, `git diff --cached`, or
   `git diff <base>...HEAD`. GitHub: `gh pr view` for metadata,
   `gh pr diff --patch` for code, and `gh api graphql` for
   `reviewThreads` when thread state (resolved/outdated, path, line)
   matters.
2. Pre-flight before deep review. Note CI status: green, red and scope
   the review as unproven and surface the failing check, or not yet run
   and review can still proceed. Confirm the diff's intent and impact
   are stated: in self-review the task context is the intent, in PR or
   inbound review a missing description on a non-trivial diff is itself
   a finding. For diffs above roughly 400 changed lines, sweep by risk
   area and declare partial scope explicitly. This is a one-time gate,
   not a loop: run it once per review pass.
3. Read the intent: what behavior, API, data shape, migration, UI, or
   workflow is supposed to change.
4. Load the language reference under `references/` for every language in
   the diff (`rust.md`, `fsharp.md`, `csharp.md`, `python.md`,
   `typescript.md`, `ruby.md`, `java.md`, `kotlin.md`, `bash.md`,
   `sql.md`). Defer recommendations incompatible with the repo's
   declared toolchain.
5. Load triggered domain skills as mandatory lenses. Always include a
   `security` pass for any auth, trust-boundary, input, dependency, secret,
   crypto, logging-redaction, or user-controlled-sink concern. Add others
   as triggered: `database`, `api`, `proof`, `domain-modeling`, `architecture`,
   `error-handling`, `async-systems`, `observability`, `ui-design`,
   `accessibility`, `documentation`, `performance`. Use `release` here only
   when the concrete diff contains version/changelog/package/CI/publish
   artifacts, feature flags, migrations with rollout implications, or the user
   asked for release readiness; do not load it just because early planning
   mentioned possible future release risk.
6. Run the AI-Agent Failure Modes pass on every agent-generated diff.
   Name each blocking finding by its mode (speculative abstraction,
   compatibility shim, dead defensive code, test theater, fabricated
   API, scope creep, refactor drift).
7. Sweep for harmful duplication, orphaned code, unreachable branches, dead
   feature flags, unused public surface, and stale tests/docs/config. For
   maintainability, ask what independent concerns the diff couples or
   separates, and whether simplification preserves behavior with evidence.
8. Don't review generated, vendored, or lockfile churn as if it were
   hand-written; sample only enough to detect obvious risk.

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
| Low | Non-blocking clarity, skip unless asked |

## Verification

- [ ] Declared runtime, dependency, framework, and tooling constraints
      were checked before applying language-reference guidance.
- [ ] A security pass checked secrets, auth/authz, input handling,
      unsafe sinks, dependencies, and logging/error disclosure.
- [ ] Duplication and dead-code risks were checked, especially for
      removals, refactors, renames, feature flags, routes, jobs,
      exports, and tests.
- [ ] AI-Agent Failure Modes were checked: speculative abstraction,
      unnecessary backwards compatibility, dead defensive code, test
      theater, fabricated APIs, scope creep, and refactor drift.
- [ ] Pre-flight was confirmed: CI green or scoped unproven, description
      states intent and impact, and oversized diffs were scoped as
      partial review.
- [ ] Complexity risks were checked: deep nesting, oversized functions,
      hidden mutable state, clever code, and unnecessary indirection.
- [ ] Coupling risks were checked: business logic mixed with I/O,
      transport, persistence, time, shared state, framework lifecycle,
      or unrelated feature behavior.
- [ ] Simplification claims were checked for preserved behavior, not only
      fewer files or fewer lines.
- [ ] Triggered domain skills and language reference(s) were loaded and
      named; `release` was loaded only for concrete release artifacts,
      rollout obligations, or explicit release-readiness review.
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
| "This might need a release later" | Note the risk without loading `release`; load `release` only when the diff has release artifacts/rollout obligations or the user asked for release readiness. | The review target is explicitly a release PR or includes version/changelog/package/publish/migration rollout files. |
| "Style nits are blocking" | Separate style notes from correctness, security, and maintainability findings. | Style issue hides a real ambiguity or risky control flow. |
| "This is simpler because it has fewer files" | Check whether the diff couples independent behavior, data, effects, or lifecycles. | Generated or framework-required layout with no hand-written behavior. |
| "This compatibility shim is harmless" | Require owner, removal condition, and proof that callers still need it, or remove it in a proven refactor. | Public contract or migration policy explicitly requires it. |
| "I trust this author" | Review the diff with the same lenses; trust changes tone, not coverage. | Pair review where the same evidence was already inspected in this turn. |
| "Skip the security pass this once" | Run the security lens and name why it is or is not relevant. | Files are provably outside executable, config, dependency, and data surfaces. |
| Test re-encodes implementation: asserts substring in config/Makefile/manifest, deleted-file absence, trivial constants, or only that a mock was called | Flag as test theater. Recommend deletion or rewrite to assert behavior caused by the change. Load `proof` for the detailed test-theater taxonomy. | Asserted string is a public contract a downstream consumer parses, or the call itself is the contract (e.g. outbox writer). |
| New interface, factory, generic, wrapper, or config knob with fewer than two real callers | Block. Demand inlining or deletion until a second real caller exists. | Boundary required by an external contract, public API, or documented extension point. |
| Guard, try/except, fallback, or default-return for a state no in-scope caller produces | Block. Remove or convert to a boundary assertion. | Documented invariant whose violation must surface as a tracked error. |
| Diff labeled refactor or cleanup but observable return, effect, error, or ordering changes | Reclassify as feature change and route to `proof`. | Behavior delta is the documented intent of the refactor. |
| By inspection, the test suite would still pass if one assertion or one branch were flipped | Mark as test theater. Recommend rewriting to assert user-visible behavior at the data-shape boundary. Do not run mutation tooling unless the project already uses it. | Mutated branch is defensive code already known to be unreachable. |
| PR bundles requested change with reformatting, import reordering, or unrelated docstrings | Require a split before deep review. | Reorganization itself is the requested change. |

## Handoffs

- Use `specify` to compare the diff against the agreed ADR, RFC, tech spec,
  or note and catch plan-to-code divergence; missing or contradicted contracts
  are blocking findings.
- Use `security` for auth, trust boundaries, secrets, crypto,
  dependencies, or injection risks.
- Use `database` for migrations, locking, transactions, schema, indexes,
  or production data access.
- Use `release` after the diff exists when version/changelog/package/publish
  artifacts, feature flags, rollout plans, or migration rollout obligations
  need release-readiness review.
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
- Sentry, Reviewing AI-Generated Code:
  <https://develop.sentry.dev/sdk/getting-started/playbooks/development/reviewing-ai-generated-code/>
- Conventional Comments:
  <https://conventionalcomments.org/>
