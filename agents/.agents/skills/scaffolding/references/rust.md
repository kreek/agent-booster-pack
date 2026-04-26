# Rust

Use this before scaffolding fresh Rust projects.

## Defaults

- Package/build tool: Cargo.
- Edition: use the current stable **Rust edition** for new crates; pin the MSRV
  to what the edition requires and bump it intentionally. Link: the edition
  guide below.
- API default: **Axum** (Tokio team, Hyper + Tower stack, typed extractors).
- Async runtime: Tokio.
- Heavier/performance-focused alternative: Actix Web when its ecosystem, actor
  model, or raw throughput profile is decisive.
- ORM default for greenfield: **SeaORM** (async-first, SeaQL ecosystem). Use
  `sqlx` when you want hand-written SQL with compile-time verification. Diesel
  is acceptable only for repos already on it.
- Avoid hand-rolled hyper/TCP servers for web apps unless the user asks, the
  project is a library, or protocol work is the point.

## Choose

- Axum for most Rust HTTP APIs and services: especially when Tokio ecosystem
  integration and Tower-style middleware are useful.
- Actix Web when its ecosystem, performance profile, or an existing project
  convention is a better fit.
- SeaORM for typed, async database access with relations, migrations, and CLI
  tooling.
- `sqlx` for query-first codebases where raw SQL and compile-time checked
  queries are the point.
- Full-stack Rust: **Leptos** for SSR web apps with server functions and
  streaming HTML; **Dioxus** for cross-platform (web/desktop/mobile) with a
  React/JSX-like model.

## Minimum Scaffold

- `Cargo.toml` (with current edition), `Cargo.lock` for applications,
  `src/main.rs`, and one request-level test or route smoke test.
- Commands: `cargo test`, `cargo fmt --check`, and `cargo clippy -- -D warnings`
  when clippy is available.
- Framework-native router and error shape; avoid hand-rolled request handling.

## Sources

- Cargo: https://doc.rust-lang.org/cargo/
- Rust editions guide: https://doc.rust-lang.org/edition-guide/
- Axum: https://docs.rs/axum/
- Actix Web: https://actix.rs/docs/
- Tokio: https://tokio.rs/
- SeaORM: https://www.sea-ql.org/SeaORM/
- sqlx: https://github.com/launchbadge/sqlx
- Leptos: https://leptos.dev/
- Dioxus: https://dioxuslabs.com/
