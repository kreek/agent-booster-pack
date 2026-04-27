# Browser Streaming

Use this when the realtime surface is a browser or HTTP client.

## Defaults

- Start here for user-facing live updates. Push polling, SSE, and WebSockets as
  far as they can reasonably go before introducing Kafka, Kinesis, Redis
  Streams, or another broker.
- Polling is acceptable for low-frequency updates, simple compatibility, or
  prototypes where freshness tolerance is measured in seconds or minutes.
- SSE is the default for one-way server-to-browser updates: notifications,
  progress, dashboards, activity feeds, status streams, and model/token output.
- WebSockets are for bidirectional messaging, client-to-server low-latency
  input, collaborative editing, games, presence, and protocols that need both
  sides to speak continuously.
- If backend services need durable events, keep the browser surface simple and
  bridge from the durable stream internally instead of exposing broker
  complexity to the frontend.

## Design Rules

- Name the reconnect behavior. SSE clients can reconnect; define event IDs and
  resume behavior when loss matters.
- Keep heartbeats explicit so intermediaries do not silently kill idle streams.
- Bound fanout and per-client buffers. Slow clients must not exhaust server
  memory.
- Use authentication and authorization per stream, not only per initial page.
- For SSE, send events with stable names and JSON payloads; avoid overloading a
  single unversioned `message` event for every shape.
- For WebSockets, define message schema, versioning, ping/pong, close codes, and
  backpressure behavior.
- Escalate to a broker only for a named requirement: independent replay, long
  retention, audit history, offline catch-up, multi-service fanout,
  consumer-group scaling, partitioned throughput, or durable recovery.

## Sources

- MDN Server-sent events:
  https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events
- MDN EventSource: https://developer.mozilla.org/en-US/docs/Web/API/EventSource
- MDN WebSocket: https://developer.mozilla.org/en-US/docs/Web/API/WebSocket
