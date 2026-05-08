# Whiteboarding Skill Tightening Audit

Source: `agents/.agents/skills/whiteboarding/SKILL.md`

Current length: 1,986 words.

## Keep

- The iron law captures the skill well.
- "Read the code" and `file:line` evidence are essential.
- The distinction between design conversation, plan mode, and persistent
  artifact is important.

## Tightening Opportunities

1. Merge Conversation Shape and Workflow.
   Both sections describe the same progression: goal, current surface,
   possible shape, tradeoffs, questions, agreement. Keep one operational
   section and let the other become a short template.

2. Shorten Final Artifact.
   ADR vs RFC guidance is useful but verbose. Put detailed templates in a
   reference and keep the main body to "capture agreed design as repo-standard
   ADR/RFC after convergence."

3. Reduce repeated durable-interface language.
   Durable interface routing appears in When to Use, Core Ideas, Workflow,
   Verification, and Tripwires. Keep the gate rule in Core Ideas and Workflow;
   shorten later mentions.

4. Compress Verification aggressively.
   The checklist is long and repeats workflow. Group by: no premature artifact,
   evidence-backed current surface, concrete proposed contracts, domain lens,
   diagram when multi-component, decisions/questions, proof obligations,
   sign-off before code.

5. Move "three readers" test to references or delete.
   It is a nice review heuristic, but expensive in the main skill.

6. Shorten Handoffs.
   Several handoff rows explain what the downstream skill does. Use short
   trigger phrases instead.

## Do Not Tighten

- Do not remove "no design artifact before convergence."
- Do not remove "cite file:line for existing contracts."
- Do not remove "do not write implementation code before durable interface
  sign-off."

## Suggested Shape

Major pass. Target 30-40% reduction by merging duplicate design-flow sections
and moving RFC/ADR template detail to references.
