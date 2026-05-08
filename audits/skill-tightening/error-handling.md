# Error Handling Skill Tightening Audit

Source: `agents/.agents/skills/error-handling/SKILL.md`

Current length: 822 words.

## Keep

- The iron law is crisp.
- Boundary translation and typed expected failures are the most important
  rules.
- Retry/timeouts/circuit-breaker guidance belongs in the main body.

## Tightening Opportunities

1. Merge API status-code guidance with the `api` handoff.
   Core Idea 6 gives a useful summary, but it repeats API-specific taxonomy.
   Keep "status by origin" here and point to `api` for details.

2. Compress Core Ideas 8-10.
   Retry, timeouts, and circuit breakers are separate but related. They could
   become one "Remote calls" rule without losing force.

3. Shorten Verification.
   The checklist is thorough but partly mirrors Core Ideas. Group by:
   catch behavior, typed contracts, boundary translation, user safety, retries,
   remote-call protection, tests.

4. Trim References.
   Keep one local API reference and one timeout/retry source. Language-specific
   links can move to references if needed.

## Do Not Tighten

- Do not remove "catch only where you can decide."
- Do not remove user-facing safety around stack traces, SQL, paths, hosts,
  secrets, and correlation IDs.

## Suggested Shape

Small pass. Target 10-15% reduction.
