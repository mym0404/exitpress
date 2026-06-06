# Verification

## Source Of Truth
- Package scripts live in `package.json`.
- CI lives in `.github/workflows/required-checks.yml`.
- Tool versions live in `mise.toml`.
- Run local package scripts through `mise exec -- pnpm ...`.

## Primary Commands
- `mise exec -- pnpm check:fmt`: format and import order check.
- `mise exec -- pnpm check:lint`: Oxlint baseline.
- `mise exec -- pnpm typecheck`: TypeScript contract check.
- `mise exec -- pnpm storybook:check`: generated Storybook catalog freshness check.
- `mise exec -- pnpm test:offline`: full Vitest suite.
- `mise exec -- pnpm check:local`: format, lint, typecheck, Storybook check, and offline tests.
- `mise exec -- pnpm check:unused`: unused source/test/script diagnostics.
- `mise exec -- pnpm smoke:ui`: mock browser scan/export/provider-test/automatic-upload/resume workflow.
- `mise exec -- pnpm check:full`: local baseline plus mock browser smoke UI.
- `mise exec -- pnpm test:network`: live resume export, live SE2 table export, and live upload e2e.

## Focused Commands
- `mise exec -- pnpm format`: apply Oxfmt formatting/import sorting.
- `mise exec -- pnpm test:parser-blocks`: parser block specs.
- `mise exec -- pnpm test:coverage`: Vitest with V8 coverage thresholds.
- `mise exec -- pnpm storybook:generate`: regenerate committed Storybook catalog.

## What Each Layer Proves
- Typecheck proves moved imports, shared contracts, and cross-package type compatibility.
- Offline tests prove pure logic, parser, renderer, server, hook, and generated catalog behavior.
- Parser block tests prove editor block conversion through parser dispatch.
- Storybook check proves generated catalog matches current parser/renderer output.
- Smoke UI proves browser workflow behavior with mocked APIs, including provider setup, test upload, automatic upload progress, uploaded result links, and no manual upload POST.
- Network tests prove live Naver fetch and external upload behavior when environment and secrets are available, including automatic upload and Markdown URL rewrite.

## Blind Spots
- Smoke UI does not prove live Naver or remote upload behavior.
- Network upload creates remote state and depends on credentials.
- CI does not run network e2e.
- Coverage does not replace behavior-specific parser/export/server/smoke checks.

## Task Loops
- Moving or deleting files requires typecheck and `check:unused`.
- Parser changes require parser block or offline tests depending on scope.
- Export, manifest, upload, resume, or UI state changes require smoke UI.
- Upload e2e changes must keep both mock smoke and live upload harnesses aligned with the current export-triggered upload flow.
- Live fetch/upload changes require the matching network command when the environment supports it.
