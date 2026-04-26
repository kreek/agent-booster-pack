# API Evolution

Use this reference when a public HTTP API can change without a major
version if the change is additive and optional.

## Rule

An API can evolve without major versioning when existing endpoints
function as before and existing consumers can ignore the new endpoint,
field, query parameter, or header. Additions that require existing
consumers to change are breaking even if they look additive in the
schema.

## Evolutionary Changes

- Add a new endpoint.
- Add a new method to an existing path.
- Add an optional query parameter.
- Add an optional request or response field inside an object.
- Add an optional header.
- Rename a path or field by adding the successor, keeping the old
  contract, and marking the old name deprecated in OpenAPI.

## Breaking Changes

- Change the HTTP methods supported by an existing URI.
- Change status codes returned by an existing URI.
- Change the name or type of an existing request or response header.
- Make a new parameter, field, or header required.
- Remove or rename an endpoint, parameter, field, or header in place.
- Change semantics so an old request no longer means what it meant.

## Extensibility

Design response bodies for extension from the first version:

- Use unordered query parameters.
- Return arrays of errors when multiple request problems can exist.
- Prefer objects with named fields over positional arrays or flat
  scalar lists.
- Choose specific names that leave room for later distinctions, such as
  `mailingAddress` instead of `address` when another address role may
  appear.

Flat scalar lists are hard to evolve because there is nowhere to attach
new data. For example, a payment-history response that returns only an
array of IDs cannot later add payment dates without changing the item
shape. A response that returns resource objects with `id`, `type`, and
named `attributes` can add `paymentMethod` or `approvalDate` as optional
fields while old consumers continue to read the fields they know.

Adding optional pagination parameters to an unpaged collection can be
evolutionary only if the original call without those parameters still
behaves as before. If `GET /claims` used to return the full collection,
then `GET /claims?pageNumber=2&pageSize=10` can be added without a
major version only if `GET /claims` does not silently become paged.
