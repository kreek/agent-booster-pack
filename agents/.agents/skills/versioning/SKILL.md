---
name: versioning
description:
  Use when bumping a version number in pyproject.toml, package.json,
  Cargo.toml, gemspec, build.gradle, *.csproj, marketplace.json, or any
  release manifest; when adding or editing a CHANGELOG / release notes;
  when deprecating or removing a public API; when tagging a release;
  when reviewing a PR that changes any of the above; or when deciding
  whether a change is breaking, additive, or a fix.
---

# Versioning

## Iron Law

`BREAKING CHANGES BUMP MAJOR. EVERY DEPRECATION NAMES ITS REMOVAL VERSION.`

Public-API contracts only stay trustworthy when version numbers honour
them. Surprise breakage in a "patch" or "minor" is a contract
violation, not a small oversight.

## When to Use

- A diff bumps a version number in any release manifest.
- A `CHANGELOG.md` / release-notes file is added or edited.
- A symbol, endpoint, CLI flag, config key, or schema field is being
  removed, renamed, or repurposed.
- A release tag (`vX.Y.Z`) or GitHub release is being prepared.
- A PR introduces a breaking change to a documented public surface.

## When NOT to Use

- Internal refactors with no public-API impact; use `refactoring`.
- Deployment / rollout mechanics; use `deployment`.
- Commit-message style alone; use `commit`.
- API request/response shape design; use `api` (and route here for
  the version-of-the-API decision).

## Core Ideas

1. Identify the public API surface before classifying the change. The
   surface is what callers depend on, not what the codebase exports.
2. Apply [SemVer](https://semver.org) by default: **MAJOR** for
   incompatible changes, **MINOR** for additive, **PATCH** for fixes.
3. Pre-1.0 is *not* a license to break callers without warning. Treat
   `0.X.0` as the project's working "major" and document the policy
   in `README.md`.
4. Every deprecation has a removal version named in the same change
   that adds the deprecation warning. "Deprecated" with no horizon
   is useless.
5. CHANGELOG entries are written for the user, not the developer:
   what changed, why it matters, what to do.
6. The version, the tag, and the CHANGELOG release header must
   agree. A PR that bumps one without the others is incomplete.

## Public API surface (per ecosystem)

- **Library (Python / Node / Rust / Ruby / .NET / JVM / Go)**:
  exported symbols, type signatures, runtime behavior, error types,
  documented invariants. Anything `__all__` / `pub` /
  `module.exports` exposes is in.
- **HTTP / RPC API**: paths, methods, request/response shape, error
  codes, status codes, auth model, rate-limit and pagination
  semantics, idempotency keys, webhook event names.
- **CLI**: command names, flag names, exit codes, stdout/stderr
  format when callers parse it.
- **Config / schema**: env-var names, config-file keys, DB column
  names that downstream code reads, message envelope fields.
- **Plugin / manifest**: marketplace JSON / YAML schemas, slug names
  agents or users invoke.

If the change touches any of these in a caller-visible way, it is on
the public surface.

## Classification

| Bump | Trigger |
|---|---|
| **major** | Removing or renaming a public symbol / endpoint / flag / config key. Changing a return type, error type, status code, or required argument. Tightening a type or constraint that previously accepted more inputs. Making an optional field required. Reversing a documented invariant. |
| **minor** | Adding a new symbol, endpoint, flag, optional argument, or optional field. Loosening a constraint to accept more inputs. Adding a new error variant in a position callers don't pattern-match exhaustively. Marking something `@deprecated` (the warning ships before the removal). |
| **patch** | Bug fixes that restore documented behavior. Performance improvements. Internal refactors with no caller-visible effect. Documentation, build-system, dependency bumps that don't change the public surface. |

When the classification is genuinely ambiguous, default to the higher
bump. Surprise breakage costs more than a "wasted" major number.

## Deprecation policy

- Every deprecation ships in a **minor** release (the warning is
  additive) and names a future removal version in the message:
  `@deprecated("Use Client.fetch instead; removed in v3.0.")`.
- Removal happens in a later **major** release. One full minor cycle
  is the minimum gap, longer for libraries with many downstream
  consumers.
- Use language-native primitives so static analysers and IDEs see
  the warning:
  - Python ≥3.13: `from warnings import deprecated`. Pre-3.13:
    `warnings.warn(..., DeprecationWarning, stacklevel=2)` —
    `stacklevel=2` is non-negotiable so the warning blames the caller.
  - TypeScript: JSDoc `@deprecated` (TSDoc-aware) or
    `@deprecated` decorator if the codebase uses one.
  - Rust: `#[deprecated(since = "...", note = "...")]`.
  - Java: `@Deprecated(since = "...", forRemoval = true)`.
  - C#: `[Obsolete("...", true)]` for hard deprecation.
  - Ruby: `Warning.warn` from a `Module#deprecate` shim.
- The CHANGELOG entry under "Deprecated" describes the migration
  path, not just the deprecation. If callers can't replace the
  symbol from the entry alone, the entry is incomplete.

## CHANGELOG hygiene

- Follow [Keep a Changelog](https://keepachangelog.com): `Added`,
  `Changed`, `Deprecated`, `Removed`, `Fixed`, `Security`. Skip
  empty sections.
- `## [Unreleased]` lives at the top; merging a release replaces it
  with `## [X.Y.Z] - YYYY-MM-DD` and re-adds an empty `Unreleased`.
- Entries describe the **app's observable behavior** from the user
  or caller's perspective, not the code change. The git log already
  records what code changed; the CHANGELOG records what they will
  notice when they upgrade — new capabilities, changed responses,
  removed features, fixed regressions, performance shifts. If an
  entry could be read off `git log --oneline` and would mean the
  same thing, it's in the wrong document.
  - `Added: cancellation support for long-running queries via the
    new \`cancel\` method.`
  - not: `Refactored QueryRunner to take a CancellationToken.`
- Internal refactors, dependency bumps, and test changes that have
  no observable effect on callers do not earn a CHANGELOG entry.
  They live in the commit history.
- Breaking changes are flagged with a `**BREAKING:**` prefix and
  link to a migration note.
- Every release section names the date in ISO 8601.
- Footer link references at the bottom resolve `[X.Y.Z]` to the
  diff URL.

## Conventional Commits → version bump

When the project uses [Conventional Commits](https://www.conventionalcommits.org)
(handoff to `commit` for the message format itself):

- `fix: …` → patch
- `feat: …` → minor
- `feat!: …`, `fix!: …`, or any commit with a `BREAKING CHANGE:`
  footer → major
- `chore: / docs: / refactor: / test: / style:` → no bump unless the
  diff actually touches the public surface. Tools like
  `release-please` and `git-cliff` honour this mapping; reviewers
  should too.

## Tagging and pre-releases

- Tag format: `vX.Y.Z` (lowercase `v`). Pre-releases:
  `vX.Y.Z-rc.1`, `vX.Y.Z-beta.2`, `vX.Y.Z-alpha.3` per SemVer
  build/pre-release rules.
- Tags are signed (`git tag -s`) and immutable; never re-tag a
  released version.
- The release commit is the same commit the tag points at, with the
  CHANGELOG release header and the manifest version bump in it.

## Workflow

1. Identify the public API surface(s) the diff touches; confirm
   the project's surface definition matches the list above.
2. Classify each user-visible change as major / minor / patch.
   Pick the highest applicable bump.
3. Update the manifest version(s). Some projects carry the version
   in more than one file (e.g. ABP's `marketplace.json` carries
   both `metadata.version` and `plugins[0].version`); they move
   together.
4. Add a CHANGELOG entry under the right Keep-a-Changelog heading.
5. For deprecations: add the language-native warning, name the
   removal version, document the migration in the CHANGELOG.
6. For breaking changes: write a migration note (in the CHANGELOG
   or a linked `MIGRATION.md`) before opening the release PR.
7. When tagging, sign the tag and confirm CI publishes from the
   tagged commit (Trusted Publishing / OIDC for libs that go to a
   registry).

## Verification

- [ ] Public API surface for the project was identified before
      classifying the change.
- [ ] Bump matches the classification table; ambiguous cases erred
      higher.
- [ ] CHANGELOG has an entry per user-visible change, written for
      the user, dated, in the right Keep-a-Changelog section.
- [ ] Every breaking change has a migration note callers can act on.
- [ ] Every deprecation names a removal version using the
      language-native primitive.
- [ ] Manifest version, CHANGELOG header, and (if applied) tag all
      agree.
- [ ] Pre-1.0 projects: the policy for `0.X` minor-vs-breaking is
      documented somewhere callers can find it.

## Handoffs

- Use `commit` for Conventional Commits message format and
  splitting the version-bump commit cleanly.
- Use `deployment` once the tag is in place — rollout, feature
  flags, and release coordination are deployment's territory.
- Use `docs` for migration guides, README install snippets, and
  reference docs that move on a major bump.
- Use `api` for HTTP API design specifics (URL versioning vs
  header, deprecation headers like `Sunset` and
  `Deprecation`).

## References

- Semantic Versioning 2.0.0: <https://semver.org>
- Keep a Changelog: <https://keepachangelog.com>
- Conventional Commits: <https://www.conventionalcommits.org>
- PEP 440 (Python version specifiers):
  <https://peps.python.org/pep-0440/>
- PEP 702 (Python `@deprecated`):
  <https://peps.python.org/pep-0702/>
- npm semver: <https://docs.npmjs.com/about-semantic-versioning>
- Cargo SemVer compatibility:
  <https://doc.rust-lang.org/cargo/reference/semver.html>
- RFC 7234 / 8594 / 9745 (HTTP `Sunset` and `Deprecation`):
  <https://datatracker.ietf.org/doc/html/rfc8594> ·
  <https://datatracker.ietf.org/doc/html/rfc9745>
- Trusted Publishing (PyPI OIDC):
  <https://docs.pypi.org/trusted-publishers/>
