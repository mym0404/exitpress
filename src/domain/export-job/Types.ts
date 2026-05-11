import type { CategoryInfo, ScanResult } from "../blog/Types.js"
import type { ExportOptions } from "../export-options/Types.js"

type ExportProfile = "gfm"

export type ExportRequest = {
  blogIdOrUrl: string
  outputDir: string
  profile: ExportProfile
  options: ExportOptions
}

export type UploadCandidate = {
  kind: "image" | "thumbnail"
  sourceUrl: string
  localPath: string
  markdownReference: string
}

type UploadTerminalReason = "skipped-no-candidates"

type UploadRewriteStatus = "pending" | "completed" | "failed"

export type UploadStatus =
  | "not-requested"
  | "upload-ready"
  | "uploading"
  | "upload-completed"
  | "upload-failed"
  | "skipped"

type UploadSummary = {
  status: UploadStatus
  eligiblePostCount: number
  candidateCount: number
  uploadedCount: number
  failedCount: number
  terminalReason: UploadTerminalReason | null
}

type PostUploadSummary = {
  eligible: boolean
  candidateCount: number
  uploadedCount: number
  failedCount: number
  candidates: UploadCandidate[]
  uploadedUrls: string[]
  rewriteStatus: UploadRewriteStatus
  rewrittenAt: string | null
}

export type AssetRecord = {
  kind: "image" | "thumbnail"
  sourceUrl: string
  reference: string
  relativePath: string | null
  storageMode: "relative" | "remote"
  uploadCandidate: UploadCandidate | null
}

export type PostManifestEntry = {
  logNo: string
  title: string
  source: string
  category: {
    id: number
    name: string
    path: string[]
  }
  status: "success" | "failed"
  outputPath: string | null
  assetPaths: string[]
  upload: PostUploadSummary
  error: string | null
}

export type ExportJobItem = {
  id: string
  logNo: string
  title: string
  source: string
  category: {
    id: number
    name: string
    path: string[]
  }
  status: "success" | "failed"
  outputPath: string | null
  assetPaths: string[]
  upload: PostUploadSummary
  error: string | null
  updatedAt: string
}

export type JobStatus =
  | "queued"
  | "running"
  | "upload-ready"
  | "uploading"
  | "upload-completed"
  | "upload-failed"
  | "completed"
  | "failed"

type JobLog = {
  timestamp: string
  message: string
}

export type ExportJobState = {
  id: string
  request: ExportRequest
  status: JobStatus
  resumeAvailable?: boolean
  logs: JobLog[]
  createdAt: string
  startedAt: string | null
  finishedAt: string | null
  progress: {
    total: number
    completed: number
    failed: number
  }
  upload: UploadSummary
  items: ExportJobItem[]
  manifest: ExportManifest | null
  error: string | null
}

export type ExportResumePhase = "export" | "upload-ready" | "uploading" | "result"

export type ExportResumeSummary = {
  status: JobStatus
  outputDir: string
  totalPosts: number
  completedCount: number
  failedCount: number
  uploadCandidateCount: number
  uploadedCount: number
}

export type ExportManifestScanResult = Pick<ScanResult, "blogId" | "totalPostCount">

type ExportManifestJobState = {
  id: string
  phase: ExportResumePhase
  request: ExportRequest
  status: JobStatus
  createdAt: string
  startedAt: string | null
  finishedAt: string | null
  updatedAt: string
  progress: ExportJobState["progress"]
  upload: UploadSummary
  error: string | null
  scanResult: ExportManifestScanResult | null
  summary: ExportResumeSummary
}

export type ExportManifest = {
  blogId: string
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

export type ExportJobPollingConfig = {
  defaultPollMs: number
  fastPollMs: number
  uploadBurstPollMs: number
  uploadBurstAttempts: number
}
