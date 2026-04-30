# Profile Merge Bug

Fix `mergeProfile` in `src/profile.js`.

Requirements:

- Preserve existing nested preference values when a patch updates only one
  preference.
- Replace arrays from the patch instead of concatenating them.
- Do not mutate either input object.
- Keep the function usable for plain JSON-compatible values.

Do not add external dependencies.
