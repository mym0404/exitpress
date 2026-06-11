# Blog Provider Refactor E2E Inventory

## Required Existing Gates
- `mise exec -- pnpm smoke:ui`
  - Covers mock browser UI flows for scan, options, block scan, export, upload progress, resume, and result screen.
- `mise exec -- pnpm test:network`
  - Covers live Naver resume export, live SE2 table export, and live upload flow.

## Required New Gates
- `mise exec -- pnpm test:provider:mock`
  - Covers provider-neutral engine export with markdown, html, and pre-parsed block mock providers.
- `mise exec -- pnpm test:provider:tistory`
  - Covers minimal live Tistory public post export through provider harness.
- `mise exec -- pnpm check:blog-boundaries`
  - Fails if provider-neutral abstractions are defined inside `packages/blog-*`.

## Scope Notes
- `server` is not migrated in this scope.
- Existing server Naver entrypoints stay until the next provider registry scope.
- Tistory is not exposed in the UI in this scope.
