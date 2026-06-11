# Verification

## Source Of Truth

- Package scripts live in `package.json`.
- CI lives in `.github/workflows/required-checks.yml` and runs format, lint, typecheck, server build, Storybook check, web build, smoke UI, coverage, and live network e2e for non-draft PRs.
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
- `test -n "$EXITPRESS_TISTORY_LIVE_POST_URL" && mise exec -- pnpm test:provider:tistory`: live Tistory provider export harness.
- `mise exec -- pnpm smoke:ui`: mock browser scan/export/provider-test/automatic-upload/resume workflow.
- `mise exec -- pnpm check:full`: default local baseline for ordinary code changes; runs `check:local` plus mock browser smoke UI.
- `mise exec -- pnpm test:network`: live resume export, live SE2 table export, and live upload e2e.

## Focused Commands

- `mise exec -- pnpm format`: apply Oxfmt formatting/import sorting.
- `mise exec -- pnpm test:coverage`: Vitest with V8 coverage thresholds.
- `mise exec -- pnpm storybook:generate`: regenerate committed Storybook catalog.

## What Each Layer Proves

- Check full is the normal final local proof after code changes unless the task is docs-only, a repeated inner-loop check, or blocked by environment, secrets, or runtime cost.
- Typecheck proves moved imports, shared contracts, and cross-package type compatibility.
- Offline tests prove pure logic, parser block conversion, renderer, server, hook, and generated catalog behavior.
- Storybook check proves generated catalog matches current parser/renderer output.
- Smoke UI proves browser workflow behavior with mocked APIs, including provider setup, test upload, automatic upload progress, uploaded result links, and no manual upload POST.
- Network tests prove live Naver fetch and external upload behavior when environment and secrets are available, including automatic upload and Markdown URL rewrite.
- Provider export Vitest cases prove provider-neutral export wiring separately from the server/UI migration path.

## Blind Spots

- Smoke UI does not prove live Naver or remote upload behavior.
- Network upload creates remote state and depends on credentials.
- CI network e2e depends on upload secrets and live external services.
- Coverage does not replace behavior-specific parser/export/server/smoke checks.

## Task Loops

- Use focused commands while iterating only when the same class of check would otherwise be repeated frequently; finish with `check:full` when the change can affect runtime behavior.
- Documentation-only knowledge edits do not need browser smoke; verify routed paths, command existence, and changed Markdown content.
- Moving or deleting files requires typecheck and `check:unused`.
- Parser changes require offline tests.
- Export, manifest, upload, resume, UI state, server API, routing, static asset serving, or job-state changes require smoke UI.
- Upload e2e changes must keep both mock smoke and live upload harnesses aligned with the current export-triggered upload flow.
- Live fetch/upload changes require the matching network command when the environment supports it.
