# Swift

Use this before scaffolding fresh Swift projects.

## Defaults

- Package/build tool: Swift Package Manager.
- Concurrency posture: enable **Approachable Concurrency** for new projects —
  main-thread-by-default for UI/scripts, explicit `@concurrent` for opting into
  parallel work. This is the recommended stance for new code on current Swift.
- Test framework: **Swift Testing** (`@Test` macro) is an opt-in modern
  alternative to XCTest shipping with current Xcode. Pick it at project
  creation; keep XCTest only when an existing target depends on it.
- Server-side web default: **Hummingbird** (async/await-native, result-builder
  routing, Swift NIO under the hood) for minimal-to-mid-size server apps. Use
  **Vapor** for batteries-included server apps with ORM (Fluent), auth,
  templating, and a broader plugin ecosystem.
- Native Apple app default: platform app templates (Xcode) backed by SwiftPM for
  library targets.
- Do not hand-roll HTTP servers for server apps unless the user asks or the
  project is a protocol/library exercise.

## Choose

- Hummingbird for Swift server apps that want a small, explicit, async-first
  stack.
- Vapor for full-stack server apps needing Fluent, Leaf templates, queues, auth,
  and an established plugin ecosystem.
- Native Apple templates for iOS, macOS, watchOS, tvOS, or visionOS apps.
- SwiftPM package/library layout for reusable libraries and command-line tools.

## Minimum Scaffold

- `Package.swift`, `Package.resolved` when dependencies exist, source target,
  test target (Swift Testing or XCTest), and platform declarations where
  relevant.
- Commands: `swift test` and `swift build`.
- Hummingbird or Vapor route smoke test for server apps.

## Sources

- Swift Package Manager: https://www.swift.org/packages/
- Package manifest API:
  https://docs.swift.org/package-manager/PackageDescription/PackageDescription.html
- Swift concurrency: https://developer.apple.com/documentation/swift/concurrency
- Swift Testing: https://developer.apple.com/xcode/swift-testing/
- Hummingbird: https://docs.hummingbird.codes/
- Vapor: https://docs.vapor.codes/
- Swift documentation: https://www.swift.org/documentation/
