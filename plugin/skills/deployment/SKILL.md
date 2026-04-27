---
name: deployment
description:
  Use when designing a CI/CD pipeline, adding a deployment stage, implementing
  rollback strategies, using feature flags, choosing between blue-green and
  canary deployments, coordinating database migrations with code deploys, or
  discussing progressive delivery. Also use when the user mentions Flagger, Argo
  Rollouts, OpenFeature, or error-budget-driven releases.
---

# Deployment

## Iron Law

`NO PRODUCTION DEPLOY WITHOUT A TESTED ROLLBACK PATH.`

## When to Use

- CI/CD pipelines, build/test/release stages, deploy strategies,
  rollback, feature flags, progressive delivery, supply-chain gates,
  or migration rollout coordination.

## When NOT to Use

- Local project bootstrap before deployment exists; use `scaffolding`.
- Database DDL/data safety itself; pair with `database`.
- Service monitoring and alert design; pair with `observability`.

## Core Ideas

1. Build once; promote the same immutable artifact.
2. Fast feedback gates belong early; expensive confidence gates
   belong before deploy.
3. Rollback must be faster and more reliable than emergency
   fix-forward.
4. Database migrations deploy before incompatible code and contract
   after old code is gone.
5. Progressive delivery gates on user-visible health, not just
   pod/process health.
6. Feature flags need owner, expiry, safe default, and cleanup.
7. CI/CD credentials, actions, images, and artifacts are supply-chain
   surfaces.

## Workflow

1. Define the artifact, environments, promotion path, and merge gate.
   Put lint/type/test/security checks before merge where possible.
2. Design rollback and rehearse it for production systems. Split
   migrations and feature flags into safe deploy phases.
3. Choose rolling, blue-green, canary, or manual approval based on
   blast radius. Add deployment verification and alert thresholds
   before rollout.

## Verification

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
| "Rollback is just `git revert`" | Name the rollback path for data, caches, config, and external side effects. | Code-only change with no persisted state or external side effect. |
| "Low-traffic window, skip canary" | Keep the canary or name the equivalent progressive gate. | Non-production environment with no real users. |
| "Feature flag default-on at launch" | Default off, ramp deliberately, and define fail-safe behavior. | Kill-switch flag guarding an already-on behavior. |
| "Config change isn't a deploy" | Apply the same gates, observability, and rollback note. | Local development config excluded from release. |
| "We can hotfix forward" | Document rollback or disable path before shipping. | User explicitly asks for emergency mitigation and risk is named. |
| "Flag is temporary" | Add owner, expiry, and cleanup work now. | One-shot migration flag removed in the same change. |

## Risk Tier

For prototypes or non-production systems, keep the same shape but
record which production checks are intentionally deferred and what
must happen before first real users.

## Handoffs

- Use `database` for migration mechanics and lock/backfill risk.
- Use `observability` for rollout metrics, dashboards, alerts, and
  runbooks.
- Use `security` for CI credentials, artifact signing, SBOMs, and
  dependency trust.
- Use `versioning` for the version bump, CHANGELOG entry, and tag that
  precedes a release rollout: deployment owns what happens after the
  tag.

## References

- DORA metrics: <https://dora.dev/guides/dora-metrics/>
- Trunk-based development:
  <https://trunkbaseddevelopment.com/continuous-delivery/>
- OpenFeature: <https://openfeature.dev/>
