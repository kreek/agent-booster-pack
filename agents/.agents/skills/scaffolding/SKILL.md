---
name: scaffolding
description:
  Use when bootstrapping a new project, scaffolding a new repo, initialising a
  new application from scratch, or adding baseline tooling — package manager,
  linter, formatter, type or syntax checker, test runner, code coverage — to a
  project that lacks it. Also use when setting up initial CI, defining standard
  package scripts (test, lint, format, typecheck), or picking defaults for a
  greenfield project. Covers Node, Python, Rust, Go, Ruby, Java/Kotlin, Swift,
  .NET, Elixir, and PHP.
---

# Scaffolding

A greenfield project without a linter, formatter, type check, test runner, and
coverage tool is a half-built project. Set the floor before writing features.

---

## Baseline every project must have

| Layer               | Purpose                                                  |
| ------------------- | -------------------------------------------------------- |
| Package manager     | Reproducible installs. Lockfile committed                |
| Formatter           | One canonical style. Not a matter of opinion             |
| Linter              | Rule-based defect catcher. Distinct from formatter       |
| Type / syntax check | Static verification before runtime                       |
| Test runner         | Executes the spec. Fast, deterministic                   |
| Coverage tool       | Reports what the spec reached. A signal, not a target    |
| CI                  | Runs all of the above on every push                      |
| `.gitignore`        | Excludes build output, deps, secrets, IDE state          |
| README              | What + run steps + test steps. See `documentation` skill |

Do not skip any of these. "We'll add it later" means never.

---

## Per-language defaults (2026)

### Node.js / TypeScript

| Layer       | Default                                      | Notes                                                      |
| ----------- | -------------------------------------------- | ---------------------------------------------------------- |
| Package mgr | **pnpm**                                     | `package.json` → `"packageManager": "pnpm@10.x"`           |
| Formatter   | **Biome** (or Prettier)                      | Biome covers format + lint in one tool; Prettier is stable |
| Linter      | **Biome** (or ESLint + `@typescript-eslint`) | Biome if you picked it above; otherwise ESLint flat config |
| Type check  | **tsc --noEmit**                             | `"strict": true` in tsconfig                               |
| Test runner | **Vitest**                                   | Bundler-integrated, fast, Jest-API-compatible              |
| Coverage    | **Vitest built-in** (v8)                     | `vitest run --coverage`                                    |

Minimum scripts in `package.json`:

```json
{
  "scripts": {
    "dev": "…",
    "build": "…",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "typecheck": "tsc --noEmit",
    "lint": "biome check .",
    "format": "biome format --write ."
  }
}
```

### Python

| Layer       | Default                          | Notes                                                    |
| ----------- | -------------------------------- | -------------------------------------------------------- |
| Package mgr | **uv**                           | `pyproject.toml` + `uv.lock`. Replaces pip/pipenv/poetry |
| Formatter   | **ruff format**                  | Replaces black. Shipped in ruff                          |
| Linter      | **ruff check**                   | Replaces flake8/pylint/isort. One tool                   |
| Type check  | **mypy** or **pyright**          | Pyright is faster; mypy has broader ecosystem support    |
| Test runner | **pytest**                       | With `pytest-describe` for spec-style naming             |
| Coverage    | **coverage.py** via `pytest-cov` | `pytest --cov=src --cov-report=term-missing`             |

Minimum `pyproject.toml`:

```toml
[project]
name = "…"
requires-python = ">=3.12"

[tool.ruff]
line-length = 100
target-version = "py312"

[tool.pytest.ini_options]
addopts = "--cov=src --cov-report=term-missing"

[tool.mypy]
strict = true
```

### Rust

| Layer       | Default                         | Notes                                 |
| ----------- | ------------------------------- | ------------------------------------- |
| Package mgr | **cargo** (only option)         | `Cargo.toml` + `Cargo.lock` committed |
| Formatter   | **rustfmt**                     | `cargo fmt`                           |
| Linter      | **clippy**                      | `cargo clippy -- -D warnings`         |
| Type check  | **rustc** (built in)            | Runs on every build                   |
| Test runner | **cargo test**                  | Built-in                              |
| Coverage    | **cargo-llvm-cov** or **grcov** | llvm-cov is simpler; grcov for CI     |

### Go

| Layer       | Default                   | Notes                                    |
| ----------- | ------------------------- | ---------------------------------------- |
| Package mgr | **go modules** (built in) | `go.mod` + `go.sum` committed            |
| Formatter   | **gofmt** / **goimports** | Non-negotiable                           |
| Linter      | **golangci-lint**         | Umbrella over vet, staticcheck, and more |
| Type check  | **go build / go vet**     | Built in                                 |
| Test runner | **go test**               | Built in; `-race` in CI                  |
| Coverage    | **go test -cover**        | Built in                                 |

### Ruby

| Layer       | Default                          | Notes                                           |
| ----------- | -------------------------------- | ----------------------------------------------- |
| Package mgr | **bundler**                      | `Gemfile` + `Gemfile.lock`                      |
| Formatter   | **rubocop -A** or **standardrb** | Standard is less configurable                   |
| Linter      | **rubocop**                      | Same tool as formatter                          |
| Type check  | **sorbet** or **RBS**            | Optional; adopt for ≥10k-line projects          |
| Test runner | **rspec**                        | Spec-style matches the `behavior-testing` skill |
| Coverage    | **simplecov**                    | Add to `spec_helper.rb`                         |

### Java / Kotlin

| Layer       | Java default                        | Kotlin default            |
| ----------- | ----------------------------------- | ------------------------- |
| Package mgr | **gradle** (unless Maven locked in) | **gradle**                |
| Formatter   | **spotless** (via gradle)           | **ktlint** or **ktfmt**   |
| Linter      | **checkstyle**, **PMD**             | **detekt**                |
| Type check  | **javac**                           | **kotlinc**               |
| Test runner | **JUnit 5**                         | **Kotest** or **JUnit 5** |
| Coverage    | **JaCoCo**                          | **JaCoCo**                |

### Swift

| Layer       | Default                                                     |
| ----------- | ----------------------------------------------------------- |
| Package mgr | **SwiftPM** (`Package.swift`)                               |
| Formatter   | **swift-format** (Apple) or **SwiftFormat** (Nick Lockwood) |
| Linter      | **SwiftLint**                                               |
| Type check  | **swiftc** (built in)                                       |
| Test runner | **XCTest** (or **swift-testing**)                           |
| Coverage    | `swift test --enable-code-coverage`                         |

### .NET / C#

| Layer       | Default                              |
| ----------- | ------------------------------------ |
| Package mgr | **dotnet** + **NuGet**               |
| Formatter   | **dotnet format**                    |
| Linter      | **Roslyn analyzers**, **Roslynator** |
| Type check  | **dotnet build**                     |
| Test runner | **xUnit**                            |
| Coverage    | **coverlet** + **ReportGenerator**   |

### Elixir

| Layer       | Default                         |
| ----------- | ------------------------------- |
| Package mgr | **mix** + **Hex**               |
| Formatter   | **mix format**                  |
| Linter      | **credo**                       |
| Type check  | **dialyzer** (via **dialyxir**) |
| Test runner | **ExUnit**                      |
| Coverage    | **excoveralls**                 |

### PHP

| Layer       | Default                               |
| ----------- | ------------------------------------- |
| Package mgr | **composer**                          |
| Formatter   | **PHP-CS-Fixer** or **Laravel Pint**  |
| Linter      | **PHPStan** (levels 1–9) or **Psalm** |
| Type check  | **PHPStan** / **Psalm** (same tools)  |
| Test runner | **Pest** (spec-style) or **PHPUnit**  |
| Coverage    | **pcov** + PHPUnit/Pest coverage flag |

---

## Standardise the task names

Every project, regardless of language, should expose the same named tasks
(through `package.json` scripts, `Makefile`, `justfile`, or the native build
tool):

| Task            | Purpose                                        |
| --------------- | ---------------------------------------------- |
| `test`          | Run the full test suite, exit non-zero on fail |
| `test:watch`    | Same as above but watch mode                   |
| `lint`          | Run the linter, exit non-zero on fail          |
| `format`        | Apply the formatter in place                   |
| `typecheck`     | Run the type or syntax check, exit non-zero    |
| `coverage`      | Run tests with coverage reporting              |
| `dev` / `start` | Local development entry point                  |

An agent given a new project directory should be able to discover all of these
by name. Don't invent a new name per project.

---

## CI skeleton

Every repo gets at least this:

```yaml
# .github/workflows/ci.yml — adapt per ecosystem
name: CI
on: [push, pull_request]
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4 # or equivalent per ecosystem
      - run: pnpm install --frozen-lockfile
      - run: pnpm typecheck
      - run: pnpm lint
      - run: pnpm test
```

Rules:

- **All four checks gate the merge**: typecheck, lint, test, and coverage
  threshold (if one is set).
- **Use the frozen-lockfile install flag.** `pnpm install --frozen-lockfile`,
  `uv sync --frozen`, `bundle install --frozen`, `go mod download`, etc.
- **Cache dependencies** — most setup actions do this for free.
- **Do not skip on missing tests.** If the test command fails because no tests
  exist yet, fix that before merging.

---

## Coverage is a signal, not a target

- Use coverage to find unreached code, not to hit a number.
- A 100% coverage line that only exists because of trivial glue is dead weight.
- A 60% coverage project with every user-facing behavior proven beats a 95%
  project full of assertions on getters.
- Set a **minimum** threshold that prevents regressions (70–80% is typical), not
  a **maximum**. The goal is every user behavior has at least one test; coverage
  percentage tracks that as a side effect.

Pair this skill with `behavior-testing` — that skill tells you what the tests
should look like. This skill tells you the tooling is in place to run them.

---

## `.gitignore` essentials

At minimum ignore:

- Dependency trees: `node_modules/`, `.venv/`, `vendor/`, `target/`, `build/`,
  `dist/`, `.gradle/`.
- Editor / IDE: `.idea/`, `.vscode/`, `*.swp`, `.DS_Store`.
- Env files: `.env`, `.env.local`, `*.key`, `*.pem`.
- Test output: `coverage/`, `.nyc_output/`, `.pytest_cache/`, `.mypy_cache/`.
- Logs: `*.log`, `logs/`.

Check the ecosystem-specific `gitignore.io` template before writing from
scratch.

---

## Pre-commit hooks

Optional but strongly recommended. Prevents broken commits reaching the branch.

- Node / mixed: **husky** + **lint-staged**.
- Any language: **pre-commit** (Python-based, language-agnostic framework).

Run, at minimum: formatter on staged files, linter on staged files, and the
typecheck if it's fast. Skip the test suite if it takes > 10 s — that belongs in
CI.

---

## Decision flow for a fresh project

1. **Pick the language and framework** — answer the user's request.
2. **Initialise with the modern tool chain above** for that ecosystem.
3. **Commit the empty-but-configured skeleton** before writing any feature code.
   That commit is `chore: scaffold <project>` or similar.
4. **Write one smoke test** that proves the test runner + build + typecheck
   actually run clean. `it "boots"` / `it "renders the landing page"`.
5. **Then** start feature work. The `behavior-testing` skill now governs what to
   test; this skill stops being relevant until the next project.

---

## Anti-patterns

- Deferring lint/format/typecheck setup "until the project grows". It never
  grows correctly without them.
- Committing generated artefacts (`dist/`, `build/`, `target/`).
- Different tools per sibling package in a monorepo. Standardise across the
  whole repo.
- Coverage gate of 100%. Signals target-optimisation, not quality.
- CI that only runs tests. Lint and typecheck catch different defects.
- `.env` with real secrets, committed. Use `.env.example` for shape, keep real
  values in the secret manager.

---

## References

- pnpm — https://pnpm.io/
- Biome — https://biomejs.dev/
- Vitest — https://vitest.dev/
- Prettier — https://prettier.io/
- ESLint (flat config) —
  https://eslint.org/docs/latest/use/configure/configuration-files
- uv — https://docs.astral.sh/uv/
- Ruff — https://docs.astral.sh/ruff/
- Pyright — https://microsoft.github.io/pyright/
- mypy — https://mypy.readthedocs.io/
- pytest — https://docs.pytest.org/
- cargo-llvm-cov — https://github.com/taiki-e/cargo-llvm-cov
- golangci-lint — https://golangci-lint.run/
- JaCoCo — https://www.jacoco.org/
- ktlint — https://pinterest.github.io/ktlint/
- detekt — https://detekt.dev/
- SwiftLint — https://realm.github.io/SwiftLint/
- swift-format — https://github.com/apple/swift-format
- dotnet format —
  https://learn.microsoft.com/en-us/dotnet/core/tools/dotnet-format
- coverlet — https://github.com/coverlet-coverage/coverlet
- credo — https://hexdocs.pm/credo/
- PHPStan — https://phpstan.org/
- Pest — https://pestphp.com/
- pre-commit framework — https://pre-commit.com/
- husky — https://typicode.github.io/husky/
- lint-staged — https://github.com/lint-staged/lint-staged
- gitignore.io — https://www.toptal.com/developers/gitignore
