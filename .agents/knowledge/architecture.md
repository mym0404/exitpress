# Architecture

## Current Shape
- Runtime entrypoint is `src/Server.ts`.
- HTTP API, Vite middleware, job lifecycle, upload trigger/polling, and bootstrap recovery live in `src/server/HttpServer.ts`.
- The export pipeline lives in `src/modules/exporter/NaverBlogExporter.ts` and keeps fetch, parse, review, render, write, upload, rewrite, and manifest concerns separated.
- UI uses HTTP APIs for runtime actions and may import pure domain contracts or option helpers. It does not import parser/editor runtime internals.

## Main Flow
- Blog scan and post HTML fetch start in `src/modules/fetcher/NaverBlogFetcher.ts`.
- `src/modules/parser/PostParser.ts` builds a `src/modules/blog/NaverBlog.ts` instance and lets its editor instances choose the matching parser through `canParse`.
- Editor classes own block ordering, output-option visibility order, and source-level context. Block-specific `match` and `convert` logic stays in `src/modules/blocks/*`.
- `src/modules/converter/MarkdownRenderer.ts` assembles frontmatter and final Markdown output, `AstMarkdownRenderer.ts` renders common AST blocks, and `TurndownMarkdownConverter.ts` handles HTML fragment conversion through Turndown.
- `src/modules/exporter/ExportPaths.ts`, `AssetStore.ts`, `PostLinkRewriter.ts`, and `ExportJobManifest.ts` handle output paths, deduped assets, post links, and `manifest.json`.

## Module Boundaries
- `src/modules/fetcher`: Naver mobile API, post HTML fetch, and fetcher HTTP utilities.
- `src/modules/parser`: SE2, SE3, SE4 HTML structures to common AST.
- `src/modules/blocks`: parser block base classes, block output registry, AST/block types, editor-specific parser blocks.
- `src/modules/common`: cross-runtime utility helpers and base object types.
- `src/modules/converter`: AST to Markdown, Turndown-based HTML fragment conversion, and frontmatter assembly.
- `src/modules/exporter`: export orchestration, asset persistence, upload/rewrite phase, single-post export.
- `src/server`: local HTTP server, job store, local state/cache, upload provider catalog.
- `src/ui`: React wizard, scan/options/results/resume surfaces, shadcn primitives, API client.

## Parser Block Contract
- Blog -> editor -> parser block routing and file layout rules live in `.agents/knowledge/parser-architecture.md`.
- Parser block role, Container/Leaf behavior, output option ownership, and failure rules live in `.agents/knowledge/parser-blocks.md`.
- Editor-specific behavior notes live in `.agents/knowledge/editor-se2.md`, `.agents/knowledge/editor-se3.md`, and `.agents/knowledge/editor-se4.md`.

## Important Seams
- Parser block changes usually touch `BaseBlock.outputOptions`, an editor's `supportedBlocks`, `src/modules/blocks/*`, and focused parser tests.
- Parser/editor knowledge changes only when ownership, routing shape, output contract, or validation policy changes. Exact block inventories stay in code and tests.
- Renderer or exporter output changes usually affect `tests/fixtures/samples/*/expected.md`, `src/modules/converter/MarkdownRenderer.spec.ts`, `src/modules/exporter/NaverBlogExporter.spec.ts`, and UI result assumptions.
- Job lifecycle changes usually affect `src/server/HttpServer.ts`, `src/server/JobStore.ts`, `src/server/ExportJobManifest.ts`, `src/ui/features/job-results/*`, and `.agents/knowledge/upload.md`.
- UI shell changes usually affect `src/ui/App.tsx`, `src/ui/features/common/*`, `src/ui/styles/globals.css`, and `.agents/knowledge/DESIGN.md`.
