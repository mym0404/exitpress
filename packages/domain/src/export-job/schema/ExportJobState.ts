import type { ExportManifest } from "./ExportManifest.js"
import type { ExportRequest } from "./ExportRequest.js"
import type { PostExportStatus, PostUploadSummary, UploadSummary } from "./UploadState.js"

export const allJobStatuses = [
  "queued",
  "running",
  "upload-ready",
  "uploading",
  "upload-completed",
  "upload-failed",
  "completed",
  "failed",
] as const
// Export and upload lifecycle states exposed by job polling.
export type JobStatus = (typeof allJobStatuses)[number]

// Human-readable progress message for the job detail view.
export type JobLog = {
  timestamp: string
  message: string
}

// Aggregate post export counters for progress bars and manifests.
export type ExportJobProgress = {
  total: number
  completed: number
  failed: number
}

// Per-post runtime state tracked while an export job runs.
export type ExportJobItem = {
  id: string
  postId: string
  title: string
  source: string
  category: {
    id: number
    name: string
    path: string[]
  }
  status: PostExportStatus
  outputPath: string | null
  assetPaths: string[]
  upload: PostUploadSummary
  error: string | null
  updatedAt: string
}

// Runtime state returned by job polling endpoints.
export type ExportJobState = {
  id: string
  request: ExportRequest
  status: JobStatus
  resumeAvailable?: boolean
  logs: JobLog[]
  createdAt: string
  startedAt: string | null
  finishedAt: string | null
  progress: ExportJobProgress
  upload: UploadSummary
  items: ExportJobItem[]
  manifest: ExportManifest | null
  error: string | null
}
