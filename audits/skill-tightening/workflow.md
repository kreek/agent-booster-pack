# Workflow Skill Tightening Audit

Source: `agents/.agents/skills/workflow/SKILL.md`

Current length: 2,185 words.

## Keep

- The routing-pass Core Ideas opening is now agent-facing and should stay.
- The risk matrix improves scanability for initial skill selection.
- The compressed tripwire table is stronger than the previous repeated form.

## Tightening Opportunities

1. Revisit durable-interface definition carefully.
   It is long, but it is also the source of truth for other skills. If
   tightened, preserve examples that prevent agents from missing exported
   types, CLI/config/file formats, database migration surfaces, component
   props, and service adapters.

2. Tighten completion-loop explanation.
   Workflow step 7 can be reduced now that `proof` and `code-review` carry the
   detailed behavior. Keep the loop sequence and the documentation check.

3. Shorten Verification.
   Some verification items restate steps 5, 7, and 8. Group them by skill
   selection, scope, proof, human decisions, durable interfaces, and final
   value claim.

4. Keep Step 8's behavior-bearing elaboration examples.
   The examples are the point: partial indexes, prototype guards, retries,
   fallbacks, and custom validators are concrete cases that interrupt
   motivated reasoning. If the wording is tightened, keep illustrative cases
   in the main body rather than replacing them with only category names.

## Do Not Tighten

- Do not remove acceptance criteria before editing.
- Do not weaken durable-interface approval.
- Do not remove version-sensitive source verification.
- Do not remove the completion loop.
- Do not remove concrete examples from the behavior-bearing elaboration rule;
  they are what make agents notice speculative hardening and abstraction.

## Suggested Shape

Small-to-moderate future pass. Target another 10-15% reduction only after
checking downstream skills that cite workflow definitions and confirming Step
8 still catches unrequested elaborations.
