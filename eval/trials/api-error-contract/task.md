# User Lookup Response Bug

Fix `handleUserLookup` in `src/users.js`.

Requirements:

- Return status `400` for a missing `id`.
- Return status `404` when the user does not exist.
- Return status `200` with the user body when the user exists.
- Error responses should have a consistent JSON body with a stable `error`
  code and human-readable `message`.

Do not add external dependencies.
