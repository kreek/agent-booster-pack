# Domain Modeling Skill Tightening Audit

Source: `agents/.agents/skills/domain-modeling/SKILL.md`

Current length: 803 words.

## Keep

- The iron law and the sentence after it are both effective.
- The data/calculation/action and parse-at-boundary rules should remain in the
  main body.
- Date and money hazards are worth calling out explicitly.

## Tightening Opportunities

1. Shorten Core Idea 2.
   Identity/state/value/time plus immutable values, records/sums/maps, and
   class-as-module guidance are all useful but packed into one long item. It
   could be split or shortened.

2. Merge duplicate proof handoffs.
   `proof` appears twice in Handoffs. Combine into one row for data claims and
   public-boundary behavior.

3. Move bibliography detail to references only.
   The References section contains many external concepts. Keep local
   reference files plus one or two canonical external links if the total skill
   size matters.

4. Tighten Crosscutting Hazards.
   The paragraph before date/money references can be one sentence:
   "Load the matching reference whenever time or money appears."

## Do Not Tighten

- Do not remove the direct anti-ceremony warning about generic wrappers and
  helper layers.
- Do not remove date/money triggers; they prevent high-impact subtle bugs.

## Suggested Shape

Small-to-moderate pass. Target 10-15% reduction by shortening references and
handoffs, not the core modeling rules.
