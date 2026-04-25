# Ruby review reference

Use when reviewing Ruby (or Rails) code in the diff. Apply this
alongside the main `code-review` skill workflow.

## Data-first bias (apply first)

Ruby's culture leans heavily on objects with state. The `data`
skill's doctrine still applies:

- Prefer `Data.define` (Ruby 3.2+) or `Struct` value objects and pure
  module functions over instance state.
- A class that exists only to hold mutable scratchpads ("Manager",
  "Helper", "Service" with three methods and no real invariants) is
  a smell.
- Use `freeze` for shared structures; immutable-by-default beats
  defensive copying.
- Isolate Active Record at the edge: domain logic should accept and
  return value objects, not AR records, so it stays testable.
- Parse untrusted input into typed values once (strong params,
  `dry-validation`, custom value objects) and let downstream code
  trust them.

When in doubt, route to the `data` skill.

## Tooling that should be passing

- `bundle exec rubocop` — house style. New `rubocop:disable`
  comments need a reason. `standard` is an acceptable substitute.
- `bundle exec rspec` (or `minitest`) — narrow to the changed area
  first; CI runs the full suite.
- `bundle exec brakeman` (Rails) — security static analysis;
  warnings introduced by the diff are findings.
- `bundle exec rails db:migrate:status` — migrations applied locally
  before review, no orphaned migrations.
- For Sorbet/Steep projects: `srb tc` / `steep check` must be clean.

## High-signal review checks

- **Frozen string literals**: `# frozen_string_literal: true` magic
  comment at the top of every file. Missing it is a low-noise
  cleanup; mid-file string mutation in a frozen file is a real bug.
- **Rails strong parameters**: every controller create/update path
  should `permit` an explicit allowlist. New endpoints accepting
  arbitrary params are Critical.
- **N+1 queries**: AR query inside an enumerable iterating over
  another AR query. Suggest `.includes(...)` / `.preload(...)` /
  `.eager_load(...)`. `bullet` gem catches these locally.
- **Mass assignment / SQL injection**: any string-built SQL fragment
  on user input. `where("name = '#{x}'")` is a Critical security
  finding; use placeholders or hash form.
- **`nil` safety**: `&.` chains that swallow real errors. A
  `user&.profile&.name` returning `nil` to a UI that expects a
  string is bug bait.
- **`rescue` without a class**: bare `rescue` rescues `StandardError`
  silently. `rescue => e` with no logging or re-raise is a finding.
- **Memoisation pitfalls**: `@result ||= compute` returns cached
  `false` / `nil` incorrectly. Use `defined?(@result) ? @result : ...`
  for nullable memoisation.
- **Time**: `Time.now` in domain logic; prefer `Time.current`
  (Rails) or an injected clock for testability.
- **Background jobs**: jobs that take AR objects as args (rather
  than ids) deserialise stale state. Almost always a finding.
- **Migrations**: `add_index` on a large table without
  `algorithm: :concurrently`; `change_column` rewrites the table —
  defer to the `database` skill for production data risk.

## Anti-patterns / red flags

- `where("col = '#{value}'")` — SQL interpolation.
- `rescue => e` with no `Rails.logger.error` and no re-raise.
- `find_or_create_by` in a hot path with no unique index (race).
- `def initialize(*args, **kwargs)` swallowing arbitrary input.
- `User.first` ordered by id implicitly — use `.first(...)` only on
  ordered scopes.
- Job class accepting an AR object: `perform(user)` instead of
  `perform(user_id)`.
- Class with `class << self` and no instance methods — make it a
  module.

## Sources

- Ruby Style Guide: <https://rubystyle.guide/>
- Rails Style Guide: <https://rails.rubystyle.guide/>
- Rubocop docs: <https://docs.rubocop.org/>
- Brakeman: <https://brakemanscanner.org/docs/>
- Rails Performance Guide:
  <https://guides.rubyonrails.org/active_record_querying.html#eager-loading-associations>
