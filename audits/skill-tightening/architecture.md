# Architecture Skill Tightening Audit

Source: `agents/.agents/skills/architecture/SKILL.md`

Current length: 950 words.

## Keep

- The "organize by what changes together" rule is the skill's core value.
- The warning against default horizontal layers is concrete and useful.
- Component data-flow guidance is strong because it turns architecture into
  inspectable boundaries instead of vague layering advice.

## Tightening Opportunities

1. Remove the marketing-like sentence after the iron law.
   "If a single feature requires editing four files..." is memorable, but it
   reads like explanation for humans. It could be folded into Core Idea 1 or
   deleted.

2. Combine repeated durable-interface routing.
   Durable-interface routing appears in Core Idea 6, Workflow step 3, and
   Verification. Keep all three roles, but shorten Core Idea 6 to a pointer
   and let Workflow carry the action.

3. Tighten DDD guidance without losing vocabulary.
   Do not collapse the DDD guidance to one vague sentence. Preserve concrete
   terms such as aggregates, bounded contexts, repositories, factories, and
   domain services, ideally as a short bullet list that says which terms carry
   value and which are optional ceremony.

4. Compress Handoffs.
   The handoff rows are useful but can be shorter. The `simple-not-easy`
   handoff is long and could move into Core Ideas or References.

## Do Not Tighten

- Keep the distinction between real technical boundaries and flowchart steps.
- Keep the data-flow role list: ingress, parse, domain, output-shaping,
  presentation. It is specific and agent-actionable.
- Keep enough DDD vocabulary to make architecture conversations concrete.

## Suggested Shape

Small pass. Target 10-15% reduction while preserving the boundary and data-flow
tests.
