import { UPLOAD_STATUSES } from "@exitpress/domain/export-job/ExportJobState.js"
import {
  ImageUploadPhaseError,
  runImageUploadPhase,
} from "@exitpress/engine/exporting/upload/ImageUploadPhase.js"
import {
  rewriteImageUploadPost,
  writeImageUploadManifestSnapshot,
} from "@exitpress/engine/exporting/upload/ImageUploadRewriter.js"
import { dedupeUploadCandidatesByLocalPath } from "@exitpress/engine/exporting/upload/util/dedupeUploadCandidatesByLocalPath.js"
import {
  isAbortOperationError,
  throwIfAborted,
} from "@exitpress/engine/infra/runtime/AbortOperation.js"

import type { UnknownRecord } from "@exitpress/engine/shared/object/UnknownRecord.js"

import type { JobStore } from "../jobs/JobStore.js"

import { sanitizeUploadError } from "./HttpUploadConfig.js"
import { syncJobUploadProgress } from "./HttpUploadProgress.js"
import { rewriteReadyPosts } from "./HttpUploadRewrite.js"
import { buildSeededUploadedLocalPaths, buildSeededUploadResults } from "./HttpUploadSeed.js"

export const runUploadForJob = async ({
  jobStore,
  uploadPhaseRunner,
  postUploadRewriter,
  manifestSnapshotWriter,
  flushManifestPersist,
  scheduleJobManifestPersist,
  failJobOnError = false,
  jobId,
  uploaderKey,
  uploaderConfig,
  signal,
}: {
  jobStore: JobStore
  uploadPhaseRunner: typeof runImageUploadPhase
  postUploadRewriter: typeof rewriteImageUploadPost
  manifestSnapshotWriter: typeof writeImageUploadManifestSnapshot
  flushManifestPersist: (jobId: string) => Promise<void>
  scheduleJobManifestPersist: (jobId: string) => void
  failJobOnError?: boolean
  jobId: string
  uploaderKey: string
  uploaderConfig: UnknownRecord
  signal?: AbortSignal
}) => {
  const job = jobStore.get(jobId)

  if (!job?.manifest) {
    return
  }

  const uploadedLocalPaths = buildSeededUploadedLocalPaths(job.items)
  const uploadResults = buildSeededUploadResults(job.items)
  const candidates = dedupeUploadCandidatesByLocalPath(
    job.items
      .filter((item) => item.upload.eligible && item.upload.rewriteStatus !== "completed")
      .flatMap((item) => item.upload.candidates),
  )

  jobStore.startUpload(jobId, uploadedLocalPaths)
  jobStore.appendLog(jobId, "이미지 업로드를 시작했습니다.")
  await flushManifestPersist(jobId)

  try {
    await rewriteReadyPosts({
      jobStore,
      jobId,
      uploadedLocalPaths,
      uploadResults,
      signal,
      postUploadRewriter,
      manifestSnapshotWriter,
    })

    const phaseResults = await uploadPhaseRunner({
      outputDir: job.request.outputDir,
      candidates,
      uploaderKey,
      uploaderConfig,
      abortSignal: signal,
      onProgress: ({ lastCompletedLocalPath }) => {
        if (lastCompletedLocalPath) {
          uploadedLocalPaths.add(lastCompletedLocalPath)
        }

        syncJobUploadProgress({
          jobStore,
          jobId,
          uploadedLocalPaths,
        })
        scheduleJobManifestPersist(jobId)
      },
      onAssetStart: (candidate) => {
        jobStore.appendLog(jobId, `이미지 업로드 시작: ${candidate.localPath}`)
        scheduleJobManifestPersist(jobId)
      },
      onAssetUploaded: async ({ result }) => {
        uploadedLocalPaths.add(result.candidate.localPath)
        uploadResults.push(result)
        jobStore.appendLog(jobId, `이미지 업로드 완료: ${result.candidate.localPath}`)

        syncJobUploadProgress({
          jobStore,
          jobId,
          uploadedLocalPaths,
        })
        await flushManifestPersist(jobId)
        await rewriteReadyPosts({
          jobStore,
          jobId,
          uploadedLocalPaths,
          uploadResults,
          signal,
          postUploadRewriter,
          manifestSnapshotWriter,
        })
        await flushManifestPersist(jobId)
      },
    })

    for (const result of phaseResults) {
      if (
        uploadResults.some(
          (existing) => existing.candidate.localPath === result.candidate.localPath,
        )
      ) {
        continue
      }

      uploadResults.push(result)
      uploadedLocalPaths.add(result.candidate.localPath)
    }

    syncJobUploadProgress({
      jobStore,
      jobId,
      uploadedLocalPaths,
    })
    await flushManifestPersist(jobId)
    await rewriteReadyPosts({
      jobStore,
      jobId,
      uploadedLocalPaths,
      uploadResults,
      signal,
      postUploadRewriter,
      manifestSnapshotWriter,
    })
    await flushManifestPersist(jobId)
    throwIfAborted(signal)

    const completedJob = jobStore.get(jobId)

    if (!completedJob?.manifest) {
      return
    }

    const completedManifest = {
      ...completedJob.manifest,
      upload: {
        ...completedJob.manifest.upload,
        status: UPLOAD_STATUSES.UPLOAD_COMPLETED,
        uploadedCount: completedJob.manifest.upload.candidateCount,
        failedCount: 0,
        terminalReason: null,
      },
    }

    await manifestSnapshotWriter({
      outputDir: completedJob.request.outputDir,
      manifest: completedManifest,
    })
    throwIfAborted(signal)
    jobStore.completeUpload(jobId, {
      manifest: completedManifest,
      items: completedJob.items,
    })
    jobStore.appendLog(jobId, "이미지 업로드와 결과 치환이 완료되었습니다.")
    await flushManifestPersist(jobId)
  } catch (error) {
    if (error instanceof ImageUploadPhaseError) {
      syncJobUploadProgress({
        jobStore,
        jobId,
        uploadedLocalPaths: new Set([
          ...uploadedLocalPaths,
          ...error.uploadedResults.map((result) => result.candidate.localPath),
        ]),
      })
      await flushManifestPersist(jobId)
    }

    const message = isAbortOperationError(error)
      ? "작업이 초기화되어 중단되었습니다."
      : sanitizeUploadError({
          error,
          providerFields: Object.fromEntries(
            Object.entries(uploaderConfig).flatMap(([key, value]) =>
              typeof value === "string" ? [[key, value]] : [],
            ),
          ),
        })

    jobStore.appendLog(jobId, message)
    jobStore.failUpload(jobId, message)

    if (failJobOnError) {
      jobStore.fail(jobId, message)
    }

    await flushManifestPersist(jobId)
  }
}
