---
name: release
description: Use only on request/approval for release prep, or when validation requires release artifact sync.
---

# Release

## Iron Law

`BREAKING CHANGES BUMP MAJOR. AGENTS PREPARE RELEASES; HUMANS MUTATE SHARED ENVIRONMENTS.`

## When to Use

- The user explicitly asks for release prep, versioning, changelog work,
  release notes, tags, publish planning, rollout, rollback, deprecation, or
  migration notes.
- The user approves release prep after a concrete diff exposes release
  artifacts or rollout obligations: manifests, `CHANGELOG.md`, package locks,
  plugin/package metadata, CI/CD gates, feature flags, migrations, publish
  scripts, or rollout plans.
- A repo validator requires release artifact sync for an already-approved
  change.

## When NOT to Use

- Starting implementation because a change might later need versioning,
  changelog, packaging, registry, rollout, or deployment work. Note release risk
  in `workflow` and ask only at the concrete release-prep decision point.
- Triggering deploys, rollbacks, promotions, approvals, production config
  changes, feature-flag flips, DNS changes, infrastructure applies, or other
  shared-environment mutations. Prepare the command/checklist for a human.
- Internal refactors with no caller-visible impact; use
  `refactoring`.
- Local project bootstrap before release/deployment exists; use
  `scaffolding`.
- Database DDL/data safety itself; pair with `database`.
- Service monitoring and alert design; pair with `observability`.

## Core Ideas

1. Release is a late gate. Implementation approval is not release approval.
   Load this skill only after user request, user approval, or a required
   validator sync.
2. Release classification starts with the release unit and public surface. In
   monorepos, one library, CLI, plugin manifest, container, meta-package, or
   lockstep package set may each have different release streams.
3. Compatibility uses the highest required bump for the release unit: breaking
   change is major, compatible addition is minor, fix/docs/internal is patch.
4. Release artifacts must agree: manifest, committed lockfile, CHANGELOG
   header, tag plan, dependency ranges, package metadata, and publish order.
5. Agents prepare release evidence, notes, checks, runbooks, and command plans.
   Humans mutate shared environments.
6. Rollback must be faster than emergency fix-forward. Feature flags need owner,
   expiry, cleanup, safe default, and human-owned production change path.

## Classification

| Bump | Trigger |
|---|---|
| major | Removing/renaming public surface; changing return/error/status shape; adding required inputs; tightening accepted inputs; reversing a documented invariant; any change requiring existing users to change code or accept different semantics. |
| minor | Adding optional public surface existing users can ignore; loosening constraints; adding non-exhaustive error variants; marking something deprecated. |
| patch | Bug fixes restoring documented behavior; performance improvements; docs/build/internal changes with no public-surface impact. |

## Workflow

1. **Confirm the gate.** Continue only for user-requested release work,
   user-approved release prep after a concrete diff, or validator-required
   artifact sync.
2. **Confirm scope.** Separate docs-only release notes, version/changelog/
   lockfile edits, packaging checks, rollout planning, and human-run
   tag/publish/deploy steps before editing.
3. **Map release units.** Read manifests, lockfiles, workspace config, release
   scripts, changelog, tags, packaging docs, and registry state when publishing.
4. **Classify impact.** Identify touched public surfaces per release unit and
   choose the target version. Use the higher plausible bump when compatibility
   is unclear; require repo policy or user approval for lockstep bumps.
5. **Edit approved artifacts together.** Keep selected manifests, committed
   lockfiles, CHANGELOG entry, tag plan, dependency ranges, package metadata,
   and publish plan consistent. For deprecation/removal/sunset work, load
   `references/deprecation-and-migration.md`.
6. **Validate before tag or publish.** Check release automation scope, run
   available dry-run pack/build checks, confirm dependency resolution, and name
   the human publish order.
7. **Plan rollout and rollback.** Name artifact, environment, human operator,
   promotion path, merge gates, rollback path, and feature-flag/migration
   phases.
8. **Report execution boundaries.** Separate agent-run checks from human-run
   commands and name remaining release risks.

## Verification

- [ ] Gate and scope were explicit: request, approval, or required validator
      sync; implementation approval was not treated as release approval.
- [ ] Release units, public surfaces, versioning policy, and target bump were
      identified before artifact edits.
- [ ] Manifests, committed lockfiles, CHANGELOG header, tag plan, dependency
      ranges, package metadata, and publish order agree.
- [ ] Registry/latest versions, tags, dependency metadata, package dry-run/build,
      migration notes, and deprecation removal versions were checked or named as
      unavailable.
- [ ] Agent-run validation and human-run release/environment steps are separated.
- [ ] Rollback, migration phases, feature-flag owner/expiry/cleanup/safe
      default, and merge gates are named when relevant.

## Tripwires

Use these when the shortcut thought appears:

- Load `release` only for an explicit release-prep decision, not because a
  future release might exist.
- Prepare deploy, rollback, promotion, approval, flag, DNS, and infrastructure
  actions for a human operator.
- Prove a release script's scope matches the selected release units before
  using it to bump artifacts.
- Ask before keeping lockfile or package-manager changes produced by validation.
- Map monorepo package/version streams before choosing versions.
- Check registry state and dependency resolution before trusting local packages.
- Check committed lockfiles, bundled dependencies, plugin metadata, resource
  paths, tarball contents, and publish order, not only manifests.
- Validate manifests, dependency resolution, dry-run packaging, changelog, and
  publish order before any tag plan.
- Treat shared staging, config, and feature-flag changes as environment
  mutations unless they are local to this working tree.
- Name rollback for data, caches, config, and external side effects.
- Keep canary/progressive gates or name the equivalent.
- Default feature flags off unless they are kill-switches for existing behavior.
- Give temporary flags an owner, expiry, and cleanup work.

## Handoffs

- `api`: HTTP compatibility, URL/header versioning, `Sunset`, `Deprecation`.
- `database`: migration mechanics, locks, backfills, production data safety.
- `observability`: rollout metrics, dashboards, alerts, runbooks.
- `security`: CI credentials, artifact signing, SBOMs, dependency trust.
- `git-workflow`: clean version/release commits.
- `documentation`: migration guides and reference docs.

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
