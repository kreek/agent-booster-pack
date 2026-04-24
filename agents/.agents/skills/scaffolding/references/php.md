# PHP

Use this before scaffolding fresh PHP projects.

## Defaults

- Package manager: Composer with `composer.json` and `composer.lock`.
- PHP baseline: target the current stable PHP major line for new projects
  (property hooks, array-find, and cleaner instantiation land in the current
  line). Check php.net release notes before picking; do not start a new project
  on an EOL or security-only line.
- Lightweight/API default: Slim.
- Robust/full-stack default: Laravel. Current Laravel ships a streamlined
  bootstrap/config layout and a first-party tooling stack you should opt into
  when the shape fits: **Volt** (functional Livewire syntax), **Folio**
  (page-based routing), **Reverb** (WebSocket server), and **Herd** (zero-config
  local dev environment for macOS/Windows).
- Enterprise-grade alternative to Laravel: Symfony — pick it when
  components-first composition, long-term stability contracts, or existing
  Symfony ecosystem familiarity matters more than Laravel's defaults.
- Testing default for new projects: **Pest** (built on PHPUnit, more expressive
  spec-style syntax). Existing repos can keep PHPUnit.
- Static analysis baseline in CI: **PHPStan**. Keep Psalm when taint analysis
  for security is the priority.
- Do not scaffold raw PHP front-controller routing for apps unless the user asks
  or the project is a tiny script/library/teaching example.

## Choose

- Slim for small APIs and focused services.
- Laravel for full-stack apps, database-backed apps, queues, jobs, auth,
  validation, migrations, and broader conventions.
- Symfony for enterprise-grade apps needing a decoupled components stack, long
  support windows, or strict backwards-compatibility policy.

## Minimum Scaffold

- `composer.json`, `composer.lock`, PSR-4 autoloading, test setup (Pest or
  PHPUnit), and public front controller if web-facing.
- Commands: `composer test`, `composer lint` or equivalent project scripts, and
  `composer stan` / `composer psalm` in CI.
- Framework-native route plus one request smoke test.

## Sources

- Composer: https://getcomposer.org/doc/
- PHP release notes: https://www.php.net/releases/
- Slim: https://www.slimframework.com/
- Laravel: https://laravel.com/docs/
- Laravel Volt: https://livewire.laravel.com/docs/volt
- Laravel Folio: https://laravel.com/docs/folio
- Laravel Reverb: https://laravel.com/docs/reverb
- Laravel Herd: https://herd.laravel.com/
- Symfony: https://symfony.com/doc/current/index.html
- Pest: https://pestphp.com/docs/installation
- PHPStan: https://phpstan.org/user-guide/getting-started
- Psalm: https://psalm.dev/docs/
