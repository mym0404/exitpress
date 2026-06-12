# Verification

## Source Of Truth

- Package scripts live in `package.json`.
- CI lives in `.github/workflows/required-checks.yml` and runs the full non-duplicated verification route for non-draft PRs.
- Tool versions live in `mise.toml`.
- Run local package scripts through `mise exec -- pnpm ...`.

## Runner Policy

- Unit, integration, parser, exporter, server, blog, and other non-browser checks belong in Vitest specs.
- Browser smoke and end-to-end checks belong in Playwright Test specs.
- Use Vitest/Playwright config, projects, fixtures, lifecycle hooks, reporters, filtering, and coverage before adding repo-specific runners.
- Standalone Bun scripts are acceptable for product CLIs, one-off maintenance commands, and manual evidence capture, not for checks that can be expressed as Vitest or Playwright tests.
- Verification commands must do real work directly; do not add alias-only verification scripts that merely redirect to another script.
- Use `check:*` for checks whose name would otherwise be ambiguous, and keep clear lifecycle commands such as `build:*` under their existing purpose-specific names.

## Primary Commands

- `mise exec -- pnpm check:fmt`: format and import order check.
- `mise exec -- pnpm check:lint`: Oxlint baseline.
- `mise exec -- pnpm check:type`: fast TypeScript contract check without emitting build output.
- `mise exec -- pnpm build:server`: server TypeScript build check.
- `mise exec -- pnpm build:ui`: web production build check.
- `mise exec -- pnpm check:storybook`: generated Storybook catalog freshness check.
- `mise exec -- pnpm check:test`: full Vitest suite, including fixtures and blog integration checks.
- `mise exec -- pnpm check:coverage`: full Vitest suite with V8 coverage thresholds.
- `mise exec -- pnpm check:playwright`: Playwright smoke and live browser/network e2e suite against the current built web UI.
- `mise exec -- pnpm check:unused`: unused source/test/script diagnostics.

## Focused Commands

- `mise exec -- pnpm format`: apply Oxfmt formatting/import sorting.
- `mise exec -- pnpm storybook:generate`: regenerate committed Storybook catalog.

## What Each Layer Proves

- Typecheck proves moved imports, shared contracts, and cross-package type compatibility.
- Vitest proves pure logic, parser block conversion, renderer, server, hook, fixture, blog, and generated catalog behavior.
- Storybook check proves generated catalog matches current parser/renderer output.
- Playwright proves browser workflow behavior with mocked APIs and live e2e behavior, including resume, provider setup, test upload, automatic upload progress, uploaded result links, and no manual upload POST.
- Live upload checks read `.env` locally and CI secrets in GitHub Actions.

## Blind Spots

- Network upload creates remote state and depends on credentials.
- CI network e2e depends on upload secrets and live external services.
- Coverage does not replace behavior-specific parser/export/server/smoke checks.

## Task Loops

- Use focused commands while iterating only when the same class of check would otherwise be repeated frequently; run the affected verification commands before finishing.
- Do not run duplicated checks in sequence when a later command already includes the earlier one, such as `check:test` immediately before `check:coverage`.
- Documentation-only knowledge edits do not need browser smoke; verify routed paths, command existence, and changed Markdown content.
- Moving or deleting files requires `check:type` and `check:unused`.
- Parser changes require `check:test`.
- Export, manifest, upload, resume, UI state, server API, routing, static asset serving, or job-state changes require `build:ui` followed by `check:playwright`.
- Upload e2e changes must keep both mock smoke and live upload checks aligned with the current export-triggered upload flow.
- Live fetch/upload changes require `build:ui` followed by `check:playwright`.
