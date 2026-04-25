---
name: observability
description:
  Use when adding logging, metrics, traces, health checks, dashboards, or
  alerts; when discussing SLOs, SLIs, error budgets, RED, USE, or Four Golden
  Signals; when instrumenting with OpenTelemetry; when diagnosing production
  incidents; or when the user mentions structured logging, semantic logging, log
  levels, cardinality, exemplars, or multi-window burn-rate alerting.
---

# Observability

## Iron Law

`NO USER-REACHABLE SERVICE PATH SHIPS BLIND.`

If production can call it, production must be able to explain whether it is
healthy, slow, failing, or saturated.

## When to Use

- Logs, metrics, traces, health checks, dashboards, SLOs, alerts, incident
  diagnosis, OpenTelemetry, RED/USE, cardinality, exemplars, or burn-rate
  alerts.

## When NOT to Use

- Local-only scripts or libraries with no operational surface.
- Error type design; use `error-handling`.
- Deployment sequencing; use `deployment`.

## Core Ideas

1. Instrument behavior customers depend on, not just process internals.
2. Logs are structured events with stable names, typed fields, severity,
   outcome, and trace/correlation IDs. JSON alone is not enough.
3. Use OpenTelemetry semantic conventions where they exist before inventing
   custom field names.
4. Metrics need bounded labels; cardinality is a production cost and reliability
   risk.
5. Traces show cross-boundary causality; logs explain decisions.
6. Alerts are SLO-backed and actionable, with runbooks and escalation.
7. Health checks separate liveness from readiness.
8. Sensitive data is redacted at source; collector filtering is defense in
   depth.

## Workflow

1. Identify the user-facing path, dependency, queue, or resource being observed.
2. Choose RED for request paths and USE for resources.
3. Add structured logs, metrics, and spans using the project's conventions.
4. For logging changes, read `references/logging.md` and define event names,
   required fields, level policy, and safe payload rules.
5. Bound labels and high-cardinality log fields; redact sensitive fields at the
   source.
6. Add dashboards that answer "is it broken?" and "where?" quickly.
7. Add alerts only when action is clear and a runbook exists.

## Verification

- [ ] New user-reachable paths emit request/error/duration or equivalent RED
      signal.
- [ ] Logs are structured with stable event names, typed fields, severity,
      outcome, and trace/correlation ID.
- [ ] Log levels distinguish expected user/client failures from service
      degradation and operator-actionable errors.
- [ ] Traces cover important inbound and outbound boundaries.
- [ ] Metric labels are bounded and do not include per-user/entity IDs.
- [ ] High-cardinality log attributes are intentional and not indexed by default
      without a reason.
- [ ] No secrets, tokens, raw PII, payment data, or unreviewed payload bodies
      appear in logs, metrics, or spans.
- [ ] Liveness does not depend on external systems; readiness does.
- [ ] Alerts link to runbooks with immediate action and escalation.
- [ ] Dashboards answer health, latency, errors, saturation, and dependency
      state.

## Risk Tier

For prototypes, record what production observability is intentionally deferred.
Before real users, promote the path to the full checklist.

## Handoffs

- Use `docs` for runbook shape.
- Use `realtime` for stream lag, fanout, replay, consumer group, and delivery
  semantics before instrumenting them.
- Use `deployment` for rollout gates and production verification.
- Use `resilience` for remote dependency failure behavior.

## References

- `references/logging.md`: structured and semantic logging rules.
- OpenTelemetry: <https://opentelemetry.io/>
- Google SRE Workbook, alerting on SLOs:
  <https://sre.google/workbook/alerting-on-slos/>
- RED/USE overview: <https://www.brendangregg.com/usemethod.html>
