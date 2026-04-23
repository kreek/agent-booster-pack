---
name: deployment-and-cicd
description: Use when designing a CI/CD pipeline, adding a deployment stage, implementing rollback strategies, using feature flags, choosing between blue-green and canary deployments, coordinating database migrations with code deploys, or discussing progressive delivery. Also use when the user mentions Flagger, Argo Rollouts, OpenFeature, or error-budget-driven releases.
---

# Deployment and CI/CD

## Pipeline Stages and Immutable Artifact Promotion

Build once, promote the same artifact through environments. Never rebuild for staging or production.

```
Code push
  → Build & unit test          (fail fast: <5 min)
  → Build container image      (tag with git SHA)
  → Integration tests          (<10 min)
  → Push to registry
  → Deploy to staging          (same image)
  → Smoke tests on staging
  → Deploy to production       (same image, promoted)
```

**Immutable images:** the production image is exactly what ran in staging. No "rebuild for prod" steps. The SHA is the identity.

**Fast-feedback budget:**
- PR/unit suite: <5 minutes. If it exceeds this, developers stop waiting for it.
- Full integration suite: <15 minutes.
- If suites are slow: parallelise, split by domain, cache aggressively.

---

## Rollback Must Be Faster Than Fix-Forward

Design for rollback from the start. The decision tree in an incident:
- Can we roll back in < 5 minutes? → Roll back.
- Can we fix forward in < 15 minutes? → Fix forward.
- Otherwise → engage incident commander, page SRE.

**Making rollback fast:**
- Container-based deploys: re-tag the previous image and redeploy (< 2 min with pre-pulled images).
- Feature flags: toggle the flag off. The fastest "rollback" — no deploy needed.
- Blue-green: switch the load balancer back to the blue environment (< 30 seconds).

**Game-day quarterly:** practice rollback on a non-critical day. Rollback that hasn't been rehearsed fails under pressure.

---

## Database Migrations Before Code

The migration must be deployed before the code that requires the new schema. The reverse is a production outage.

**Safe deploy order:**
1. Deploy migration (expand phase only — additive changes).
2. Deploy new code (reads new schema, falls back to old if needed).
3. Deploy migration (contract phase — remove old schema) after old code is gone.

**Never deploy migration and code in the same release** if the migration drops or renames columns. The window between old code and new code reading the schema will cause errors.

See `database-safety` skill for expand-contract migration details.

---

## Blue-Green vs Canary

| Strategy | How | Rollback | Best for |
|---|---|---|---|
| **Blue-green** | Run two identical envs; switch LB from blue to green | Switch LB back (seconds) | Low-risk releases where instant rollback is critical |
| **Canary** | Route N% of traffic to new version; increase incrementally | Reduce N% to 0 | High-risk releases; catching issues before full rollout |
| **Feature flag** | Ship code, disable feature | Toggle flag | Changes where you want business control over rollout |
| **Shadow** | Duplicate traffic to new version; don't serve its responses | N/A | Testing new version under real load without risk |

**Progressive delivery with Flagger/Argo Rollouts:**
- Automate canary analysis with statistical significance.
- Promote or roll back based on error rate and latency metrics.
- Configures Prometheus/Datadog queries to gate promotion.

```yaml
# Flagger example
analysis:
  interval: 1m
  threshold: 5
  maxWeight: 50
  stepWeight: 5
  metrics:
  - name: request-success-rate
    threshold: 99
    interval: 1m
  - name: request-duration
    threshold: 500  # p99 ms
    interval: 1m
```

---

## Feature Flags

Feature flags separate deploy from release. Ship code dark, enable features for specific users or cohorts, roll back without a deployment.

**Every feature flag must have:**
- **Owner:** who decides when to flip it.
- **Expiry date:** when the flag will be cleaned up. Default 90 days.
- **Cleanup ticket:** created at flag creation. Technical debt is the enemy of flags.
- **Default:** what happens when the flag service is unavailable.

**Flag categories:**
| Type | Audience | Lifetime |
|---|---|---|
| Release flags | % of users or internal users | Short (days–weeks) |
| Experiment flags | A/B test cohorts | Short (weeks) |
| Ops flags | Kill switches, circuit breakers | Medium (months) |
| Permission flags | User tiers, beta access | Long (permanent) |

Use the **OpenFeature specification** for provider-agnostic flag evaluation. Implementations: LaunchDarkly, Flagsmith, Unleash, GrowthBook.

**Avoid flag spaghetti:** more than 5 flags active in the same code path makes the logic unreadable. Flags that interact must be documented explicitly.

---

## Error-Budget-Driven Release Gates

If your SLO error budget is below a threshold, pause releases until it recovers.

```
If error budget remaining < 50% → only critical bug fixes can release
If error budget remaining < 10% → feature freeze; SRE approval required
If error budget remaining > 90% → normal release cadence
```

This aligns incentives: teams that want to ship features must maintain reliability. Reliability is not a separate team's job.

Implement as a CI gate: query your SLO metrics before deploying to production. Block the pipeline if the error budget is too low.

---

## CI Pipeline Security

- **Pin all actions to SHA**, not tag: `uses: actions/checkout@abc123` not `@v3`. Tags are mutable.
- **Minimal permissions per job:** `permissions: contents: read` by default; grant write only where needed.
- **OIDC for cloud auth:** use `id-token: write` permission to exchange the GitHub token for cloud credentials. No static secrets stored in GitHub.
- **Secret scanning:** run Gitleaks or `git-secrets` in CI. Block if secrets detected.
- **SBOM generation at build time:** run `syft` or `cdxgen` and upload as a pipeline artifact.
- **Sign container images with Sigstore/cosign** (keyless mode in CI is free and easy).
