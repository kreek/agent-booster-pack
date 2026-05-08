# Release Skill Tightening Audit

Source: `agents/.agents/skills/release/SKILL.md`

Current length: 1,505 words.

## Keep

- Human-owned shared-environment mutation is the key safety rule.
- Release unit and public surface classification are essential.
- The SemVer classification table is useful and should stay.

## Tightening Opportunities

1. Merge the paragraph after the iron law into Core Ideas.
   It is important but reads as explanation. Make it a direct rule in Core
   Ideas: "Prepare release evidence; do not execute shared-environment
   mutations."

2. Shorten Workflow steps 5-9.
   These steps cover manifest/changelog/tag agreement, packaging validation,
   gates, rollback, and final report. They are all useful but can be made more
   imperative and less explanatory.

3. Group Verification by release phase.
   The checklist is long. Group into: classification, artifact consistency,
   packaging proof, human execution boundary, gates/rollback/flags.

4. Tighten tripwire prose without merging release phases.
   The table repeats shared-environment, flag, staging, config, rollback, and
   hotfix-forward concerns because each phase fails differently. Preserve
   phase-specific triggers; shorten only wordy cells where the corrective
   action remains obvious.

5. Move registry/latest metadata detail to a reference.
   Registry state is important, but exact checks can live in a release
   reference if the main skill needs shrinking.

## Do Not Tighten

- Do not remove "humans mutate shared environments."
- Do not remove monorepo release-unit mapping.
- Do not remove feature flag owner/expiry/safe-default guidance.
- Do not merge tripwires across release phases merely because they share the
  "human-owned environment mutation" theme.

## Suggested Shape

Moderate pass. Target smaller, safer reductions through meta-commentary
cleanup, workflow tightening, and grouped Verification. Keep phase-specific
tripwires visible.
