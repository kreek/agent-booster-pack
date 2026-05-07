# Release v5.0.0 manual checklist

The two in-flight branches (`feature/major-seam-contract-gate` and
`feature/pi-runtime-split`) introduce the Interface Design Gate
doctrine and split the Pi runtime out of `pi-agent-booster-pack` into
four sibling packages. Cutting v5.0.0 requires manual steps on top of
`scripts/release.sh` — npm publishes, npm deprecations, and a decision
about the old `kreek/pi-proof` GitHub repo. This checklist is one-shot
release ops, not durable docs; archive or delete after v5.0.0 ships.

## Pre-merge

- [ ] **Merge `feature/major-seam-contract-gate` into `main` first.**
      It carries the doctrine that `feature/pi-runtime-split` references
      (cross-mentions in `proof/SKILL.md` and `whiteboarding/SKILL.md`,
      Interface Design Gate terminology).
- [ ] **Rebase `feature/pi-runtime-split` onto the new `main`.**
      The two branches are independent off `main` so rebase should be
      clean, but they touch overlapping files (`CHANGELOG.md`,
      `README.md`). Resolve conflicts by keeping both sets of changes
      (doctrine + package split).
- [ ] **Re-run validators after rebase**:
      ```sh
      uv run python scripts/validate_skill_anatomy.py
      cd agent-booster-pack-contract-first && node --test test/*.test.js
      cd agent-booster-pack-skills && npm run build
      ```
- [ ] **Merge `feature/pi-runtime-split` into `main`.**

## Cut the release

From `main`:

```sh
scripts/release.sh 5.0.0 --dry-run    # sanity check
scripts/release.sh 5.0.0              # bumps four package.jsons + manifests, commits, tags v5.0.0
git push origin main
git push origin v5.0.0
gh release create v5.0.0 --title "v5.0.0" \
  --notes "$(awk '/^## \[5.0.0\]/{flag=1;next} /^## \[/{flag=0} flag' CHANGELOG.md)"
```

## npm publish

Order matters: dependencies must be on npm before the meta-package can
resolve them. From the repo root:

- [ ] `cd agent-booster-pack-skills && npm publish --access public`
      (Pre-pack runs the build script automatically; the skills/
      build artifact is included in the tarball.)
- [ ] `cd agent-booster-pack-contract-first && npm test && npm publish --access public`
- [ ] `cd agent-booster-pack-proof && npm install && npm test && npm publish --access public`
      (pi-proof's vitest dependencies need installing in the new
      monorepo location before the test suite runs.)
- [ ] `cd agent-booster-pack && npm publish --access public`
      (Meta-package; npm verifies the three pinned deps resolve.)

After each publish, sanity-check from a clean shell:

```sh
npm view agent-booster-pack-skills version           # 5.0.0
npm view agent-booster-pack-contract-first version   # 5.0.0
npm view agent-booster-pack-proof version            # 5.0.0
npm view agent-booster-pack version                  # 5.0.0
```

## npm deprecate

Two old names need deprecation notices pointing users at the new
names. Run these only after the new packages are published:

- [ ] `npm deprecate "pi-agent-booster-pack@<5" "pi-agent-booster-pack has been renamed to agent-booster-pack-skills (skills only) — install agent-booster-pack for the full bundle, or agent-booster-pack-skills for skills only."`
- [ ] `npm deprecate "pi-proof@<2" "pi-proof has been renamed to agent-booster-pack-proof — install agent-booster-pack-proof for ongoing updates."`

Verify both deprecations show on npm:

```sh
npm view pi-agent-booster-pack deprecated
npm view pi-proof deprecated
```

Existing installs of `pi-agent-booster-pack@4.x` and `pi-proof@1.x`
keep working. Only new installs and upgrades surface the deprecation
notice.

## kreek/pi-proof GitHub repo

This is your call — there are three options, listed in increasing
disruption:

### Option A — Archive (recommended)

```sh
gh repo archive kreek/pi-proof
```

Effect:
- Repo becomes read-only.
- Issues and PRs lock.
- The repo stays browseable.
- **Demo gif URLs in `agent-booster-pack-proof/README.md` keep
  working** — they point at
  `github.com/kreek/pi-proof/raw/refs/heads/main/...` and GitHub serves
  raw paths from archived repos.

Recommended because preserves the demo media without ongoing
maintenance burden.

### Option B — Add a stub README pointing at the monorepo

Before archiving (or instead of archiving), commit a stub README to
`kreek/pi-proof@main`:

```markdown
# pi-proof has moved

This package is now `agent-booster-pack-proof`, built and published
from <https://github.com/kreek/agent-booster-pack/tree/main/agent-booster-pack-proof>.

Install: `pi install npm:agent-booster-pack-proof`.
```

Effect: anyone who lands on the old GitHub repo sees the redirect.
Still archive after.

### Option C — Delete

Don't. Demo gif URLs in the new monorepo's
`agent-booster-pack-proof/README.md` would break. If you do want to
delete, copy the assets into the monorepo first:

```sh
cd /path/to/agent-booster-pack
mkdir -p agent-booster-pack-proof/assets/release
cp /path/to/old-pi-proof/assets/release/{demo.gif,demo.mp4} \
   agent-booster-pack-proof/assets/release/
```

Then update the URLs in `agent-booster-pack-proof/README.md` and
`agent-booster-pack-proof/package.json` (the `pi.video` and `pi.image`
fields point at the old repo's raw URLs).

## Optional follow-ups (not blocking v5.0.0)

These can land in v5.x or later patch releases. None affect users:

- [ ] **Internal identifier rename in `agent-booster-pack-proof/src/`**:
      variable names, log strings, and the Pi extension name registered
      with the runtime still say `pi-proof` and `pi-tdd`. The package
      published name is `agent-booster-pack-proof` but the runtime
      registers itself with the older identifier. Decide whether to
      rename for internal consistency or keep the old name to avoid
      breaking Pi's extension-name lookup. If renamed, requires a
      coordinated bump.
- [ ] **Move demo assets into the monorepo**: even if the old
      `kreek/pi-proof` repo stays archived, copying the demo gif/mp4
      into `agent-booster-pack-proof/assets/release/` makes the new
      monorepo self-contained. Then update the URLs in
      `agent-booster-pack-proof/README.md` and `package.json`.
- [ ] **Remove this file (`RELEASE-v5.md`).** One-shot release ops; not
      durable docs. Delete after v5.0.0 ships and the deprecations
      have been confirmed live.

## Rollback notes

If `agent-booster-pack-proof@5.0.0` ships with a regression after the
`pi-proof` deprecation goes live:

1. Publish a fixed `agent-booster-pack-proof@5.0.1` immediately.
2. The old `pi-proof@1.1.0` is still installable (deprecation doesn't
   uninstall) — users can pin to it as an emergency fallback.
3. Don't try to "un-deprecate" `pi-proof`; just publish the fix.

Same shape for `agent-booster-pack-skills`: fix forward, not back.

## After v5.0.0 ships

- [ ] Confirm all four packages installable:
      `pi install npm:agent-booster-pack` (meta install — should pull
      all three siblings).
- [ ] Confirm deprecation messages visible in `npm install` output for
      `pi-agent-booster-pack` and `pi-proof`.
- [ ] Delete this file (`RELEASE-v5.md`).
