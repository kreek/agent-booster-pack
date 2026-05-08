---
name: observability
description: Use for observability, logs, metrics, traces, health checks, dashboards, alerts, and SLOs.
---

# Observability

## Iron Law

`NO USER-REACHABLE SERVICE PATH SHIPS BLIND.`

## When to Use

- Logs, metrics, traces, health checks, dashboards, SLOs, alerts,
  dependency health, incident diagnosis, OpenTelemetry, RED/USE,
  cardinality, exemplars, or burn-rate alerts.

## When NOT to Use

- Local-only scripts or libraries with no operational surface.
- Error type design; use `error-handling`.
- Release sequencing; use `release`.

## Core Ideas

1. Instrument behavior customers depend on, not just process internals.
2. Logs are structured events with stable names, typed fields,
   severity, outcome, and trace/correlation IDs. JSON alone is not
   enough.
3. Use OpenTelemetry semantic conventions where they exist before
   inventing custom field names.
4. Metrics need bounded labels; cardinality is a production cost and
   reliability risk.
5. Traces show cross-boundary causality; logs explain decisions.
6. Critical dependencies need visible latency, error, timeout, retry,
   circuit-breaker, and saturation signals.
7. Alerts are SLO-backed and actionable, with runbooks and escalation.
8. Health checks separate liveness from readiness.
9. Sensitive data is redacted at source; collector filtering is
   defense in depth.

## Workflow

1. Identify the user-facing path, dependency, queue, or resource being
   observed. Choose RED for request paths, USE for resources.
2. Add structured logs, metrics, and spans per project conventions;
   for logging changes, load `references/logging.md` to set event
   names, required fields, level policy, and payload rules.
3. Bound labels and high-cardinality log fields; redact sensitive
   fields at the source. Add dashboards that answer "is it broken?"
   and "where?" quickly. Add alerts only when action is clear and a
   runbook exists.

## Verification

- [ ] New user-reachable paths emit request/error/duration or
      equivalent RED signal.
- [ ] Logs are structured with stable event names, typed fields,
      severity, outcome, and trace/correlation ID; levels distinguish
      expected client failures from operator-actionable errors.
- [ ] Traces cover important inbound and outbound boundaries.
- [ ] Critical dependencies emit latency, error, timeout, retry, and
      saturation or circuit-state signals.
- [ ] Metric labels are bounded; high-cardinality log attributes are
      intentional.
- [ ] No secrets, tokens, raw PII, payment data, or unreviewed payload
      bodies appear in logs, metrics, or spans.
- [ ] Liveness does not depend on external systems; readiness does.
- [ ] Alerts link to runbooks with immediate action and escalation.
- [ ] Dashboards answer health, latency, errors, saturation, and
      dependency state.
- [ ] For prototypes, deferred observability is recorded and the path
      is promoted to the full checklist before real users.

## Handoffs

- Use `documentation` for runbook shape.
- Use `async-systems` for stream lag, fanout, replay, consumer group, and
  delivery semantics before instrumenting them.
- Use `release` for rollout gates and production verification.
- Use `error-handling` for remote dependency timeout, retry, and
  circuit-breaker behavior before instrumenting it.

## References

- `references/logging.md`: structured and semantic logging rules.
- OpenTelemetry: <https://opentelemetry.io/>
- Google SRE Workbook, alerting on SLOs:
  <https://sre.google/workbook/alerting-on-slos/>
- RED/USE overview: <https://www.brendangregg.com/usemethod.html>
