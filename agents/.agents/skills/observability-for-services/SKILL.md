---
name: observability-for-services
description: Use when adding logging, metrics, traces, health checks, dashboards, or alerts; when discussing SLOs, SLIs, error budgets, RED, USE, or Four Golden Signals; when instrumenting with OpenTelemetry; when diagnosing production incidents; or when the user mentions structured logging, cardinality, exemplars, or multi-window burn-rate alerting.
---

# Observability for Services

## OpenTelemetry as the Default

Use OTel for all new instrumentation. It is vendor-neutral, widely adopted, and avoids lock-in to a specific backend.

- **Traces** — request flows across service boundaries. Use `TraceId`/`SpanId` everywhere.
- **Metrics** — aggregated measurements. Counters, histograms, gauges.
- **Logs** — structured events with context. Always include `trace_id` so logs correlate to traces.

**Correlation rule:** every log line emitted during a request must carry the active `trace_id`. This is the single biggest force multiplier in debugging production issues.

```python
# Always propagate trace context into logs
logger.info("payment processed",
    trace_id=span.context.trace_id,
    span_id=span.context.span_id,
    order_id=order.id,
    amount_cents=order.total_cents)
```

---

## Which Signal Framework to Apply

| Framework | Best for | Key metrics |
|---|---|---|
| **RED** (Rate / Errors / Duration) | Request-driven services (HTTP, gRPC, queues) | req/s, error rate, p99 latency |
| **USE** (Utilisation / Saturation / Errors) | Infrastructure resources (CPU, DB, queues) | utilisation %, queue depth, error count |
| **Four Golden Signals** (Google SRE) | Superset of RED + Saturation | latency, traffic, errors, saturation |

Start with RED for any service that handles requests. Add USE metrics for the resources that service depends on.

---

## Structured Logging Rules

1. **JSON always** in production. Human-readable logs are for local dev only.
2. **Stable keys.** Once a field name ships, treat it as a public API. Renaming breaks dashboards, alerts, and log parsers.
3. **ISO-8601 UTC** for all timestamps. `2026-04-23T11:00:00.000Z`, not epoch seconds, not local time.
4. **Log levels with discipline:**
   - `ERROR` — something is broken and needs attention now.
   - `WARN` — something is wrong but the system is handling it. Review periodically.
   - `INFO` — key lifecycle events (service start, request complete, job finished).
   - `DEBUG` — verbose context useful during development. Off in production.
5. **No secrets in logs.** Mask tokens, passwords, PII before logging.
6. **Log the outcome, not the intent.** `payment_succeeded` not `attempting_payment`.

---

## SLO-First Alerting

An alert should mean: "a human needs to act now." Everything else is a dashboard.

**Alerting on SLOs (not raw metrics):**

Define an SLO as: "99.9% of requests succeed within 500ms over a 30-day window."

Derive an error budget: 30 days × 0.1% = 43.2 minutes of allowable bad minutes.

Alert when you're burning the budget too fast, using **multi-window multi-burn-rate** (Google SRE Workbook):

| Window | Burn rate | Alert type |
|---|---|---|
| 1h + 5m | 14× | Page (critical) |
| 6h + 30m | 6× | Page (high) |
| 3d + 6h | 1× | Ticket (low urgency) |

This avoids both alert fatigue (pure threshold alerts) and slow detection (single-window).

**Every alert links to a runbook.** The runbook answers: what does this mean, what's the immediate action, what's the escalation path.

---

## Cardinality Traps

High-cardinality labels on metrics will OOM your metrics backend and make dashboards unusable.

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

High-cardinality data belongs in **traces** (via span attributes) or **logs** (as structured fields), not metrics.

---

## Exemplars

Exemplars bridge the gap between metrics and traces. A histogram bucket can store a sample `trace_id` alongside the measurement, letting you jump from "p99 is slow" directly to an example slow trace.

- Enable exemplars in Prometheus and OTel exporters where supported.
- Store at minimum: `trace_id`, `span_id`, timestamp.
- Grafana renders exemplars as dots on histogram visualisations when configured.

---

## Dashboard Design

A dashboard should answer one question: **is it broken right now?**

- Top row: RED metrics for the service (rate, error rate, p99 latency).
- Second row: SLO burn rate and error budget remaining.
- Third row: dependency health (DB query time, downstream service errors).
- Bottom: resource utilisation (CPU, memory, connection pool).

Avoid dashboards with >20 panels. If you need more, split by audience (ops vs dev vs exec).

---

## Health Checks

Expose two endpoints:

- `/health/live` — is the process alive? Returns 200 if the process can handle requests. Used by liveness probes.
- `/health/ready` — is the service ready to receive traffic? Returns 200 only if DB connections, caches, and required upstreams are healthy. Used by readiness probes.

Never block `/health/live` on slow external dependencies — that causes unnecessary restarts. Keep liveness checks fast and local.
