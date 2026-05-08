# Contract First Skill Tightening Audit

Source: `agents/.agents/skills/contract-first/SKILL.md`

Current length: 385 words.

## Keep

- This skill is already compact and operational.
- The workflow is clear: stop, name current interface, propose shape, explain
  boundary, get approval, reopen if implementation changes the contract.

## Tightening Opportunities

1. Shorten the When to Use list.
   The durable-interface enumeration repeats `workflow`. It could say "any
   durable interface as defined by workflow" and list only the most common
   examples.

2. Merge Pi-specific trigger into Runtime Extensions if more runtime
   companions are added.
   The Pi gate mention is useful today but slightly implementation-specific.
   It is fine as-is unless the pack wants runtime-neutral skill bodies.

3. Compress Handoffs.
   Handoffs are clear but could be one sentence plus domain examples.

## Do Not Tighten

- Do not remove "Treat silence as not approved."
- Do not weaken "Stop before implementation code lands."

## Suggested Shape

Leave mostly as-is. Any tightening would save few tokens and risks blurring the
approval gate.
