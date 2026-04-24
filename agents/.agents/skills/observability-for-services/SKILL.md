---
name: observability-for-services
description:
  Use when adding logging, metrics, traces, health checks, dashboards, or
  alerts; when discussing SLOs, SLIs, error budgets, RED, USE, or Four Golden
  Signals; when instrumenting with OpenTelemetry; when diagnosing production
  incidents; or when the user mentions structured logging, cardinality,
  exemplars, or multi-window burn-rate alerting.
---

# Observability for Services

## OpenTelemetry as the Default

Use OTel for all new instrumentation. It is vendor-neutral, widely adopted, and
avoids lock-in to a specific backend.

- **Traces** — request flows across service boundaries. Use `TraceId`/`SpanId`
  everywhere.
- **Metrics** — aggregated measurements. Counters, histograms, gauges.
- **Logs** — structured events with context. Always include `trace_id` so logs
  correlate to traces.

**Correlation rule:** every log line emitted during a request must carry the
active `trace_id`. This is the single biggest force multiplier in debugging
production issues.

```python
# Always propagate trace context into logs
logger.info("payment processed",
    trace_id=span.context.trace_id,
    span_id=span.context.span_id,
    order_id=order.id,
    amount_cents=order.total_cents)
```

**Semantic conventions:** use stable OTel attribute names
(`http.request.method`, `server.address`, `url.path`). Do not invent custom keys
when a stable semconv exists. Set `OTEL_SEMCONV_STABILITY_OPT_IN=http` during
migration from legacy `net.*` attributes.

---

## Tracer-Bullet Instrumentation

Before tuning any signal, ship one request end-to-end that emits all three:

1. A trace span for the request.
2. A structured log line carrying `trace_id`.
3. A RED metric increment.

If any of the three is missing, the service is flying blind — fix before adding
features. When diagnosing a slow path, pull a trace with exemplars first. No
trace → add one → then diagnose. Don't guess.

---

## Wide Events vs Three Pillars

For new services, prefer one wide structured event per request (all fields on
the root span) over scattering context across logs + metrics + traces. Derive
metrics from events where the backend supports it. Keep metrics as a separate
signal only for cheap long-retention SLO/burn-rate math.

---

## Instrumentation Coverage Checklist

Every service exposes:

1. RED metrics on every inbound endpoint.
2. A root span per request.
3. Span events for retries, timeouts, circuit-breaker trips.
4. `/health/live` and `/health/ready`.
5. A build-info metric with `service.version` and `git.sha`.

---

## Which Signal Framework to Apply

| Framework                                   | Best for                                     | Key metrics                             |
| ------------------------------------------- | -------------------------------------------- | --------------------------------------- |
| **RED** (Rate / Errors / Duration)          | Request-driven services (HTTP, gRPC, queues) | req/s, error rate, p99 latency          |
| **USE** (Utilisation / Saturation / Errors) | Infrastructure resources (CPU, DB, queues)   | utilisation %, queue depth, error count |
| **Four Golden Signals**                     | Superset of RED + Saturation                 | latency, traffic, errors, saturation    |

Start with RED for any service that handles requests. Add USE metrics for the
resources that service depends on.

---

## Structured Logging Rules

1. **JSON always** in production. Human-readable logs are for local dev only.
2. **Stable keys.** Once a field name ships, treat it as a public API. Renaming
   breaks dashboards, alerts, and log parsers.
3. **ISO-8601 UTC** for all timestamps. `2026-04-23T11:00:00.000Z`, not epoch
   seconds, not local time.
4. **Four levels only:**
   - `ERROR` — page-worthy. Something is broken.
   - `WARN` — recurring = ticket. System is handling it but review it.
   - `INFO` — key lifecycle events. When unsure between WARN and INFO, pick INFO
     and add a structured `severity` field for query-time filtering.
   - `DEBUG` — verbose context. Off in production.
5. **No secrets in logs.** Mask tokens, passwords, PII before logging.
6. **Log the outcome, not the intent.** `payment_succeeded` not
   `attempting_payment`.
7. **Write for the 3am on-call human.** Every line names the entity
   (`order_id=…`), the outcome (`payment_succeeded=true`), and one causal hint
   (`reason=insufficient_funds`). Narrate the incident in the order a human
   would tell it.

---

## Sampling

- Head-sample traces at 1–10% for baseline load.
- Tail-sample (collector-side) to keep 100% of errors and p99 traces.
- Never sample out logs that carry a non-2xx status.

---

## PII and Redaction

Minimise telemetry at the source. Applications choose safe event fields and
redact, tokenize, or HMAC sensitive values before logs, spans, or metrics leave
the process. The OTel Collector's attributes/redaction processors are
defense-in-depth and central policy enforcement, not the primary control.

Wide events still obey this rule: rich context is useful only after secrets, raw
PII, payment data, and raw payload bodies have been excluded. If incident replay
needs raw data, store it as an encrypted short-retention artifact with audited
access, never in logs/traces/metrics.

---

## SLO-First Alerting

An alert should mean: "a human needs to act now." Everything else is a
dashboard.

Define an SLO as: "99.9% of requests succeed within 500ms over a 30-day window."
Derive an error budget: 30 days × 0.1% = 43.2 minutes.

Alert on budget burn using **multi-window multi-burn-rate**. Short window = long
window / 12.

| Long window | Short window | Burn rate | Alert type           |
| ----------- | ------------ | --------- | -------------------- |
| 1h          | 5m           | 14.4×     | Page (critical)      |
| 6h          | 30m          | 6×        | Page (high)          |
| 3d          | 2h           | 1×        | Ticket (low urgency) |

Thresholds: 2% budget in 1h pages, 5% in 6h pages, 10% in 3d tickets.

**Every alert links to a runbook** covering: what it means, immediate action,
escalation path.

**Error-budget policy, not just a number.** Every SLO ships with a written
policy specifying what happens at 50% and 100% burn (e.g. slow releases →
feature freeze → exec escalation). Without a policy the SLO is decoration.

---

## Cardinality Traps

High-cardinality labels on metrics will OOM your metrics backend and make
dashboards unusable.

**Never use as metric labels:**

- User IDs, order IDs, or any per-entity identifier
- Request body contents
- Timestamps
- Free-text error messages

**Do use as metric labels:**

- HTTP method, status code class (2xx/4xx/5xx)
- Service name, endpoint name (bounded set)
- Region, datacenter
- Feature flag name (bounded set)

High-cardinality data belongs in **traces** (via span attributes) or **logs**
(as structured fields), not metrics.

---

## Exemplars

Exemplars bridge the gap between metrics and traces. A histogram bucket can
store a sample `trace_id` alongside the measurement, letting you jump from "p99
is slow" directly to an example slow trace.

- Enable exemplars in Prometheus and OTel exporters where supported.
- Store at minimum: `trace_id`, `span_id`, timestamp.
- Grafana renders exemplars as dots on histogram visualisations when configured.

---

## Dashboard Design

One dashboard per audience (on-call / dev / exec). The **on-call dashboard
answers one question: is it broken right now?**

- Top row: RED metrics (rate, error rate, p99 latency).
- Second row: SLO burn rate and error budget remaining.
- Third row: dependency health (DB query time, downstream errors).
- Bottom: resource utilisation (CPU, memory, connection pool).

Everything else is exploratory — do it in the trace UI, not a dashboard.

---

## Health Checks

Expose two endpoints:

- `/health/live` — is the process alive? Returns 200 if the process can handle
  requests. Used by liveness probes.
- `/health/ready` — is the service ready to receive traffic? Returns 200 only if
  DB connections, caches, and required upstreams are healthy. Used by readiness
  probes.

Never block `/health/live` on slow external dependencies — that causes
unnecessary restarts. Keep liveness checks fast and local.

---

## Canon

- [The Pragmatic Programmer — Tracer Bullets (Topic 12)](https://www.oreilly.com/library/view/the-pragmatic-programmer/9780135956977/f_0030.xhtml)
- [Google SRE Workbook — Alerting on SLOs](https://sre.google/workbook/alerting-on-slos/)
- [Google SRE Book — Monitoring Distributed Systems](https://sre.google/sre-book/monitoring-distributed-systems/)
- [Implementing Service Level Objectives (Hidalgo)](https://www.oreilly.com/library/view/implementing-service-level/9781492076803/)
- [Distributed Systems Observability (Sridharan)](https://www.oreilly.com/library/view/distributed-systems-observability/9781492033431/)
- [OTel semantic conventions](https://opentelemetry.io/docs/specs/semconv/)
- [OTel HTTP metrics semconv](https://opentelemetry.io/docs/specs/semconv/http/http-metrics/)
- [OTel logs concepts](https://opentelemetry.io/docs/concepts/signals/logs/)
- [OTel sampling](https://opentelemetry.io/docs/concepts/sampling/)
- [OTel Collector](https://opentelemetry.io/docs/collector/)
- [Honeycomb — observability 1.0 vs 2.0](https://www.honeycomb.io/blog/one-key-difference-observability1dot0-2dot0)
- [charity.wtf — observability 2.0](https://charity.wtf/tag/observability-2-0/)
- [Grafana — multi-window multi-burn-rate implementation](https://grafana.com/blog/how-to-implement-multi-window-multi-burn-rate-alerts-with-grafana-cloud/)
- [Datadog — burn rate is a better error rate](https://www.datadoghq.com/blog/burn-rate-is-better-error-rate/)
- [Prometheus naming best practices](https://prometheus.io/docs/practices/naming/)
- [Kubernetes liveness/readiness probes](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/)
