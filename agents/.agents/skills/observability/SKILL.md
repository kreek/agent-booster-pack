---
name: observability
description:
  Use when adding logging, metrics, traces, health checks, dashboards, or
  alerts; when discussing SLOs, SLIs, error budgets, RED, USE, or Four Golden
  Signals; when instrumenting with OpenTelemetry; when diagnosing production
  incidents; or when the user mentions structured logging, cardinality,
  exemplars, or multi-window burn-rate alerting.
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
- Error type design; use `errors`.
- Deployment sequencing; use `deployment`.

## Core Ideas

1. Instrument behavior customers depend on, not just process internals.
2. Use stable structured events with correlation/trace IDs.
3. Metrics need bounded labels; cardinality is a production cost and reliability
   risk.
4. Traces show cross-boundary causality; logs explain decisions.
5. Alerts are SLO-backed and actionable, with runbooks and escalation.
6. Health checks separate liveness from readiness.
7. Sensitive data is redacted at source; collector filtering is defense in
   depth.

## Workflow

1. Identify the user-facing path, dependency, queue, or resource being observed.
2. Choose RED for request paths and USE for resources.
3. Add structured logs, metrics, and spans using the project's conventions.
4. Bound labels and redact sensitive fields.
5. Add dashboards that answer "is it broken?" and "where?" quickly.
6. Add alerts only when action is clear and a runbook exists.

## Verification

- [ ] New user-reachable paths emit request/error/duration or equivalent RED
      signal.
- [ ] Logs carry stable keys and trace/correlation ID.
- [ ] Traces cover important inbound and outbound boundaries.
- [ ] Metric labels are bounded and do not include per-user/entity IDs.
- [ ] No secrets, raw PII, or payment data appears in logs, metrics, or spans.
- [ ] Liveness does not depend on external systems; readiness does.
- [ ] Alerts link to runbooks with immediate action and escalation.
- [ ] Dashboards answer health, latency, errors, saturation, and dependency
      state.

## Risk Tier

For prototypes, record what production observability is intentionally deferred.
Before real users, promote the path to the full checklist.

## Handoffs

- Use `documentation` for runbook shape.
- Use `deployment` for rollout gates and production verification.
- Use `resilience` for remote dependency failure behavior.

## References

- OpenTelemetry: <https://opentelemetry.io/>
- Google SRE Workbook, alerting on SLOs:
  <https://sre.google/workbook/alerting-on-slos/>
- RED/USE overview: <https://www.brendangregg.com/usemethod.html>
