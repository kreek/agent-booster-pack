# Stack template format

These files are **Backstage Software Templates**. Use the standard
schema and conventions:

- Template entity (`apiVersion: scaffolder.backstage.io/v1beta3`,
  `kind: Template`): <https://backstage.io/docs/features/software-templates/writing-templates/>
- Parameter schema (JSON Schema with `enum`/`enumNames`/`default`/`const`,
  `required: [...]` arrays): <https://backstage.io/docs/features/software-templates/input-examples/>
- Catalog Location entity (`apiVersion: backstage.io/v1alpha1`,
  `kind: Location`) for the registry index:
  <https://backstage.io/docs/features/software-catalog/descriptor-format>

## Conventions

- One template per `.yaml` file. Files live under
  `<language>/<template-name>.yaml`.
- `metadata.name` is unique across the catalog (no slashes; lowercase
  + dashes).
- `metadata.tags` carry language and archetype as separate strings
  (e.g. `[typescript, lightweight-api, cloudflare]`).
- `spec.type` uses Backstage's standard component types: `service`,
  `website`, `library`. APIs and backends → `service`; sites and
  fullstack apps → `website`.
- `spec.owner: abp`.
- Parameters live in a single page (`spec.parameters[0]`) unless a
  template's required vs optional split is large enough to warrant
  separate pages.

## ABP extensions (non-Backstage fields)

The agent reads three extra fields under `spec`. Backstage's engine
ignores unknown keys, so this is safe.

- `tooling` — package manager, language flavor, lint/format, type
  checker, test runner, runtime/deploy CLI.
- `smoke_test` — what the one starter test asserts.
- `switch_when` — short note pointing at the next template to
  consider if this one stops fitting.

The `index.yaml` Location entity also carries an ABP-specific
`spec.default_for` map that routes common request shapes
(`fresh-typescript-web`, `fresh-python-web`, `fresh-small-frontend`)
to a starting template name.

## Why Backstage rather than bespoke

Established large-org standard for software template catalogs.
Parameters use JSON Schema, so LLMs and validators already understand
the shape. `enumNames` is the clean prose-per-choice mechanism. We
omit `spec.steps` and `spec.output` because the agent invokes native
scaffolding tools (`pnpm create svelte`, `uv init`, `wrangler init`,
etc.) rather than running the Backstage scaffolder engine.
