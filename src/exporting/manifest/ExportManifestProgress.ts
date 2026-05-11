import type { ScanResult } from "../../domain/blog/Types.js"
import type {
  ExportManifest,
  ExportRequest,
  UploadCandidate,
} from "../../domain/export-job/Types.js"
import { UPLOAD_STATUSES } from "../../domain/export-job/ExportJobState.js"

export type ExportProgressState = {
  completed: number
  failed: number
  uploadEligiblePostCount: number
  uploadCandidateMap: Map<string, true>
}

export const createInitialManifest = ({
  resumeManifest,
  blogId,
  profile,
  options,
  categories,
  totalPosts,
  uploadEnabled,
}: {
  resumeManifest: ExportManifest | null
  blogId: string
  profile: ExportRequest["profile"]
  options: ExportRequest["options"]
  categories: ScanResult["categories"]
  totalPosts: number
  uploadEnabled: boolean
}): ExportManifest =>
  resumeManifest
    ? {
        ...resumeManifest,
        options,
        categories,
        finishedAt: null,
      }
    : {
        blogId,
        profile,
        options,
        selectedCategoryIds: options.scope.categoryIds,
        startedAt: new Date().toISOString(),
        finishedAt: null,
        totalPosts,
        successCount: 0,
        failureCount: 0,
        upload: {
          status: uploadEnabled ? UPLOAD_STATUSES.UPLOAD_READY : UPLOAD_STATUSES.NOT_REQUESTED,
          eligiblePostCount: 0,
          candidateCount: 0,
          uploadedCount: 0,
          failedCount: 0,
          terminalReason: null,
        },
        categories,
        posts: [],
      }

export const createExportProgressState = (manifest: ExportManifest): ExportProgressState => ({
  completed: manifest.successCount,
  failed: manifest.failureCount,
  uploadEligiblePostCount: manifest.posts.reduce(
    (count, post) => count + (post.status === "success" && post.upload.eligible ? 1 : 0),
    0,
  ),
  uploadCandidateMap: new Map<string, true>(
    manifest.posts.flatMap((post) =>
      post.status === "success"
        ? post.upload.candidates.map((candidate) => [candidate.localPath, true] as const)
        : [],
    ),
  ),
})

export const createPostUploadSummary = (uploadCandidates: UploadCandidate[]) => ({
  eligible: uploadCandidates.length > 0,
  candidateCount: uploadCandidates.length,
  uploadedCount: 0,
  failedCount: 0,
  candidates: uploadCandidates,
  uploadedUrls: [],
  rewriteStatus: "pending" as const,
  rewrittenAt: null,
})
