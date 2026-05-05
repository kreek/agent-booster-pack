# Version-Verified Implementation

Use this reference when implementation correctness depends on current
framework, library, runtime, cloud, browser, or platform behavior.

## Rule

Treat model memory as a hint, not evidence, for version-sensitive APIs.
Identify the local version, check the current authoritative source, follow
compatible local conventions, and mark anything unverified.

This is a proof obligation, not a browsing workflow. Use the host harness's
normal documentation, browsing, MCP, package, or local-inspection tools.

## When to Apply

- Framework routing, forms, data loading, state management, build config,
  auth middleware, migrations, deployment config, SDK calls, or browser APIs.
- Starter/scaffold code that users may copy across projects.
- Reviews where a pattern might be deprecated, version-specific, or copied
  from stale model memory.
- User asks for current, official, documented, verified, or best-practice
  implementation.

## When Not to Apply

- Pure project-local logic with tests and no framework-specific behavior.
- Mechanical renames, typos, prose edits, or formatting.
- Stable language syntax that is covered by the repo's compiler/linter.
- Emergency mitigation where the user explicitly accepts unverified risk.

## Workflow

1. Detect the relevant version from local files: manifest, lockfile, runtime
   config, imported package, generated client, schema, or CI image.
2. Check the narrow authoritative source for the exact pattern: official docs,
   release notes, migration guide, standards spec, or provider SDK reference.
3. Compare the source to local conventions. If local code uses a different
   pattern, surface whether it is compatible, deprecated, or unknown.
4. Implement the smallest source-compatible change. Prefer local helpers and
   project conventions when they do not contradict the verified source.
5. In the completion claim, name the source checked or say the claim is
   unverified. Do not turn every source into code comments unless future
   maintainers need the citation at that line.

## Verification

- [ ] Relevant version or platform was identified, or the absence was reported.
- [ ] Official/source-of-truth guidance was checked for the specific pattern.
- [ ] Deprecated or version-incompatible APIs were avoided.
- [ ] Conflicts between official guidance and local convention were surfaced.
- [ ] Unverified framework/library claims were reported as unverified.
- [ ] Runtime behavior was proven with the host harness's native tools when
      source guidance alone did not prove the user-visible behavior.

## Tripwires

| Trigger | Do this instead | False alarm |
|---|---|---|
| "I know this API" | Check the local version and the specific official page or reference. | Project-local helper with tests and no external API dependency. |
| "The docs are too broad" | Fetch the narrow API, migration, or release-note page, not the whole site. | Offline task where the user accepted unverified output. |
| "Existing code does it this way" | Verify whether the existing pattern is still supported before copying it. | Repo policy intentionally pins an older supported pattern. |
| "I'll cite a blog post" | Use official docs, standards, release notes, or provider references as the primary source. | The project itself owns the framework or library being edited. |
