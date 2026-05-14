# Test-Theater Traps

Use this when a test looks related to a change but would not prove real
behavior. Keep the proof at the caller boundary unless the exception is a
current public contract.

| Trap | Do this instead | Exception |
|---|---|---|
| Unit test for every function in a transformation chain. | Keep boundary tests above and below the chain. Test an internal stage only when boundary assertions cannot drive its non-trivial branching or state. | The internal stage has multiple branches or accumulates state that boundary tests cannot drive. |
| Error test only asserts that an error happens. | Assert the message, code, and structured fields the consumer observes at the outermost boundary. | The error path is purely internal and no consumer observes it. |
| Test needs many mocks and deep setup. | Simplify the boundary: extract pure transforms and push effects to the edge before adding more mocks. | The test crosses a true system boundary such as clock, network, process, filesystem, or expensive infrastructure. |
| Parameterized across every imagined input. | Cover behaviors named by the requirement and real boundary cases: security, data loss, parsing edges that exist in production data. | The function is a parser, validator, or security gate where input-space coverage is the contract. |
| Config, Makefile, manifest, or recipe test asserts a literal command string. | Expand and run the recipe (`make -n`, `npm run --silent`) and assert resulting behavior, or delete the test. | The string is a public contract a downstream consumer reads. |
| Test asserts framework or language behavior. | Test your code's use of the framework at the boundary where you bind to it. | A specific framework bug or version pin is the claim, with a comment naming the bug. |
| Test asserts a removed file or directory stays absent. | Use targeted search, lint, or a pre-commit hook for repo-structure guards. | A migration-era guard is explicitly time-boxed in a comment with a removal date. |
| Test asserts a hardcoded constant or trivial passthrough. | Delete it when there is no behavior. | The constant is part of a public protocol, error code, schema field, or other consumer contract. |
| Test asserts only that a mock was called. | Assert the resulting external state: response, outbox row, captured log, metric, event, or persisted record. | The call itself is the contract, such as an outbox writer where row creation is the behavior. |
