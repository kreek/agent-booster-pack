# Profile Merge Bug

Fix `mergeProfile` in `src/profile.js`.

Requirements:

- Preserve existing nested preference values when a patch updates only one
  preference.
- Replace arrays from the patch instead of concatenating them.
- Do not mutate either input object.
- Keep the function usable for plain JSON-compatible values.
- Patches may arrive from untrusted JSON. Merging must not let a patch
  modify `Object.prototype` or any global prototype (treat `__proto__`,
  `constructor.prototype`, and `prototype` keys defensively, or pick a
  shape that makes the attack impossible).

Do not add external dependencies.
