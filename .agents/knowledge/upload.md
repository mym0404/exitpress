# Upload And Resume

## Upload Flow
- `download-and-upload` finishes export first, then keeps the same job and enters `upload-ready -> uploading -> upload-completed | upload-failed`.
- Post-export upload input is collected in the result panel as `providerKey + providerFields`; it is not stored as an export option.
- `providerFields` values are scalar `string | number | boolean`.
- Upload provider catalog comes from the installed PicList runtime and is normalized for UI display by `src/server/ImageUploadProviderSource.ts`.
- GitHub upload with jsDelivr enabled locks `customUrl` and derives `https://cdn.jsdelivr.net/gh/<repo>@<branch>`; empty branch omits `@<branch>`.

## Progress Semantics
- Export progress is processed posts over total posts.
- Upload progress is uploaded unique local assets over total unique upload candidates.
- Job-level upload candidate count is unique `localPath` count, not per-post reference count.
- Row status is post-based: `대기`, `부분 완료`, `완료`, `실패`.
- A row is complete only when its needed upload candidates are uploaded and its Markdown rewrite is complete.
- If upload fails after some rewrites, completed rows stay complete and incomplete rows show failure.
- If no upload candidates exist, `download-and-upload` closes as completed with skipped upload semantics instead of entering upload.

## Resume Source Of Truth
- `src/server/jobs/ExportJobManifest.ts` reads and writes `manifest.json` as the recovery source.
- `manifest.json.job` carries request, status, phase, progress, upload snapshot, scan result, summary, timestamps, and optional error.
- `src/server/http/HttpServer.ts` hydrates bootstrap state from the last output directory's `manifest.json`.
- `src/server/jobs/JobStore.ts` keeps upload counters, item-level upload counters, and rewrite status in polling payloads.

## Current Risk Seam
- Fast live upload can finish before 1-second polling observes intermediate `uploading` state.
- `src/server/jobs/JobStore.ts` and `src/ui/features/job-results/JobResultsPanel.tsx` preserve the last upload snapshot so the result stage still shows progress evidence after completion.
- `tests/e2e/run-ui-live-upload.ts` uses run-unique GitHub paths so live upload evidence is not hidden by a reused path.

## Verification
- `mise exec -- pnpm smoke:ui`: mock upload/rewrite UI state, result table, and resume surfaces.
- `mise exec -- pnpm test:network:upload`: live browser export plus PicList GitHub upload.
- `mise exec -- pnpm test:network:resume-export`: manifest-based resume export without upload.
