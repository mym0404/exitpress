import type { CategoryInfo, ScanResult } from "../../blog/schema/BlogScan.js"
import type { ExportOptions } from "../../export-options/schema/ExportOptions.js"

import type { ExportJobProgress, JobStatus } from "./ExportJobState.js"
import type { ExportProfile, ExportRequest } from "./ExportRequest.js"
import type { PostExportStatus, PostUploadSummary, UploadSummary } from "./UploadState.js"

export const allExportResumePhases = ["export", "upload-ready", "uploading", "result"] as const
// Resume phase shown when the server rehydrates a previous export.
export type ExportResumePhase = (typeof allExportResumePhases)[number]

// Compact resume card data derived from the manifest job snapshot.
export type ExportResumeSummary = {
  status: JobStatus
  outputDir: string
  totalPosts: number
  completedCount: number
  failedCount: number
  uploadCandidateCount: number
  uploadedCount: number
}

// Scan metadata kept in the manifest without duplicating the full scan.
export type ExportManifestScanResult = Pick<ScanResult, "blogKey" | "sourceId" | "totalPostCount">

type ExportManifestJobState = {
  id: string
  phase: ExportResumePhase
  request: ExportRequest
  status: JobStatus
  createdAt: string
  startedAt: string | null
  finishedAt: string | null
  updatedAt: string
  progress: ExportJobProgress
  upload: UploadSummary
  error: string | null
  scanResult: ExportManifestScanResult | null
  summary: ExportResumeSummary
}

export type PostManifestEntry = {
  blogKey: string
  sourceId: string
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
}

// Resumable export record written beside exported posts.
export type ExportManifest = {
  blogKey: string
  sourceId: string
  profile: ExportProfile
  options: ExportOptions
  selectedCategoryIds: number[]
  startedAt: string
  finishedAt: string | null
  totalPosts: number
  successCount: number
  failureCount: number
  upload: UploadSummary
  categories: CategoryInfo[]
  posts: PostManifestEntry[]
  job?: ExportManifestJobState
}
