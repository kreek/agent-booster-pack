---
name: release
description: Late gate for release prep — SemVer, CHANGELOG, deprecations, tags, rollout/rollback. Load on diff or request.
---

# Release

## Iron Law

`BREAKING CHANGES BUMP MAJOR. HUMANS MUTATE SHARED ENVIRONMENTS.`

## When to Use

- The user explicitly asks for release prep, versioning, changelog work,
  deprecation/migration notes, release notes, tags, publish planning, rollout,
  or rollback planning.
- After implementation, during self-review or code review, a concrete diff
  includes release artifacts or rollout obligations: version manifests,
  `CHANGELOG.md`, package locks, plugin/package manifests, CI/CD gates,
  feature flags, migrations, or publish scripts.
- Reducing release/deployment toil through CI/CD checks, approval
  gates, rollout notes, rollback runbooks, feature-flag plans,
  progressive-delivery guardrails, supply-chain gates, or migration
  rollout coordination.

## When NOT to Use

- Starting ordinary implementation merely because a change might later need
  versioning, changelog, packaging, rollout, or npm/registry work. Note the
  release risk in `workflow`; invoke this skill after the diff exists, during
  code review, or when the user approves release prep.
- Actually triggering deploys, rollbacks, promotions, manual
  approvals, production config changes, feature-flag flips, DNS
  changes, infrastructure applies, or other shared-environment
  mutations. Prepare the command/checklist and leave execution to a
  human operator.
- Internal refactors with no caller-visible impact; use
  `refactoring`.
- Local project bootstrap before release/deployment exists; use
  `scaffolding`.
- Database DDL/data safety itself; pair with `database`.
- Service monitoring and alert design; pair with `observability`.

## Core Ideas

1. Identify the release unit before classifying: one library, one CLI,
   one plugin manifest, one container, one meta-package, or a lockstep
   package set. Monorepos often contain several independent release
   units.
2. Identify the public surface before classifying: library symbols,
   HTTP/RPC contracts, CLI flags, env/config keys, plugin manifests,
   package manifests, dependency ranges, release artifacts, and
   documented behavior.
3. Compatibility changes use the highest required bump for the release
   unit: breaking changes are major, compatible additions are minor,
   fixes/docs are patch.
4. Bump only artifacts whose user-visible payload, manifest, dependency
   range, bundled dependency set, or plugin metadata changes. Lockstep
   bumps require explicit repo policy or user approval.
5. Registry state is release input. Check the latest published versions,
   existing tags, dependency ranges, lockfiles, and package manager
   resolution before choosing target versions.
6. Every deprecation ships in a minor with a removal version and a
   migration path.
7. CHANGELOG entries describe what users notice when they upgrade, not
   what `git log` already says.
8. Manifest version, lockfile when committed, CHANGELOG release header,
   tag, and publish plan agree.
9. Release preparation and release execution are separate. Agents
   prepare classification, notes, checks, runbooks, and evidence;
   humans approve, promote, deploy, roll back, change flags, and
   mutate shared environments.
10. Release is usually a late gate. At task start, `workflow` may name release
    risk, but this skill should usually run after implementation when a diff,
    migration, package manifest, or rollout plan exists to inspect.
11. Release intent is separate from implementation intent. A request to
    implement, rename, or approve an interface is not permission to bump
    versions, edit changelogs, mutate package lockfiles for release, create
    tags, publish packages, or check registries unless release prep was
    explicitly requested or approved.
12. Rollback must be faster and more reliable than emergency
    fix-forward.
13. Feature flags need owner, expiry, safe default, cleanup, and a
    human-owned production change path.

## Classification

| Bump | Trigger |
|---|---|
| major | Removing/renaming public surface; changing return/error/status shape; adding required inputs; tightening accepted inputs; reversing a documented invariant; any change requiring existing users to change code or accept different semantics. |
| minor | Adding optional public surface existing users can ignore; loosening constraints; adding non-exhaustive error variants; marking something deprecated. |
| patch | Bug fixes restoring documented behavior; performance improvements; docs/build/internal changes with no public-surface impact. |

## Workflow

1. Confirm this skill should run now. If the work is still at startup and the
   user did not ask for release prep or rollout planning, return to `workflow`
   with release risk noted but deferred. If a concrete diff exists or the user
   approved release prep, continue.
2. Confirm release intent before release-prep mutations. Ask whether the
   current task is code/docs only; version/changelog/lockfile updates;
   release notes; or human-run tag/publish steps. If release prep was not
   approved, do not edit release artifacts just because implementation or
   validation surfaced them.
3. Map release units and versioning policy. Read manifests, lockfiles,
   workspace config, release scripts, changelog, tags, and packaging
   docs. For package publishes, query the registry for current versions
   and dependency metadata before proposing target versions.
4. Identify touched public surfaces for each release unit and classify
   the release impact. Default to the higher plausible bump when
   compatibility is unclear.
5. Decide the target version per release unit. In monorepos, do not
   assume sibling packages share a version stream. Meta-packages usually
   bump when their manifest, dependency ranges, bundled set, or plugin
   resource paths change, even if the dependency packages do not.
6. Check release automation before running it. If a script bumps more
   artifacts than the chosen release units, do not run or patch it inside
   the release unless the user explicitly approves that separate tooling
   change.
7. Update selected manifests, committed lockfiles, changelog entry,
   and tag plan together only after release-prep scope is approved. Add
   deprecation warning, removal version, and migration note where applicable;
   for deprecation/migration/removal/sunset work, load
   `references/deprecation-and-migration.md`.
8. Validate packaging before tagging: dry-run pack/build where
   available, confirm dependency ranges resolve, name the human
   publish order.
9. Define artifact, environments, human operator, promotion path, and
   merge gates. Lint/type/test/security run before merge where
   possible.
10. Design rollback and rehearsal. Split migrations and feature flags
    into safe deploy phases.
11. Report human-run release steps separately from agent-run
    validation, naming risks, rollout gates, and rollback evidence.

## Verification

- [ ] **Timing**: this skill ran because the user asked for release prep,
      rollout planning, or a concrete diff/review surfaced release artifacts;
      it was not loaded for ordinary startup routing.
- [ ] **Intent**: release prep scope was explicitly approved before
      version, changelog, lockfile, tag, publish-plan, or registry-check work;
      implementation approval was not treated as release approval.
- [ ] **Classification**: release unit(s) and versioning policy
      identified before any manifest edit, script edit, commit, or
      tag; bump matches the classification table; ambiguous cases
      erred higher; only artifacts in the chosen release unit(s) were
      bumped (lockstep bumps backed by repo policy or user approval).
- [ ] **Artifact consistency**: registry/latest versions, existing
      tags, dependency metadata, and committed lockfiles checked or
      explicitly marked unavailable; manifest versions, lockfiles,
      CHANGELOG release header, tag plan, and publish plan all agree;
      CHANGELOG entry is user-observable and in the right section.
- [ ] **Packaging proof**: packaging dry-run/build/check ran where
      available before tagging, or the blocker is named; dependency
      ranges resolve to published artifacts or to a named human-owned
      publish order; every breaking change has a migration note;
      every deprecation names a removal version using the
      language-native primitive where available.
- [ ] **Human execution boundary**: no deploy, rollback, promotion,
      approval, production config, feature flag, DNS, infrastructure
      apply, or shared-environment mutation was executed by the agent;
      human-run release steps are clearly separated from agent-run
      checks.
- [ ] **Gates / rollback / flags**: merge gates run the repo's
      canonical lint, typecheck, test, and security checks; rollback
      path is documented and migration rollout is split into
      expand/backfill/switch/contract where needed; feature flags have
      owner, expiry, cleanup issue, and safe default-on-failure.

## Tripwires

| Trigger | Do this instead | False alarm |
|---|---|---|
| "I'll run the deploy/rollback/approval now" | Stop. Prepare the command, checklist, evidence, and rollback path for a human operator. | None for production or shared environments. |
| "Use the release script to bump everything" | First prove the script's scope matches the intended release units; otherwise propose a manual targeted bump or a separate tooling change. | Repo policy explicitly says all artifacts are lockstep and the user approved that release shape. |
| "The implementation might touch a public package/command" | Stay in `workflow`; note release risk and defer this skill until the diff exists or release prep is approved. | The user explicitly asked for release prep or rollout planning. |
| "The implementation touched a public package/command, so I'll bump versions now" | Ask whether release prep is in scope before editing manifests, changelogs, lockfiles, tags, or publish plans. | The user explicitly asked for release prep in the same task. |
| "npm install changed the lockfile while I was validating" | Stop and ask whether to keep release/package-manager changes or revert them. | The approved task is package maintenance or lockfile repair. |
| "It's a monorepo, so one version" | Map package/version streams from manifests, tags, registry, and docs before choosing versions. | The repo has an explicit single-version policy for this artifact set. |
| "The package exists locally" | Check whether it is published, what version is latest, and whether dependency ranges can resolve. | Local-only package never intended for registry resolution. |
| "Only package.json changed" | Also check committed lockfiles, bundled dependencies, plugin manifests, resource paths, tarball contents, and publish order. | The package manager has no committed lockfile and no generated package metadata. |
| "Tag now and fix details later" | Validate manifests, dependency resolution, dry-run packaging, changelog, and publish order before creating the tag. | Disposable local rehearsal tag that will not be pushed and is clearly named as such. |
| "This is just staging" | Treat shared staging as an environment mutation; ask a human to trigger it unless the user explicitly granted this exact non-production action. | Local-only disposable environment owned by this working tree. |
| "I'll flip the flag to verify" | Document the flag state, safe default, rollout steps, and verification; leave the flip to a human. | Pure local test flag with no shared service. |
| "Rollback is just `git revert`" | Name the rollback path for data, caches, config, and external side effects. | Code-only change with no persisted state or external side effect. |
| "Low-traffic window, skip canary" | Keep the canary or name the equivalent progressive gate. | Non-production environment with no real users. |
| "Feature flag default-on at launch" | Default off, ramp deliberately, and define fail-safe behavior. | Kill-switch flag guarding an already-on behavior. |
| "Config change isn't a deploy" | Apply the same gates, observability, and rollback note. | Local development config excluded from release. |
| "We can hotfix forward" | Document rollback or disable path before shipping. | User explicitly asks for emergency mitigation and risk is named. |
| "Flag is temporary" | Add owner, expiry, and cleanup work now. | One-shot migration flag removed in the same change. |

## Handoffs

- Use `api` for HTTP API compatibility design, URL/header versioning,
  `Sunset`, and `Deprecation` headers.
- Use `database` for migration mechanics and lock/backfill risk.
- Use `observability` for rollout metrics, dashboards, alerts, and
  runbooks.
- Use `security` for CI credentials, artifact signing, SBOMs, and
  dependency trust.
- Use `git-workflow` for splitting version/release commits cleanly.
- Use `documentation` for migration guides and reference docs.

## References

- Deprecation and migration: `references/deprecation-and-migration.md`.
- Semantic Versioning 2.0.0: <https://semver.org>
- Keep a Changelog: <https://keepachangelog.com>
- Conventional Commits: <https://www.conventionalcommits.org>
- DORA metrics: <https://dora.dev/guides/dora-metrics/>
- Trunk-based development:
  <https://trunkbaseddevelopment.com/continuous-delivery/>
- OpenFeature: <https://openfeature.dev/>
- RFC 8594 / 9745 (HTTP `Sunset` and `Deprecation`):
  <https://datatracker.ietf.org/doc/html/rfc8594> ·
  <https://datatracker.ietf.org/doc/html/rfc9745>
