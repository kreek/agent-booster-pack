# F# review reference

Use when reviewing F# code in the diff. Apply this alongside the main
`code-review` skill workflow.

## Data-first bias (apply first)

F# is a natural fit for the `data` skill's doctrine — but the
ecosystem leaks OOP habits from C#. Lean into the functional core:

- Prefer **records** and **discriminated unions** over classes;
  reach for classes only at I/O boundaries or when you genuinely need
  inheritance/interfaces for interop.
- `Result<'T,'E>` over throwing methods. Exceptions are reserved for
  unrecoverable faults at the edge.
- Make illegal states unrepresentable: a DU with three valid cases
  beats a record with three nullable fields and an `IsValid` flag.
- Push side effects outward; keep the domain a tree of pure
  functions over data.
- Parse at the boundary: model controller / queue inputs as DTOs
  validated into typed domain values once.

When in doubt, route to the `data` skill.

## Tooling that should be passing

- `dotnet format --verify-no-changes` — formatting is enforced.
- `dotnet build -warnaserror` — clean build; new warnings are
  blockers unless an `EditorConfig` rule shifts in the same diff.
- `dotnet test` — narrow to the changed project first; full solution
  before merge.
- FSharpLint or analyzers if the repo configures them; respect the
  configured rule set.

## High-signal review checks

- **`Result` vs exceptions**: domain logic should return
  `Result<'T,'E>`. Any new `failwith`, `raise`, or `invalidArg` in a
  domain function needs a justification — typically a precondition
  the type system can't yet express.
- **Discriminated unions over enums + flags**: a "status" string
  with three valid values, or a record with mutually-exclusive
  optional fields, is a DU asking to be born.
- **`Option` over null**: F# code interoperating with C# libraries
  often gets handed null. Wrap into `Option` at the boundary, not
  scattered.
- **Computation expressions**: prefer the project's existing CE
  (`result { }`, `task { }`, `asyncResult { }`) over manually
  threading match expressions. Custom CEs need a one-line reason
  in the diff.
- **`task` vs `async`**: in performance-sensitive code, prefer
  `task { }` (no thread-hop overhead, plays nicely with C# Task).
  F# `async { }` is fine for workflow code where its cancellation
  composition story matters more than allocations.
- **Mutable state**: `let mutable` and `ref` cells are warning
  signs. Most cases are better expressed as a fold or accumulator.
  Caches and adapters at the edge are the legitimate uses.
- **Active patterns**: powerful but easy to over-use. A simple
  `match` is often clearer than a custom `(|Foo|Bar|)` pattern.
  Active patterns that throw are a finding.
- **Module organisation**: top-down ordering. A function used in
  `let foo` defined later means the project has wired up
  recursive modules or out-of-order definitions — usually worth
  flagging.
- **Pipelines**: `|>` chains over deeply nested calls; flag
  pipelines that obscure error propagation by `Result.iter`-ing
  away a meaningful failure.
- **`Seq` vs `List` vs `Array`**: lazy sequences in places that
  iterate twice silently re-evaluate. Materialise once with
  `List.ofSeq` / `Array.ofSeq` when the source is non-trivial.
- **Interop with C# libraries**: F# `unit` mapping, null returns
  from C#, async-to-task adapters. New interop boundaries need a
  thin adapter module that translates into F# idioms.

## Anti-patterns / red flags

- `failwith` in a domain function that should return `Result`.
- `let mutable` in pure logic (vs at the I/O edge).
- `ignore` swallowing a `Result` without inspecting `Error`.
- Active pattern that calls `failwith` instead of returning
  `None`.
- Open `System.Linq` or pervasive `System.Collections.Generic`
  usage in domain code (suggests C#-style mutation creeping in).
- `Seq.head` / `List.head` on a sequence with no bounds proof.
- A class with `member this.X` that has no real OOP need — should
  be a module of functions.
- Wrapping every function in `task { return ... }` — adds
  allocations for sync work.

## Sources

- F# Style Guide:
  <https://learn.microsoft.com/en-us/dotnet/fsharp/style-guide/>
- F# coding conventions:
  <https://learn.microsoft.com/en-us/dotnet/fsharp/style-guide/conventions>
- "Designing with types" series (Scott Wlaschin):
  <https://fsharpforfunandprofit.com/series/designing-with-types/>
- F# task expression: <https://learn.microsoft.com/en-us/dotnet/fsharp/language-reference/task-expressions>
- Async / Task interop:
  <https://learn.microsoft.com/en-us/dotnet/fsharp/tutorials/asynchronous-and-concurrent-programming/async>
