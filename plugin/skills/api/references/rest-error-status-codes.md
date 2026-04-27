# REST Error Status Codes

Use this decision tree when choosing HTTP status codes for REST API errors.
Choose by where the failure originates, then translate to a stable public error
contract. Never pass raw upstream or internal errors through to consumers.

## Request-Origin Errors

Use `4xx` when the consumer can change the request to make it succeed.

- `401 Unauthorized`: the caller is not authenticated or the credentials are
  missing, expired, malformed, or invalid.
- `403 Forbidden`: the caller is authenticated but is not allowed to perform the
  action or access the resource.
- `429 Too Many Requests`: the caller exceeded a documented rate or quota limit.
- `404 Not Found`: the requested resource does not exist or must not be
  disclosed to this caller.
- `400 Bad Request`: the request syntax, envelope, query syntax, media type, or
  general request shape is malformed.
- `422 Unprocessable Entity`: the request is syntactically valid, but one or
  more values violate domain rules.

Return all actionable request errors together when practical. If multiple
request errors have different specific `4xx` statuses, use the documented API
contract for that operation: either the most specific status or a generic `400`
with per-field details. Do not report client and server-origin failures together
as a client error.

## Upstream-Origin Errors

Use `5xx` gateway-style statuses when your API depends on another service and
the dependency prevents your API from satisfying the request.

- `503 Service Unavailable`: the upstream service is unavailable, overloaded,
  down for maintenance, or cannot currently accept requests.
- `504 Gateway Timeout`: the upstream service did not respond within the timeout
  budget.
- `502 Bad Gateway`: the upstream service responded, but with an invalid,
  unusable, or failed response that your API cannot translate into success.

Always map upstream failures into your public error shape. Do not leak upstream
hostnames, stack traces, SQL, raw payloads, vendor-specific error bodies, or
other implementation details.

## Application-Origin Errors

Use `500 Internal Server Error` for unexpected faults in your API application or
its components after request and upstream causes have been ruled out.

At gateway, load-balancer, or platform boundaries, your own service being
unavailable may surface as `503`, and your own service timing out may surface as
`504`. Application code should still classify the underlying fault so logs,
metrics, traces, and correlation IDs can explain it.

## Response Shape

Use one consistent error schema per API. Problem Details, JSON:API errors, or a
domain-required schema such as FHIR OperationOutcome are all acceptable when
used consistently.

- `status` matches the HTTP status code.
- `title` names the generic error class and remains stable across the API.
- `detail` explains the specific failure in safe, actionable language.
- `source` points to the offending request field, parameter, or header when the
  error originates in the request.
- `correlation_id` or equivalent connects the consumer-facing error to internal
  logs without exposing internals.
