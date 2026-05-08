# Debugging Skill Tightening Audit

Source: `agents/.agents/skills/debugging/SKILL.md`

Current length: 585 words.

## Keep

- The skill is already short.
- The workflow is crisp and evidence-first.
- The tripwires are practical and catch common debugging failure modes.

## Tightening Opportunities

1. Combine Core Ideas 1 and Workflow steps 1-2 only if needed.
   There is some repetition around reproduction, hypotheses, and experiments,
   but it is useful reinforcement. Any edit should be conservative.

2. Shorten incident language.
   Incident follow-up guidance appears in Core Ideas and Verification. If the
   skill needs trimming, one of those can point to the other.

3. Merge proof handoffs.
   `proof` appears twice in Handoffs. Combine into one row for fix claims and
   regression test shape.

## Do Not Tighten

- Do not remove "after the third experiment, keep a short debug log." It is a
  concrete behavior change.
- Do not weaken "fix only after evidence identifies the cause."

## Suggested Shape

Mostly leave as-is. A small cleanup could save 30-50 words.
