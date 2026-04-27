---
name: deployment
description: >-
  Use for deployment planning without mutating shared environments: CI/CD
  checks, approvals, rollback runbooks, release checklists, feature flags,
  canaries, and rollout coordination.
---

# Deployment Toil Reduction

## Iron Law

`REDUCE RELEASE TOIL; HUMANS MUTATE SHARED ENVIRONMENTS.`

No agent may approve, promote, deploy, roll back, change production flags, or
mutate shared environments. The skill exists to reduce release toil for the
accountable human operator: plans, checks, automation PRs, runbooks, risk
notes, and evidence.

## When to Use

- Reducing deployment toil through CI/CD checks, release checklists,
  approval gates, rollback runbooks, deploy notes, feature-flag plans,
  progressive-delivery guardrails, supply-chain gates, or migration
  rollout coordination.
- Designing safer deployment automation for a human to run.

## When NOT to Use

- Actually triggering deploys, rollbacks, promotions, manual
  approvals, production config changes, feature-flag flips, DNS
  changes, infrastructure applies, or other shared-environment
  mutations. Prepare the command/checklist and leave execution to a
  human operator.
- Local project bootstrap before deployment exists; use `scaffolding`.
- Database DDL/data safety itself; pair with `database`.
- Service monitoring and alert design; pair with `observability`.

## Core Ideas

1. Reduce toil by codifying repeatable checks, evidence collection,
   risk notes, and runbooks. Do not replace the accountable human
   release decision.
2. Build once; promote the same immutable artifact.
3. Fast feedback gates belong early; expensive confidence gates
   belong before a human deploy decision.
4. Rollback must be faster and more reliable than emergency
   fix-forward.
5. Database migrations deploy before incompatible code and contract
   after old code is gone.
6. Progressive delivery gates on user-visible health, not just
   pod/process health.
7. Feature flags need owner, expiry, safe default, cleanup, and a
   human-owned change path for production flips.
8. CI/CD credentials, actions, images, and artifacts are supply-chain
   surfaces.

## Workflow

1. Define the artifact, environments, human operator, promotion path,
   and merge gate. Put lint/type/test/security checks before merge
   where possible.
2. Separate preparation from execution. It is acceptable to edit CI,
   scripts, docs, manifests, dashboards-as-code, or PR text; it is not
   acceptable to run the command that mutates an environment.
3. Design rollback and rehearsal steps for production systems. Split
   migrations and feature flags into safe deploy phases.
4. Choose rolling, blue-green, canary, or manual approval based on
   blast radius. Add deployment verification, alert thresholds, and
   stop conditions for the human rollout.
5. Report the exact human-run steps separately from the agent-run
   validation, with risks and rollback evidence named.

## Verification

- [ ] No deploy, rollback, promotion, approval, production config,
      feature flag, DNS, infrastructure apply, or shared-environment
      mutation was executed by the agent.
- [ ] Human-run release steps are clearly separated from agent-run
      checks, and the accountable human/operator is named when known.
- [ ] One artifact is built and promoted; production does not rebuild
      from source.
- [ ] Merge gates run the repo's canonical lint, typecheck, test, and
      security checks.
- [ ] Rollback path is documented and recently rehearsed for production
      systems.
- [ ] Migration rollout is split into expand/backfill/switch/contract
      where needed.
- [ ] Progressive delivery gates on error rate and latency, not only
      readiness.
- [ ] Feature flags have owner, expiry, cleanup issue, and safe
      default-on-failure.
- [ ] CI credentials use least privilege; third-party actions/images
      are pinned.
- [ ] Release notes or PR body name deploy risk and rollback.

## Tripwires

| Trigger | Do this instead | False alarm |
|---|---|---|
| "I'll run the deploy/rollback/approval now" | Stop. Prepare the command, checklist, evidence, and rollback path for a human operator. | None for production or shared environments. |
| "This is just staging" | Treat shared staging as an environment mutation; ask a human to trigger it unless the user explicitly granted this exact non-production action. | Local-only disposable environment owned by this working tree. |
| "I'll flip the flag to verify" | Document the flag state, safe default, rollout steps, and verification; leave the flip to a human. | Pure local test flag with no shared service. |
| "Rollback is just `git revert`" | Name the rollback path for data, caches, config, and external side effects. | Code-only change with no persisted state or external side effect. |
| "Low-traffic window, skip canary" | Keep the canary or name the equivalent progressive gate. | Non-production environment with no real users. |
| "Feature flag default-on at launch" | Default off, ramp deliberately, and define fail-safe behavior. | Kill-switch flag guarding an already-on behavior. |
| "Config change isn't a deploy" | Apply the same gates, observability, and rollback note. | Local development config excluded from release. |
| "We can hotfix forward" | Document rollback or disable path before shipping. | User explicitly asks for emergency mitigation and risk is named. |
| "Flag is temporary" | Add owner, expiry, and cleanup work now. | One-shot migration flag removed in the same change. |

## Risk Tier

For prototypes or non-production systems, keep the same shape but
record which production checks are intentionally deferred and what
must happen before first real users. Shared environments still require
an explicit human trigger unless the user grants a narrow action.

## Handoffs

- Use `database` for migration mechanics and lock/backfill risk.
- Use `observability` for rollout metrics, dashboards, alerts, and
  runbooks.
- Use `security` for CI credentials, artifact signing, SBOMs, and
  dependency trust.
- Use `versioning` for the version bump, CHANGELOG entry, and tag that
  precedes release preparation. Deployment owns toil reduction around
  rollout planning; a human owns the actual rollout.

## References

- DORA metrics: <https://dora.dev/guides/dora-metrics/>
- Trunk-based development:
  <https://trunkbaseddevelopment.com/continuous-delivery/>
- OpenFeature: <https://openfeature.dev/>
