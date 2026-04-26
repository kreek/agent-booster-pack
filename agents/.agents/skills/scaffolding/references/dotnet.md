# .NET

Use this before scaffolding fresh .NET projects.

## Defaults

- Package/build tool: dotnet CLI with NuGet. Use Central Package Management
  (`Directory.Packages.props`) in any solution with more than one project to
  keep versions consistent.
- .NET baseline: target the current LTS release for new projects (the .NET
  LTS cycle alternates with STS; check the support policy link before picking).
  Use an STS release only when its new features are load-bearing for the
  project.
- Lightweight/API default: ASP.NET Core Minimal APIs.
- Robust/full-stack defaults: ASP.NET Core MVC, Razor Pages, or Blazor depending
  on app shape: including Blazor Static Server-Side Rendering as a
  lightweight alternative to Blazor Server/WASM when the app is largely static
  HTML with islands of interactivity.
- Native AOT is expanded across ASP.NET Core, MAUI, and EF Core pre-compiled
  queries; opt in when startup time and memory footprint justify the build-time
  cost and the limits on dynamic code.
- Do not hand-roll HTTP listeners for web apps unless the user asks or the
  project is a tiny protocol/teaching example.

## Choose

- Minimal APIs for new HTTP APIs and compact services.
- Controllers when MVC features, filters, model binding extensibility, or team
  familiarity require them.
- Razor Pages/MVC for server-rendered web apps.
- Blazor Server for stateful SignalR-backed interactive apps; Blazor WASM when
  the client owns the runtime; Blazor Static SSR for content-heavy pages with
  targeted interactivity.
- MAUI for cross-platform (iOS/Android/macOS/Windows) apps.

## Minimum Scaffold

- `.csproj`, solution only when useful, `Program.cs`, test project, and
  `Directory.Packages.props` for central package management in multi-project
  repos.
- Commands: `dotnet test`, `dotnet format --verify-no-changes` when configured,
  and `dotnet build`.
- Framework-native endpoint/controller plus one integration smoke test.

## Sources

- .NET support policy:
  https://dotnet.microsoft.com/platform/support/policy/dotnet-core
- NuGet: https://learn.microsoft.com/en-us/nuget/
- ASP.NET Core: https://learn.microsoft.com/en-us/aspnet/core/
- Minimal APIs:
  https://learn.microsoft.com/en-us/aspnet/core/fundamentals/minimal-apis/overview
- Blazor: https://learn.microsoft.com/en-us/aspnet/core/blazor/
- Blazor Static SSR:
  https://learn.microsoft.com/en-us/aspnet/core/blazor/components/render-modes
- Native AOT:
  https://learn.microsoft.com/en-us/dotnet/core/deploying/native-aot/
- Central Package Management:
  https://learn.microsoft.com/en-us/nuget/consume-packages/central-package-management
