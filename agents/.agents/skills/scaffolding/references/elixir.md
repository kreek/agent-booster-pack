# Elixir

Use this before scaffolding fresh Elixir projects.

## Defaults

- Package/build tool: Mix with Hex dependencies and `mix.lock`.
- Elixir features to rely on for new code: **type checking of function calls**,
  **built-in JSON**, and `mix format --migrate` to carry older patterns forward.
- Lightweight/API default: Plug running on **Bandit** (pure Elixir,
  async-friendly, WebSocket-native) when the service is truly minimal.
- Robust/full-stack default: Phoenix. Phoenix now uses **Bandit** as its default
  web server — Cowboy is legacy. **LiveView is the default interactive tier**;
  reach for channels only when LiveView is not the shape of the problem.
- Do not hand-roll Cowboy/Bandit wiring for app scaffolds when Plug or Phoenix
  provides the conventions.

## Choose

- Phoenix for most web apps, APIs, LiveView apps, channels, full-stack apps, and
  production services.
- Plug + Bandit for very small APIs or middleware-focused services where Phoenix
  would be overkill.
- Plain Mix project for libraries, OTP applications, and command-line tools.

## Minimum Scaffold

- `mix.exs`, `mix.lock` when dependencies exist, ExUnit test setup, formatter
  config, and app supervision where relevant.
- Commands: `mix test`, `mix format --check-formatted`, and
  `mix compile --warnings-as-errors` when appropriate.
- Framework-native route/plug plus one request smoke test.

## Sources

- Mix: https://hexdocs.pm/mix/
- Hex: https://hex.pm/docs
- Elixir language docs: https://elixir-lang.org/docs.html
- Phoenix: https://hexdocs.pm/phoenix/
- Phoenix LiveView: https://hexdocs.pm/phoenix_live_view/
- Plug: https://hexdocs.pm/plug/
- Bandit: https://hexdocs.pm/bandit/
