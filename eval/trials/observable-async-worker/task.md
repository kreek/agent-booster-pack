# Notification Worker Bug

Fix `processNotifications` in `src/worker.js`.

Requirements:

- Process notifications with a configurable concurrency limit.
- Retry one failed send once before reporting it as failed.
- Return counts for sent and failed notifications.
- Emit useful lifecycle log events through the provided `logger`.

Do not add external dependencies.
