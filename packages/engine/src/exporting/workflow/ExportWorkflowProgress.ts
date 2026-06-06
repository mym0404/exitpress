import { UPLOAD_STATUSES } from "@exitpress/domain/export-job/ExportJobState.js"

import type { ExportJobItem, ExportManifest } from "@exitpress/domain/export-job/Types.js"

import type { ExportProgressState } from "../manifest/ExportManifestProgress.js"
import type { ProcessedPostResult } from "../post/PostExportResult.js"

export const flushCompletedPostResults = ({
  pendingResults,
  nextResultIndex,
  manifest,
  progressState,
  totalPosts,
  onItem,
  onProgress,
}: {
  pendingResults: Map<number, ProcessedPostResult>
  nextResultIndex: number
  manifest: ExportManifest
  progressState: ExportProgressState
  totalPosts: number
  onItem: ((item: ExportJobItem) => void) | null
  onProgress: (progress: { total: number; completed: number; failed: number }) => void
}) => {
  let nextIndex = nextResultIndex

  while (pendingResults.has(nextIndex)) {
    const result = pendingResults.get(nextIndex)

    pendingResults.delete(nextIndex)
    nextIndex += 1

    if (!result) {
      continue
    }

    if (result.manifestEntry.status === "success") {
      progressState.completed += 1
      manifest.successCount = progressState.completed

      for (const candidateLocalPath of result.uploadCandidateLocalPaths) {
        progressState.uploadCandidateMap.set(candidateLocalPath, true)
      }

      if (result.uploadEligible) {
        progressState.uploadEligiblePostCount += 1
      }
    } else {
      progressState.failed += 1
      manifest.failureCount = progressState.failed
    }

    manifest.posts.push(result.manifestEntry)
    onItem?.(result.jobItem)
    onProgress({
      total: totalPosts,
      completed: progressState.completed,
      failed: progressState.failed,
    })
  }

  return nextIndex
}

export const completeManifestUploadSummary = ({
  manifest,
  uploadEnabled,
  progressState,
  totalPosts,
}: {
  manifest: ExportManifest
  uploadEnabled: boolean
  progressState: ExportProgressState
  totalPosts: number
}) => {
  manifest.successCount = progressState.completed
  manifest.failureCount = progressState.failed
  manifest.totalPosts = totalPosts
  manifest.upload = uploadEnabled
    ? progressState.uploadCandidateMap.size > 0
      ? {
          status: UPLOAD_STATUSES.UPLOAD_READY,
          eligiblePostCount: progressState.uploadEligiblePostCount,
          candidateCount: progressState.uploadCandidateMap.size,
          uploadedCount: 0,
          failedCount: 0,
          terminalReason: null,
        }
      : {
          status: UPLOAD_STATUSES.SKIPPED,
          eligiblePostCount: 0,
          candidateCount: 0,
          uploadedCount: 0,
          failedCount: 0,
          terminalReason: "skipped-no-candidates",
        }
    : {
        status: UPLOAD_STATUSES.NOT_REQUESTED,
        eligiblePostCount: 0,
        candidateCount: 0,
        uploadedCount: 0,
        failedCount: 0,
        terminalReason: null,
      }
  manifest.finishedAt = new Date().toISOString()
}
