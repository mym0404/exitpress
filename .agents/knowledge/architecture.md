# Architecture

## Current Shape
- Runtime entrypoint is `packages/server/src/Server.ts`.
- HTTP API entry lives in `packages/server/src/http/HttpServer.ts`; job lifecycle, local state, route file helpers, and upload provider catalog live under `packages/server/src/jobs`, `packages/server/src/state`, `packages/server/src/routes`, and `packages/server/src/upload`.
- The export pipeline lives in `packages/engine/src/exporting/workflow/NaverBlogExporter.ts` and keeps fetch, parse, review, render, write, upload, rewrite, and manifest concerns separated.
- UI uses HTTP APIs for export wizard runtime actions and may import `packages/domain` contracts or pure option helpers.
- `/storybook` reads the committed generated catalog in `packages/web/src/features/storybook/generated/StorybookCatalog.generated.ts`; parser and renderer work happens in `scripts/storybook/generate-catalog.ts`, not in the web runtime.

## Main Flow
- Blog scan and post HTML fetch start in `packages/engine/src/integrations/naver-blog/NaverBlogFetcher.ts`.
- `packages/engine/src/parsing/naver-blog/core/PostParser.ts` builds a `packages/engine/src/parsing/naver-blog/NaverBlog.ts` instance and lets its editor instances choose the matching parser through `canParse`.
- Editor classes own block ordering, output-option visibility order, and source-level context. Block-specific `match` and `convert` logic stays in `packages/engine/src/parsing/naver-blog/se2`, `packages/engine/src/parsing/naver-blog/se3`, and `packages/engine/src/parsing/naver-blog/se4`.
- `packages/engine/src/markdown/MarkdownRenderer.ts` assembles frontmatter and final Markdown output from parsed blocks, and `TurndownMarkdownConverter.ts` handles HTML fragment conversion through Turndown.
- `packages/engine/src/exporting/paths/ExportPaths.ts`, `packages/engine/src/exporting/assets/AssetStore.ts`, `packages/engine/src/exporting/paths/PostLinkRewriter.ts`, and `packages/server/src/jobs/ExportJobManifest.ts` handle output paths, deduped assets, post links, and resumable `manifest.json`.

## Module Boundaries
- `packages/domain`: UI, server, and engine shared contracts plus pure export option/path/scope logic.
- `packages/engine`: runtime helpers, Naver fetcher, parser, Markdown renderer, exporter, asset persistence, upload/rewrite phase, and single-post export.
- `packages/server`: local HTTP server, job store, local state/cache, upload provider catalog, and static serving.
- `packages/web`: React wizard, Storybook surface, scan/options/results/resume surfaces, shadcn primitives, API client, and brand assets.
- Dependency direction is `web -> domain`, `server -> domain, engine`, and `engine -> domain`. Web runtime must not import engine.

## Parser Block Contract
- Blog -> editor -> parser block routing and file layout rules live in `.agents/knowledge/parser-architecture.md`.
- Parser block role, Container/Leaf behavior, output option ownership, and failure rules live in `.agents/knowledge/parser-blocks.md`.

## Important Seams
- Parser block changes usually touch `ParserBlock.templateDefinition`, an editor's `supportedBlocks`, `packages/engine/src/parsing/naver-blog/se*/*`, and focused parser tests.
- Parser/editor knowledge changes only when ownership, routing shape, output contract, or validation policy changes. Exact block inventories stay in code and tests.
- Renderer or exporter output changes usually affect `tests/fixtures/samples/*/expected.md`, `packages/engine/src/markdown/MarkdownRenderer.spec.ts`, `packages/engine/src/exporting/workflow/NaverBlogExporter.spec.ts`, and UI result assumptions.
- Job lifecycle changes usually affect `packages/server/src/http/HttpServer.ts`, `packages/server/src/jobs/JobStore.ts`, `packages/server/src/jobs/ExportJobManifest.ts`, `packages/web/src/features/job-results/*`, and `.agents/knowledge/upload.md`.
- UI shell changes usually affect `packages/web/src/app/App.tsx`, `packages/web/src/features/common/*`, `packages/web/src/styles/globals.css`, and `.agents/knowledge/DESIGN.md`.
- Storybook changes usually affect `packages/web/src/features/storybook/*`, `packages/web/src/features/storybook/data/*`, `packages/web/src/features/storybook/assets/*`, `scripts/storybook/generate-catalog.ts`, `.agents/knowledge/parser-blocks.md`, `.agents/knowledge/DESIGN.md`, and `.agents/knowledge/verification.md`.
