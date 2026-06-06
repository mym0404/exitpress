# Parser Architecture

## Scope
- Parser code converts Naver editor HTML into platform-neutral parsed blocks.
- Editor-specific logic stays inside the editor family that owns the HTML shape.
- Renderer and exporter behavior is outside parser ownership.

## Routing Flow
- The core parser receives post HTML plus parser options.
- Editor implementations decide whether they can parse a source.
- The selected editor applies ordered block parsers and returns parsed blocks plus post metadata.
- Unsupported or diagnostic paths should expose enough context for fixtures and evidence tools without changing normal output.

## Ownership
- Core parser code owns editor dispatch, shared parser contracts, diagnostics, and parsed block output helpers.
- Editor folders own block ordering, editor-local context, and editor-specific block converters.
- Block utilities stay under the owning block/editor `util/` folder.
- Shared parser contracts are imported from domain `schema/` files.
- Parser blocks own their parsed prop shape and Markdown template presets. Do not move block-specific output construction or template strings into shared helpers.
- Shared infrastructure may own editor dispatch, common schemas, asset resolution, and generic template evaluation only.

## File Structure Rules
- New parser contracts go in the owning domain `schema/` file, not a local catch-all type file.
- New parser helpers go in the closest owning `util/` folder.
- A single exported helper file uses the helper function name.
- Do not add parser inventories to knowledge docs; code and tests are the source of truth.
- Add or split parser blocks by user-visible content responsibility, not by incidental DOM variation alone.
- DOM variation is a split signal only when fixtures and parsing behavior show a different blog feature or a different prop contract.
- When a block parses list-like content, expose a structured array prop and keep nested asset paths resolvable through asset metadata.

## Verification
- Parser block changes require focused parser block tests and the offline suite.
- Parser routing changes require the offline suite.
- Storybook catalog changes require catalog generation/check commands plus Storybook tests.
