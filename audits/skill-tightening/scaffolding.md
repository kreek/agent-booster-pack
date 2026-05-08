# Scaffolding Skill Tightening Audit

Source: `agents/.agents/skills/scaffolding/SKILL.md`

Current length: 1,286 words.

## Keep

- The iron law and clean-clone standard are valuable.
- Literal named-artifact handling is important because users often ask for
  concrete files.
- The prototype/scaffold/production-bound web distinction is useful.

## Tightening Opportunities

1. Merge Preflight and Workflow.
   These sections overlap heavily: detect ecosystem, read references, classify
   web work, match stack preset, confirm choices. Keep one ordered workflow and
   remove duplicate setup language.

2. Move Project-Specific Defaults into references.
   Stack preset and Material for MkDocs defaults are useful, but the main skill
   can point to `references/stacks/index.yaml` and `language-defaults.md`
   without explaining all policy details.

3. Replace harness-baseline paragraph.
   The Core Ideas opener explains what the harness already knows. Start with
   the added rules directly.

4. Compress Verification.
   The checklist repeats Preflight/Workflow. Group by package manager,
   command surface, requested artifacts, web classification, smoke test, CI,
   README/security hygiene.

5. Shorten References.
   The References descriptions are long. Keep link titles and move prose into
   the referenced files.

## Do Not Tighten

- Do not remove "typecheck is not node --check."
- Do not remove "named artifacts literally" and requirement -> artifact ->
  command mapping.
- Do not remove mature-framework default for fresh web apps.

## Suggested Shape

Major pass. Target 25-35% reduction by merging Preflight/Workflow and moving
catalog explanation into references.
