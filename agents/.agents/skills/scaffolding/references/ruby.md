# Ruby

Use this before scaffolding fresh Ruby projects.

## Defaults

- Package manager: Bundler with `Gemfile` and `Gemfile.lock`.
- Ruby runtime: target the current stable Ruby. YJIT is on by default; no extra
  tuning required.
- Lightweight/API defaults: Sinatra, Hanami, or Roda. Sinatra for minimal
  route-handler style; Hanami when a clean-architecture app with slices and
  explicit boundaries is wanted; Roda for routing-tree minimalism with a small
  core and plugin-driven surface.
- Robust/full-stack default: modern Ruby on Rails with Solid Queue, Solid Cache,
  and Solid Cable: Redis is no longer a hard dependency, as the Solid Trifecta
  is database-backed. Asset pipeline is Propshaft (Sprockets is legacy). The
  built-in authentication generator scaffolds session-based auth.
- Deploy default for Rails apps without an existing PaaS choice: Kamal.
- Avoid raw Rack app scaffolds for web apps unless the user asks or the project
  is a tiny library/teaching example.

## Choose

- Sinatra for small APIs, focused services, demos, and minimal web apps.
- Hanami when the app benefits from explicit app/slice boundaries, dry-rb
  ecosystem, and functional core / imperative shell conventions.
- Roda for tiny APIs and libraries that need routing without a full framework,
  or for routing-tree-first apps.
- Rails when conventions for routing, MVC, Active Record, migrations, jobs
  (Solid Queue), cache (Solid Cache), Action Cable (Solid Cable), mailers,
  assets (Propshaft), or full-stack app structure matter.

## Minimum Scaffold

- `Gemfile`, `Gemfile.lock`, standard test setup (Minitest or RSpec), and
  lint/format commands (RuboCop/Standard) where applicable.
- Framework-native app entrypoint and routes.
- One request-level smoke test.
- For Rails apps: include `config/deploy.yml` when Kamal is the deploy path.

## Sources

- Bundler: https://bundler.io/
- Ruby: https://www.ruby-lang.org/en/documentation/
- Sinatra: https://sinatrarb.com/
- Hanami: https://hanamirb.org/
- Roda: https://roda.jeremyevans.net/documentation.html
- Rails Guides: https://guides.rubyonrails.org/
- Kamal: https://kamal-deploy.org/
