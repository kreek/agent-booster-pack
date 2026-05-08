# Skill Tightening Audit Method

These audits are editing guides, not token budgets. A shorter skill is only an
improvement when it preserves trigger fidelity: the same load-bearing rules
still fire in the same situations with the same conviction.

## Validation Before Tightening

Before applying any audit recommendation to a `SKILL.md`:

1. Name the load-bearing rules that must survive: Iron Law, gate rules,
   tripwires, "Do Not Tighten" items, and safety/proof obligations.
2. Draft the proposed diff and check that every load-bearing rule still appears
   in the main skill body or in an unmistakable reference trigger.
3. Run at least one trigger-fidelity check:
   - A/B the same prompt against old vs tightened skill and compare whether the
     same rules fire in the agent output; or
   - Map each Iron Law / "Do Not Tighten" item to the tightened text and confirm
     it has the same operational force.
4. Prefer obvious DRY wins first: remove meta-commentary, merge duplicate
   handoffs, and combine repeated workflow sections before deleting examples.

Percent reductions are rough scope estimates only. They must not dictate cuts
when examples, tripwires, or checklists are what make the skill fire.
