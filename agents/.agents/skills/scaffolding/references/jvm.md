# JVM

Use this before scaffolding fresh Java or Kotlin projects.

## Defaults

- Build tool: Gradle with the Kotlin DSL (`build.gradle.kts`,
  `settings.gradle.kts`). Groovy DSL is legacy; use it only when an existing
  repo is pinned to it. Use Maven only when the repo is locked to it.
- JDK baseline: target the current LTS JDK for new projects. Check the
  OpenJDK LTS roadmap before picking; do not start a new project on a non-LTS
  line.
- Kotlin compiler: K2 (the modern Kotlin compiler front-end) is the default for
  new Kotlin projects.
- Lightweight/API defaults: Javalin, Ktor, Micronaut, or Quarkus. Javalin for
  small Java/Kotlin APIs; Ktor for Kotlin-first async services; Micronaut and
  Quarkus for compile-time DI, fast startup, and first-class native image.
- Robust/enterprise default: Spring Boot.
- Avoid hand-rolled servlet/Jetty/Netty routing unless the user explicitly asks
  or the project is a library/teaching example.

## Choose

- Javalin for compact Java/Kotlin APIs where simple blocking code and minimal
  concepts are valuable.
- Ktor for Kotlin-first services, coroutine-native async work, or multiplatform
  Kotlin context.
- Micronaut or Quarkus when cold-start, memory, and native-image fit matter
  (serverless, CLI-sized containers, edge workloads). Micronaut leans JVM-first
  with AOT; Quarkus leans Jakarta-EE-aligned with dev-mode live reload.
- Spring Boot for production-grade JVM services needing starters,
  auto-configuration, actuator/metrics/health, data integrations, and broad
  enterprise conventions. GraalVM native image support is GA in Spring Boot;
  opt in when cold-start and memory budgets justify the build-time cost.

## Minimum Scaffold

- Gradle wrapper, build file (Kotlin DSL), application plugin where appropriate,
  one test target, and a version catalog (`gradle/libs.versions.toml`) for
  shared dependency versions.
- Standard tasks: `test`, `check`, formatting/linting (Spotless/ktlint) where
  configured, and app run.
- Framework-native route/controller plus one framework-boundary smoke test.

## Sources

- Gradle: https://docs.gradle.org/current/userguide/userguide.html
- Gradle Kotlin DSL primer:
  https://docs.gradle.org/current/userguide/kotlin_dsl.html
- Gradle version catalogs:
  https://docs.gradle.org/current/userguide/version_catalogs.html
- OpenJDK release roadmap: https://openjdk.org/projects/jdk/
- Kotlin: https://kotlinlang.org/docs/home.html
- Javalin: https://javalin.io/documentation
- Ktor: https://ktor.io/
- Micronaut: https://micronaut.io/documentation/
- Quarkus: https://quarkus.io/guides/
- Spring Boot: https://docs.spring.io/spring-boot/
- GraalVM native image:
  https://www.graalvm.org/latest/reference-manual/native-image/
