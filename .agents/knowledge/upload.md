# Upload And Resume

## Upload Flow
- Export discovers local asset candidates while rendering posts.
- Upload starts only when export output has upload candidates and a provider is selected.
- Upload provider metadata comes from the server runtime catalog.
- Upload progress tracks candidate counts, uploaded counts, failures, rewrite status, and final terminal state.

## Resume Flow
- Manifest and local state are the source of truth for resumable jobs.
- Bootstrap can restore a running, upload-ready, uploading, failed-upload, or completed result state.
- Resume summaries must contain enough information for the web UI to show the right step and dialog.

## Boundaries
- Domain schema files define shared job/upload/manifest contracts.
- Engine owns asset records, upload candidate dedupe, upload phase execution, and Markdown rewrite.
- Server owns runtime upload provider catalog and HTTP upload routes.
- Web owns provider form state, field rules, upload submission, progress display, and retry actions.

## Verification
- Upload or resume contract changes require server/job tests, web hook tests, smoke UI, and relevant network e2e when credentials are available.
- Mock smoke proves browser flow only.
- Live upload e2e is the bundled proof for external upload state.
