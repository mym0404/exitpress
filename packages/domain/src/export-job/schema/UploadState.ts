export const allUploadCandidateKinds = ["image", "thumbnail"] as const
// Asset kinds eligible for the upload and rewrite phase.
export type UploadCandidateKind = (typeof allUploadCandidateKinds)[number]

export const allUploadTerminalReasons = ["skipped-no-candidates"] as const
// Final upload reason when the phase ends without provider work.
export type UploadTerminalReason = (typeof allUploadTerminalReasons)[number]

export const allUploadRewriteStatuses = ["pending", "completed", "failed"] as const
// Rewrite state for Markdown references after upload completes.
export type UploadRewriteStatus = (typeof allUploadRewriteStatuses)[number]

export const allUploadStatuses = [
  "not-requested",
  "upload-ready",
  "uploading",
  "upload-completed",
  "upload-failed",
  "skipped",
] as const
// Aggregate upload phase state exposed on export jobs and manifests.
export type UploadStatus = (typeof allUploadStatuses)[number]

export const allAssetStorageModes = ["relative", "remote"] as const
// Storage mode for an asset reference written to Markdown.
export type AssetStorageMode = (typeof allAssetStorageModes)[number]

export const allPostExportStatuses = ["success", "failed"] as const
// Final export result for a single post.
export type PostExportStatus = (typeof allPostExportStatuses)[number]

// A local asset that can be uploaded and later rewritten in Markdown.
export type UploadCandidate = {
  kind: UploadCandidateKind
  sourceUrl: string
  localPath: string
  markdownReference: string
}

// Aggregate upload counters stored on jobs and manifests.
export type UploadSummary = {
  status: UploadStatus
  eligiblePostCount: number
  candidateCount: number
  uploadedCount: number
  failedCount: number
  terminalReason: UploadTerminalReason | null
}

// Per-post upload state used to rewrite exported Markdown safely.
export type PostUploadSummary = {
  eligible: boolean
  candidateCount: number
  uploadedCount: number
  failedCount: number
  candidates: UploadCandidate[]
  uploadedUrls: string[]
  rewriteStatus: UploadRewriteStatus
  rewrittenAt: string | null
}

// Asset entry written into the export manifest.
export type AssetRecord = {
  kind: UploadCandidateKind
  sourceUrl: string
  reference: string
  relativePath: string | null
  storageMode: AssetStorageMode
  uploadCandidate: UploadCandidate | null
}
