# Observability Skill Tightening Audit

Source: `agents/.agents/skills/observability/SKILL.md`

Current length: 495 words.

## Keep

- This skill is already short and operational.
- Structured logs, bounded metrics labels, redaction, liveness/readiness, and
  actionable alerts are the right core.

## Tightening Opportunities

1. Merge Risk Tier into When NOT/Verification.
   The prototype caveat is useful, but a separate section may be heavier than
   needed for two sentences.

2. Shorten Workflow step 2.
   Logging reference, event names, required fields, level policy, and payload
   rules can be one compact instruction.

3. Combine dashboard and alert guidance.
   Workflow and Verification both cover dashboards, alerts, runbooks, and
   escalation. Keep one concise checklist item for each.

## Do Not Tighten

- Do not remove source redaction; it is a safety boundary.
- Do not remove liveness/readiness separation.

## Suggested Shape

Leave mostly as-is. A 5-10% reduction is possible but not necessary.
