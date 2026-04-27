---
name: versioning
description: >-
  Use for version and release-surface changes: manifests, CHANGELOG entries,
  release notes, tags, deprecations, removals, and deciding major/minor/patch
  impact.
---

# Versioning

## Iron Law

`BREAKING CHANGES BUMP MAJOR. EVERY DEPRECATION NAMES ITS REMOVAL VERSION.`

## When to Use

- A diff bumps a version manifest, edits `CHANGELOG.md`, deprecates or
  removes a public symbol/endpoint/flag/config key, or prepares a
  release tag.

## When NOT to Use

- Internal refactors with no caller-visible impact; use `refactoring`.
- Rollout toil, feature-flag planning, release coordination, or
  human-run deployment checklists; use `deployment`.
- Commit-message format alone; use `commit`.

## Core Ideas

1. Identify the public API surface before classifying. The surface is
   what callers depend on, not what the codebase exports: library
   symbols and types, HTTP/RPC paths and shapes, CLI flags and exit
   codes, env-var and config keys, plugin/manifest schemas. If the
   change touches any of these in a caller-visible way, it is on the
   surface.
2. Pre-1.0 is *not* a license to break callers without warning. Treat
   `0.X.0` as the project's working "major" and document the policy
   in `README.md`.
3. Additive and optional public-surface changes are usually minor, not
   major, when existing callers can keep using the old contract without
   changing code or receiving different semantics. Follow the same
   compatibility lens as `api`: additions that force clients to send,
   handle, or interpret new data are breaking even if they look
   additive.
4. Every deprecation ships in a minor with a removal version named
   in the warning, then removes in a later major. One full minor
   cycle is the minimum gap.
5. CHANGELOG entries describe what users will *notice when they
   upgrade*, not what the code changed. If an entry could be read off
   `git log --oneline` and mean the same thing, it's in the wrong
   document.
6. Manifest version, CHANGELOG release header, and tag must agree.
   When a compatibility question remains after checking caller impact,
   default to the higher plausible bump.

## Classification

| Bump | Trigger |
|---|---|
| major | Removing or renaming a public symbol / endpoint / flag / config key. Changing a return type, error type, status code, or required argument. Tightening a type or constraint that previously accepted more inputs. Making an optional field required. Reversing a documented invariant. Any change that requires existing callers to change code or accept different semantics. |
| minor | Adding a new symbol, endpoint, flag, optional argument, or optional field that existing callers can ignore. Loosening a constraint. Adding a new error variant in a position callers don't pattern-match exhaustively. Marking something `@deprecated`. |
| patch | Bug fixes that restore documented behavior. Performance improvements. Internal refactors with no caller-visible effect. Docs, build, dependency bumps with no public-surface impact. |

Conventional Commits map: `fix:` → patch, `feat:` → minor, `feat!:` /
`fix!:` / `BREAKING CHANGE:` footer → major. `chore: / docs: /
refactor: / test: / style:` only bump if the diff touches the public
surface.

## Deprecation primitives

Use language-native warnings so static analysers and IDEs see them:

- Python ≥3.13: `from warnings import deprecated`. Pre-3.13:
  `warnings.warn(..., DeprecationWarning, stacklevel=2)`:
  `stacklevel=2` is non-negotiable so the warning blames the caller.
- TypeScript: JSDoc `@deprecated` (TSDoc-aware).
- Rust: `#[deprecated(since = "...", note = "...")]`.
- Java: `@Deprecated(since = "...", forRemoval = true)`.
- C#: `[Obsolete("...", true)]` for hard deprecation.
- Ruby: `Warning.warn` from a `Module#deprecate` shim.

The CHANGELOG `Deprecated` entry describes the migration path, not
just the deprecation. If callers can't replace the symbol from the
entry alone, the entry is incomplete.

## CHANGELOG hygiene

Follow Keep a Changelog: `Added`, `Changed`, `Deprecated`, `Removed`,
`Fixed`, `Security`. Skip empty sections.

- `## [Unreleased]` lives at the top; merging a release replaces it
  with `## [X.Y.Z] - YYYY-MM-DD` and re-adds an empty `Unreleased`.
- Entries are user-observable: new capability, changed response,
  removed feature, fixed regression, performance shift.
- Internal refactors, dep bumps, and test changes with no observable
  effect do not earn an entry.
- Breaking changes get a `BREAKING:` prefix and link to a migration
  note.
- Tag format: `vX.Y.Z` (signed, immutable). Pre-releases:
  `vX.Y.Z-rc.1`, `-beta.2`, `-alpha.3`. The tag points at the same
  commit that bumps the manifest and writes the CHANGELOG header.

## Workflow

1. Identify the public API surface(s) the diff touches; classify each
   change against the table; pick the highest applicable bump.
2. Update the manifest version(s). Some projects carry the version in
   more than one file (e.g. ABP's `marketplace.json` holds both
   `metadata.version` and `plugins[0].version`); they move together.
3. Add the CHANGELOG entry, deprecation warning + removal version, and
   migration note (for breaking changes) in the same commit as the
   bump. Sign the tag and confirm CI publishes from the tagged commit
   (Trusted Publishing / OIDC for libs that go to a registry).

## Verification

- [ ] Bump matches the classification table; ambiguous cases erred
      higher.
- [ ] CHANGELOG has an entry per user-visible change, dated, in the
      right Keep-a-Changelog section.
- [ ] Every breaking change has a migration note callers can act on.
- [ ] Every deprecation names a removal version using the
      language-native primitive.
- [ ] Manifest version, CHANGELOG header, and (if applied) tag all
      agree.

## Handoffs

- Use `commit` for Conventional Commits format and splitting the
  version-bump commit cleanly.
- Use `deployment` once the tag is in place to prepare rollout
  checklists, feature-flag plans, rollback notes, and release
  coordination; a human still mutates shared environments.
- Use `documentation` for migration guides and reference docs that
  move on a major bump.
- Use `api` for HTTP API design specifics (URL versioning vs header,
  `Sunset` and `Deprecation` headers).

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
- RFC 8594 / 9745 (HTTP `Sunset` and `Deprecation`):
  <https://datatracker.ietf.org/doc/html/rfc8594> ·
  <https://datatracker.ietf.org/doc/html/rfc9745>
- Trusted Publishing (PyPI OIDC):
  <https://docs.pypi.org/trusted-publishers/>
