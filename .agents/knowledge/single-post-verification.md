# Single Post Verification

## Purpose
- Use this path to compare one public blog post against the single-post export CLI and manual browser observation.

## Export Command
```bash
bun scripts/single-post/export-single-post.ts \
  --blogKey naver \
  --sourceId my-blog \
  --postId 123456789012 \
  --outputDir tmp/manual-audit/123456789012/output \
  --report tmp/manual-audit/123456789012/report.json \
  --manualReviewMarkdownPath tmp/manual-audit/123456789012/post.md \
  --metadataCachePath tmp/manual-audit/123456789012/metadata-cache.json
```

## Inspect Command
```bash
bun scripts/single-post/export-single-post.ts \
  --inspect \
  --blogKey naver \
  --sourceId my-blog \
  --postId 123456789012 \
  --report tmp/manual-audit/123456789012/inspect.json
```

- Use inspect before implementing a parser block when the export error only names an unsupported editor node.
- Inspect mode fetches the post HTML, detects the editor, attempts parsing, and reports unsupported nodes with DOM path, tag, class, SE4 module type, text, and HTML snippet.
- Inspect mode does not require `--outputDir` and does not write Markdown, assets, or export folders.
- Add `--stdout` to emit the full inspect JSON to stdout. Without `--stdout`, the command prints a concise summary and writes full JSON only when `--report` is provided.

## Manual Loop
- Open the public post in a browser.
- Record visible editor version clues, block types, and unusual structure.
- Run inspect when a parser failure needs unsupported-node evidence.
- Run export with a `tmp/manual-audit/<postId>/` output.
- Compare browser structure, `post.md`, and `report.json`.
- Record whether the result is `as-expected`, `mismatch`, `error`, or `not-checked`.

## Evidence
- Use `scripts/post-evidence/capture-post-evidence.ts` when the comparison needs Markdown evidence with source capture and converted Markdown.
- Use `--target post` for full-post evidence and `--target inspect-path --inspectPath <path>` for block-level evidence.
- Post evidence section rules live in `.agents/knowledge/post-evidence.md`.

## Code Anchors
- `scripts/single-post/export-single-post.ts`
- `scripts/single-post/SinglePostArgs.ts`
- `scripts/single-post/SinglePostOptions.ts`
- `scripts/single-post/SinglePostSummary.ts`
- `scripts/single-post/SinglePostBlogRuntime.ts`
- `packages/blog-naver/src/exporting/SinglePostInspect.ts`
- `packages/blog-naver/src/exporting/SinglePostExport.ts`
