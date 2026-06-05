# Code Style And Workflow

## Repo-Specific Priorities
- Prefer current code, tests, and package scripts over stale docs.
- Keep runtime code in `src/`. Fixture lists, coverage reports, harness metadata, and generated evidence stay outside runtime code.
- Parser, renderer, exporter, server, and UI contracts should stay visible in code or tests when they are mechanical.
- Commit, push, and PR creation require explicit user request.

## GitHub Workflow
- Package scripts that operate on GitHub use the `gh:` prefix.
- `mise exec -- pnpm gh:update-branches` runs `scripts/maintenance/update-open-pr-branches.ts` and calls `gh pr update-branch` for open PRs.

## Formatting And Imports
- Oxfmt owns repository formatting and import sorting. Oxlint owns the baseline lint.
- Run package scripts through `mise exec -- pnpm ...`; bare `pnpm` may resolve to a Corepack wrapper outside an activated mise shell.
- Run `mise exec -- pnpm format` during multi-step edits when formatting or imports may have drifted.
- Run `mise exec -- pnpm check:fmt` and `mise exec -- pnpm check:lint` before or through `mise exec -- pnpm check:local`.

## TypeScript
- The repo is strict TypeScript with NodeNext ESM.
- Use `.js` extensions in TS imports where NodeNext runtime imports require them.
- Keep types with the domain that owns the shape, such as `src/domain/parser/Types.ts`, `src/domain/blog/Types.ts`, `src/domain/export-options/Types.ts`, `src/domain/export-job/Types.ts`, and `src/domain/upload/UploadProviderTypes.ts`.
- Keep parser block output behavior aligned across `ParserBlock.templateDefinition`, editor `supportedBlocks` arrays, `ExportOptions.blockOutputs`, and `src/parsing/naver-blog/core/BlogParser.ts`.
- This project does not preserve local schema backward compatibility unless explicitly requested. When an option/state contract changes, prefer the current schema and remove stale aliases or migration paths.
- Prefer `type` aliases for object shapes, unions, and inferred helper types; do not introduce `interface` unless an external API requires it.
- For finite runtime options, define `as const` arrays or objects and derive union types from them with `typeof`.
- Use `as const satisfies` for registries and status maps that need literal inference plus shared shape checking.
- Use `Record<Union, Value>` when a map should stay exhaustive over a known union.

## Runtime Modules
- Keep runtime ownership under `src/domain`, `src/shared`, `src/infra`, `src/integrations`, `src/parsing`, `src/markdown`, `src/exporting`, `src/server`, and `src/ui`; choose the domain boundary before the technical file type.
- Use classes for stateful services, editors, and parser blocks that own dependencies, caches, or shared behavior.
- Use `readonly` fields for constructor dependencies and long-lived state that should not be reassigned.
- Use `private` methods for internal multi-step class logic.
- Keep `createX` helpers for pure value construction, binding construction, or test/harness fixtures.
- Parser block implementations should extend `ContainerParserBlock` for recursive wrapper parsing or `LeafParserBlock` for direct parsed block conversion, and return literal parser results with `as const` when inference would widen status or parsed block values.
- Keep editor and parser block relationships as direct `ParserBlock` instances inside each editor class.
- Keep helpers that only support one concrete parser block's `match` or `convert` logic inside that parser block file.
- Inline single-use helpers when they only pass caller context through or hide a short expression; keep named local helpers inside the same block file when they clarify a substantial block-specific step.
- Split editor-local parser helper files only when at least two parser blocks reuse them.
- Put shared editor-local parser helper files under that editor's `blocks/util/*`; keep block class files, single-block helpers, and adjacent specs directly under `blocks/*`.
- Keep parser block `templateDefinition` and option params in the concrete parser block file, even when similar options appear in another editor family.

## Date And Time
- Store manifest, job, and export timestamps as ISO strings from `new Date().toISOString()`.
- Use `Date.now()` only for elapsed-time checks, polling loops, temporary ids, or harness output paths.
- Keep display-only date formatting in focused common helpers instead of duplicating formatter setup.

## UI Code
- `src/ui/components/ui/*` is the shadcn primitive layer. Prefer feature composition, tokens, or helper classes before changing primitives.
- Use the `@/*` UI alias configured in `vite.config.ts` and `tsconfig.json`.
- UI tests should prefer user behavior, accessibility state, API contract, and visible text over className or computed-style assertions.
- Do not add native `<select>` for new dropdowns; use the existing shadcn `Select`.
- Do not mix icon sets; use `@remixicon/react`.
- Keep UI feature code under `src/ui/features/{domain}`.
- Keep cross-feature UI shell, hooks, and status helpers under `src/ui/features/common`.
- Keep primitive wrappers under `src/ui/components/ui`; do not move feature-specific behavior into primitives.

## Server And Harness
- User `mise exec -- pnpm dev` owns the normal development server path.
- Tests and harnesses should use isolated `EXITPRESS_SETTINGS_PATH`, `EXITPRESS_SCAN_CACHE_PATH`, and non-default `PORT` or `listen(0)`.
- Ad-hoc server checks should not share `.cache/export-ui-settings.json` with the user's development session.
- Repo-local temporary files belong under `tmp/`; tests and e2e harnesses should use `tests/support/test-paths.ts` instead of `os.tmpdir()`.
- `.cache/` is persisted app state, not a scratch directory for tests, harnesses, or runtime upload config.
- Helper scripts and specs that serve only one repo-local skill belong under that skill directory. Keep root `scripts/` for project-level CLIs and helpers shared by more than one workflow.

## Documentation
- Evergreen repo knowledge lives in shallow `.agents/knowledge/*.md` files.
- `AGENTS.md` is the only router.
- Keep old/new narration, task logs, and cleanup history out of evergreen docs unless they describe a current operating constraint.
- Knowledge should explain stable ownership, contracts, and validation paths, not exhaustive code inventories.
- Do not mirror exact parser block lists, selectors, output keys, or file-by-file behavior in knowledge when code and tests already own them.
- Update relevant knowledge when parser/editor structure, sample fixture policy, renderer/exporter contract, upload/resume lifecycle, or UI design contract changes.
