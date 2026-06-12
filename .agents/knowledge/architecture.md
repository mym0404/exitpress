# Architecture

## Runtime Shape

- The local server owns process startup, HTTP APIs, static serving, job state, local settings, and upload provider runtime metadata.
- The engine owns provider runtime interfaces, provider-neutral export units, Markdown rendering, asset persistence, upload candidate handling, link rewrite, and export manifest writing.
- Concrete blog provider packages own provider-specific source parsing, fetching adapters, parser adapters, URL identity resolution, and provider workflows.
- The web package owns the browser wizard, Storybook surface, API client, and UI state.
- The domain package owns shared contracts and pure deterministic logic used across packages.

## Main Flow

- Scan starts from the server API and delegates provider retrieval to the selected concrete provider package.
- Provider parser routing chooses the matching editor implementation and converts supported editor blocks into parsed blocks.
- Renderer turns parsed blocks and templates into Markdown, resolves assets, and produces manifest-ready asset records.
- Export workflow writes Markdown/assets, updates job progress, persists resume data, and runs automatic upload/rewrite phases when `download-and-upload` is selected.
- Web reads bootstrap/defaults, drives scan/options/provider-test/export actions through HTTP APIs, and displays progress from polled job state.

## Boundaries

- Web runtime may import domain contracts and pure helpers only.
- Server may import domain, engine, and concrete provider packages.
- Engine may import domain but not web or server.
- Blog provider-neutral DTOs live in `packages/domain/src/blog-provider/schema/`.
- Blog provider runtime interfaces, registry, fetch policy, and provider-neutral export units live in `packages/engine/src/blog-provider/` and `packages/engine/src/exporting/provider/`.
- Concrete providers live in `packages/blog-*`.
- `blog-*` packages may depend on domain and engine, but must not define provider-neutral base types or contracts.
- Provider-specific fetchers, parsers, URL helpers, and workflows must stay inside the owning concrete provider package.
- Package and feature contracts live in the owning folder under `schema/`; cross-package contracts live in domain schema when shared across packages.
- Shared utilities live under the owning package/folder `util/`.
- Avoid barrel files and compatibility re-export files; import the current owner path directly.

## Storybook Flow

- Storybook source data is committed in the web package.
- A script renders the generated Storybook catalog through provider parser and engine renderer code.
- The web Storybook route reads the committed generated catalog and does not import engine at runtime.

## Change Signals

- Boundary changes require architecture and code-style knowledge updates.
- Parser routing or block output contract changes require parser knowledge updates.
- Export, upload, resume, or manifest behavior changes require domain/upload/verification knowledge updates.
- UI system or visual behavior changes require design knowledge updates.
