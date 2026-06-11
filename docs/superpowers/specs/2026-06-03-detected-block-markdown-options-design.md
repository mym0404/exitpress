# Detected Block Markdown Options Design

## Goal
- Markdown block output options should appear only for block families detected in the posts the user will actually export.
- Detection should happen after blog scan and export scope selection, before the user reaches Markdown options.
- HTML fetched during block detection must be reused during export so the feature does not add avoidable duplicate post-body fetches.

## Current Context
- `/api/scan` currently returns categories and, when requested by the UI, post summaries.
- `ScanResult` currently contains `blogId`, `totalPostCount`, `categories`, and optional `posts`.
- The UI shows all `blockOutputDefinitions` from bootstrap in `MarkdownOptionsStep`.
- Actual post body fetch and parsing currently happens later in `exportPostUnit()`.
- Parsed AST blocks already carry `outputSelectionKey` when a parser block has configurable output options.
- `NaverBlogFetcher` already supports injected `getPostHtml` and `setPostHtml` cache hooks.

## Architecture
- Keep `/api/scan` as the category and post-list scan endpoint.
- Add a block detection endpoint that runs after category and date scope selection.
- Extend the scan state with optional detected block output keys.
- Filter Markdown option definitions in the UI by detected keys.
- Add a server-side post HTML cache under `.cache/` and inject it into both block detection and export.

## API
- Add `POST /api/scan-blocks`.
- Request body:
  - `blogIdOrUrl`: current blog ID or URL.
  - `scanResult`: current scan result with posts.
  - `options`: current export options, including scope filters.
- Server behavior:
  - Normalize the blog ID.
  - Clone options using existing option normalization.
  - Reuse `filterPostsByScope()` to select the actual export target posts.
  - Fetch each target post HTML through `NaverBlogFetcher` with the shared post HTML cache.
  - Parse each post with `parsePostHtml()`.
  - Collect unique `outputSelectionKey` values from parsed blocks.
- Response body:
  - `detectedBlockOutputKeys: string[]`.

## UI Flow
- `blog-input` remains the initial scan step.
- `category-selection` remains where category and date filters are chosen.
- Moving forward from `category-selection` triggers block detection.
- While detection is pending, the next action shows loading and remains disabled against duplicate submits.
- After detection succeeds, the UI stores `detectedBlockOutputKeys` in the active `ScanResult`.
- `markdown-options` receives only definitions whose key is present in `detectedBlockOutputKeys`.
- If no configurable block output key is detected, the wizard skips `markdown-options` and moves to `assets-options`.

## Cache Reuse
- Add a repo-local post HTML cache path under `.cache/`.
- The cache key uses `blogId` and `logNo`.
- Block detection writes fetched HTML to this cache.
- Export uses the same cache through `NaverBlogFetcher`.
- Cache use is not exposed as a new UI setting.

## Error Handling
- Block detection is all-or-nothing.
- If any target post fails to fetch or parse, the wizard stays on `category-selection`.
- The UI shows the failure through existing status/toast patterns.
- Partial detection is not used because it can hide an option required by a post that failed during detection.

## Tests
- Add domain or server tests for `POST /api/scan-blocks` returning unique detected keys for scoped posts.
- Add UI option tests showing `MarkdownOptionsStep` only renders definitions whose keys were detected.
- Add wizard flow tests proving category selection triggers detection before Markdown options.
- Add export/cache tests proving HTML fetched during detection can be reused by export without another network fetch.

## Verification
- Run `pnpm check:local` after implementation.
- Run `pnpm smoke:ui` because the wizard flow and UI state transitions change.

## Open Constraints
- Do not change parser block output semantics.
- Do not add a user-facing cache setting.
- Do not keep broad fallback behavior for pre-filtered Markdown option rendering beyond existing bootstrap defaults.
