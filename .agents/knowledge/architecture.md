# Architecture

## Current Shape
- Runtime entrypoint is `src/Server.ts`.
- HTTP API entry lives in `src/server/http/HttpServer.ts`; job lifecycle, local state, route file helpers, and upload provider catalog live under `src/server/jobs`, `src/server/state`, `src/server/routes`, and `src/server/upload`.
- The export pipeline lives in `src/exporting/workflow/NaverBlogExporter.ts` and keeps fetch, parse, review, render, write, upload, rewrite, and manifest concerns separated.
- UI uses HTTP APIs for export wizard runtime actions and may import pure domain contracts or option helpers.
- `/storybook` is the parser-preview exception: it builds a static catalog from parser story definitions and parser preview helpers, but it does not call export wizard bootstrap APIs.

## Main Flow
- Blog scan and post HTML fetch start in `src/integrations/naver-blog/NaverBlogFetcher.ts`.
- `src/parsing/naver-blog/core/PostParser.ts` builds a `src/parsing/naver-blog/NaverBlog.ts` instance and lets its editor instances choose the matching parser through `canParse`.
- Editor classes own block ordering, output-option visibility order, and source-level context. Block-specific `match` and `convert` logic stays in `src/parsing/naver-blog/se2`, `src/parsing/naver-blog/se3`, and `src/parsing/naver-blog/se4`.
- `src/markdown/MarkdownRenderer.ts` assembles frontmatter and final Markdown output, `AstMarkdownRenderer.ts` renders common AST blocks, and `TurndownMarkdownConverter.ts` handles HTML fragment conversion through Turndown.
- `src/exporting/paths/ExportPaths.ts`, `src/exporting/assets/AssetStore.ts`, `src/exporting/paths/PostLinkRewriter.ts`, and `src/server/jobs/ExportJobManifest.ts` handle output paths, deduped assets, post links, and resumable `manifest.json`.

## Module Boundaries
- `src/domain`: AST, blog, export option/job, upload, and preference contracts.
- `src/shared`: runtime-neutral utility helpers and base object types.
- `src/infra`: Node filesystem/path, HTTP fetch, runtime logging/abort adapters.
- `src/integrations/naver-blog`: Naver mobile API and post HTML fetch.
- `src/parsing/naver-blog`: SE2, SE3, SE4 HTML structures to common AST.
- `src/markdown`: AST to Markdown, Turndown-based HTML fragment conversion, and frontmatter assembly.
- `src/exporting`: export orchestration, asset persistence, upload/rewrite phase, single-post export, output paths.
- `src/server`: local HTTP server, job store, local state/cache, upload provider catalog.
- `src/ui`: React wizard, parser Storybook surface, scan/options/results/resume surfaces, shadcn primitives, API client.

## Parser Block Contract
- Blog -> editor -> parser block routing and file layout rules live in `.agents/knowledge/parser-architecture.md`.
- Parser block role, Container/Leaf behavior, output option ownership, and failure rules live in `.agents/knowledge/parser-blocks.md`.
- Editor-specific behavior notes live in `.agents/knowledge/editor-se2.md`, `.agents/knowledge/editor-se3.md`, and `.agents/knowledge/editor-se4.md`.

## Important Seams
- Parser block changes usually touch `BaseBlock.outputOptions`, an editor's `supportedBlocks`, `src/parsing/naver-blog/se*/*`, and focused parser tests.
- Parser/editor knowledge changes only when ownership, routing shape, output contract, or validation policy changes. Exact block inventories stay in code and tests.
- Renderer or exporter output changes usually affect `tests/fixtures/samples/*/expected.md`, `src/markdown/MarkdownRenderer.spec.ts`, `src/exporting/workflow/NaverBlogExporter.spec.ts`, and UI result assumptions.
- Job lifecycle changes usually affect `src/server/http/HttpServer.ts`, `src/server/jobs/JobStore.ts`, `src/server/jobs/ExportJobManifest.ts`, `src/ui/features/job-results/*`, and `.agents/knowledge/upload.md`.
- UI shell changes usually affect `src/ui/app/App.tsx`, `src/ui/features/common/*`, `src/ui/styles/globals.css`, and `.agents/knowledge/DESIGN.md`.
- Parser Storybook changes usually affect `src/parsing/naver-blog/core/ParserStoryFixtures.ts`, `src/ui/features/parser-stories/*`, `src/ui/features/parser-stories/assets/*`, `.agents/knowledge/parser-blocks.md`, `.agents/knowledge/DESIGN.md`, and `.agents/knowledge/verification.md`.
