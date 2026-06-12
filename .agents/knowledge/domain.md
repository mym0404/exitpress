# Domain

## Product Surface
- The app exports public blog posts into local Markdown, assets, frontmatter, and a resumable manifest.
- Users choose blog source, output path, category/date scope, Markdown output options, asset handling, link rewrite, and upload behavior.

## Core Concepts
- Blog identity: shared contracts use `blogKey`, `sourceInput`, `sourceId`, and `postId`.
- Blog scan: categories, post summaries, detected block template keys, and scan cache state.
- Export options: scope, output structure, frontmatter, block templates, asset handling, and same-blog link behavior.
- Parser output: parsed posts, parsed blocks, block props, tables, media, and asset dependencies.
- Export job: request, progress, logs, item results, upload progress, manifest, and resume summary.
- Upload: local candidates, provider fields, uploaded URLs, rewrite status, and terminal upload state.

## Contract Placement
- Shared contracts live in the domain package under the owning folder's `schema/`.
- Runtime constants that back literal unions use const assertion values with derived types.
- Domain contracts are imported directly from their owning schema file.
- Domain pure helpers may live beside their feature or under that feature's `util/` folder.

## Output Rules
- Markdown output should be stable and path-safe.
- Frontmatter includes only enabled fields with configured aliases.
- Asset records distinguish local relative paths from remote URLs.
- Manifest state must be sufficient to resume export/upload/result screens.

## UI And State Rules
- Web state mirrors server bootstrap, scan cache, export options, job state, upload provider catalog, and theme preference.
- Persisted UI settings must exclude transient job-only fields.
- Resume state comes from manifest/local state, not from browser-only assumptions.
