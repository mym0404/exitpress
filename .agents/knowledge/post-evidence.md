# Post Evidence

## Purpose
- Post evidence compares a public Naver Blog source and this repo's Markdown conversion in README-style Markdown sections.
- Use it for ingest reports, PR descriptions, parser coverage evidence, and README source assets.
- Evidence artifacts are harness/report output, not exported blog output.

## CLI
```bash
bun scripts/post-evidence/capture-post-evidence.ts \
  --blogId <blogId> \
  --logNo <logNo> \
  --target post \
  --metadata "SE4 quote conversion"
```

```bash
bun scripts/post-evidence/capture-post-evidence.ts \
  --blogId <blogId> \
  --logNo <logNo> \
  --target inspect-path \
  --inspectPath 0 \
  --metadata "SE4 quote block"
```

```bash
bun scripts/post-evidence/capture-post-evidence.ts \
  --case tmp/harness/post-evidence/cases.json \
  --metadataCachePath tmp/harness/post-evidence/metadata-cache.json \
  --outputDir tmp/harness/post-evidence/run
```

## Targets
- `--target post` captures the full mobile Naver post body and renders the full converted Markdown with frontmatter.
- `--target inspect-path` captures the node selected by a single-post inspect path and renders only the corresponding parsed block fragment.
- Inspect-path Markdown omits frontmatter and does not include post-level thumbnail frontmatter behavior.
- Use `bun scripts/single-post/export-single-post.ts --inspect` when a parser failure report does not already provide the inspect path.

## Export Options
- `--optionsPath` accepts the same JSON option shape used by single-post export helpers.
- Evidence Markdown generation honors export options, including block output options, Markdown link style, asset handling, and frontmatter selection.
- Default evidence options use remote asset references, disable image downloads, disable thumbnail downloads, disable compression, and omit `exportedAt`.
- Evidence capture should not download Naver image files unless an explicit options file intentionally changes asset behavior.

## Output
- The CLI writes `evidence.md`, `report.json`, and screenshot assets.
- The default output root is `tmp/harness/post-evidence/<blogId>-<logNo>-<timestamp>`.
- `--assetProfile tmp` writes assets under the output directory and is for local smoke output.
- `--assetProfile readme` writes assets under `.agents/knowledge/reference/assets/readme` so README fragments can reference stable repo-local assets.
- `--assetProfile figure` writes assets under `.agents/knowledge/reference/assets/figure` so PR/report figures can be committed separately from README assets.
- Persistent asset profiles write image links as repo-root-relative `.agents/...` paths rather than `tmp`-relative paths.
- `report.json` keeps per-section source URL, screenshot paths, Markdown text, and section errors.
- Any section error means the evidence document is incomplete until the capture or rendering issue is fixed or explicitly reported.

## Section Shape
- `evidence.md` renders one `###` section per evidence case.
- Keep each section in this order: metadata heading, source link, Naver capture image, Markdown code fence.
- Source links use the label `원문 보기`.
- Naver capture images render with `width="300"` so PR and report sections keep a readable image size.
- Markdown is rendered in a fenced `markdown` code block and preserves real line breaks.

## README Examples
- README examples use the same `###` section shape per block type.
- Reuse post evidence screenshot assets and Markdown snippets for README examples.
- Keep each README example in this order: block type heading, source link, Naver capture image, Markdown code fence.

## Metadata
- Treat metadata as a short human note.
- Prefer notes like parser block behavior, failure family, or conversion scenario.
- Do not fill it with routine state such as blog id, log number, title, or status unless that value is the useful note for the section.

## Capture Behavior
- Naver source screenshots use the mobile `m.blog.naver.com/PostView.naver` page.
- Full-post source capture targets `#viewTypeSelector`.
- Inspect-path source capture resolves the same editor-specific path reported by single-post inspect.
- Capture hides unrelated fixed and sticky mobile UI before screenshotting the selected node, so the mobile blog header does not cover the body block.
- Source screenshots capture the selected HTML node, not only the current viewport; long nodes may produce tall images.

## Ingest Reports
- `.agents/skills/ingest-blog/scripts/collect-blog-errors.ts` uses post evidence helpers when writing ingest reports.
- Post evidence helpers stay under `scripts/post-evidence` because both the manual evidence CLI and ingest reports use them.
- Completed ingest outputs may be reused; when a reusable manifest exists, rerun only failed posts unless `--forceFull` is requested.
- Ingest reports include `report.md`, `report.json`, `evidence.md`, and committed figure images under `.agents/knowledge/reference/assets/figure`.
- Ingest evidence Markdown omits source-post links, and committed figure asset filenames stay anonymous.
- Focused parser fixes represented in a report should include the changed parser block or extension, the representative fixture, related knowledge updates, verification results, and unresolved focused failures with reasons.
- PR bodies may include the focused report summary and evidence sections only after the user explicitly asks for PR creation or invokes the skill with that intent.

## Verification
- Run `bun scripts/post-evidence/capture-post-evidence.ts --help` after changing the CLI surface.
- Run at least one full-post smoke and one inspect-path smoke after changing capture behavior.
- Check `report.json.errorCount` before using generated evidence.
- Use `identify <asset>.png` or a visual image check when screenshot framing or target node capture behavior changes.
