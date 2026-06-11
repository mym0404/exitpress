# Architecture

## Runtime Shape

- The local server owns process startup, HTTP APIs, static serving, job state, local settings, and upload provider runtime metadata.
- The engine owns provider runtime interfaces, provider export harnesses, legacy Naver fetch/parser runtime, Markdown rendering, asset persistence, upload candidate handling, link rewrite, and export manifest writing.
- Concrete blog provider packages own provider-specific source parsing, fetching adapters, and parser adapters.
- The web package owns the browser wizard, Storybook surface, API client, and UI state.
- The domain package owns shared contracts and pure deterministic logic used across packages.

## Main Flow

- Scan starts from the server API and delegates Naver retrieval to the engine.
- Parser routing chooses the matching editor implementation and converts supported editor blocks into parsed blocks.
- Renderer turns parsed blocks and templates into Markdown, resolves assets, and produces manifest-ready asset records.
- Export workflow writes Markdown/assets, updates job progress, persists resume data, and runs automatic upload/rewrite phases when `download-and-upload` is selected.
- Web reads bootstrap/defaults, drives scan/options/provider-test/export actions through HTTP APIs, and displays progress from polled job state.

## Boundaries

- Web runtime may import domain contracts and pure helpers only.
- Server may import domain and engine.
- Engine may import domain but not web or server.
- Blog provider-neutral DTOs live in `packages/domain/src/blog-provider/schema/`.
- Blog provider runtime interfaces, registry, fetch policy, and provider harnesses live in `packages/engine/src/blog-provider/` and `packages/engine/src/exporting/provider/`.
- Concrete providers live in `packages/blog-*`.
- `blog-*` packages may depend on domain and engine, but must not define provider-neutral base types or contracts.
- Server provider registry migration is outside the current provider harness scope; existing server Naver entrypoints remain until that migration.
- Package and feature contracts live in the owning folder under `schema/`; cross-package contracts live in domain schema when shared across packages.
- Shared utilities live under the owning package/folder `util/`.
- Avoid barrel files and compatibility re-export files; import the current owner path directly.

## Storybook Flow

- Storybook source data is committed in the web package.
- A script renders the generated Storybook catalog through engine parser/renderer code.
- The web Storybook route reads the committed generated catalog and does not import engine at runtime.

## Change Signals

- Boundary changes require architecture and code-style knowledge updates.
- Parser routing or block output contract changes require parser knowledge updates.
- Export, upload, resume, or manifest behavior changes require domain/upload/verification knowledge updates.
- UI system or visual behavior changes require design knowledge updates.
