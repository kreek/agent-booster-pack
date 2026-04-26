# Go

Use this before scaffolding fresh Go projects.

## Defaults

- Package manager/build: Go modules with `go.mod` and `go.sum`.
- Router default: stdlib `net/http` with the modern `ServeMux` (method
  matching such as `GET /users/{id}`, wildcards, and `Request.PathValue()`). It
  subsumes most of what third-party routers were historically used for.
- Structured router when more is wanted: Chi: zero dependencies, fully
  `net/http`-compatible, middleware ecosystem, route groups, sub-routers.
- `gorilla/mux` is archived; do not scaffold it into new projects.
- Only reach for a heavier framework when the app actually needs the ecosystem,
  middleware set, or FastHTTP performance profile.

## Choose

- Stdlib `net/http` + `ServeMux` for APIs, services, libraries, and tiny CLIs.
  This is the default.
- Chi when the app benefits from middleware composition, route groups, or typed
  error handling, but the code should still look like idiomatic `net/http`.
- Gin when the broader Gin ecosystem, middleware set, or high-throughput
  conventions matter.
- Fiber when the team has chosen FastHTTP's perf profile and is OK with a
  non-`net/http` handler signature and different middleware surface.

## Minimum Scaffold

- `go.mod`, `go.sum`, `cmd/` or feature-oriented package layout, and one
  request-level smoke test hitting the router directly or through `httptest`.
- Commands: `go test ./...`, `go fmt ./...`, and `go vet ./...`. Add
  `staticcheck` when available.
- Framework-native router setup (stdlib mux or Chi): no hand-rolled request
  parsing or method/path switching.

## Sources

- Go modules: https://go.dev/doc/modules/
- Routing enhancements in stdlib `net/http`:
  https://go.dev/blog/routing-enhancements
- `net/http`: https://pkg.go.dev/net/http
- Chi: https://github.com/go-chi/chi
- Gin: https://gin-gonic.com/docs/
- Fiber: https://docs.gofiber.io/
