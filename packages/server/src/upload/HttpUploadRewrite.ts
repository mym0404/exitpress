import { UPLOAD_STATUSES } from "@exitpress/domain/export-job/ExportJobState.js"
import {
  rewriteImageUploadPost,
  writeImageUploadManifestSnapshot,
} from "@exitpress/engine/exporting/upload/ImageUploadRewriter.js"
import {
  isAbortOperationError,
  throwIfAborted,
} from "@exitpress/engine/infra/runtime/AbortOperation.js"
import { toErrorMessage } from "@exitpress/engine/shared/error/util/toErrorMessage.js"

import type { ImageUploadResult } from "@exitpress/engine/exporting/upload/ImageUploadPhase.js"

import type { JobStore } from "../jobs/JobStore.js"

import { getJobItemId } from "./HttpUploadProgress.js"

export const rewriteReadyPosts = async ({
  jobStore,
  jobId,
  uploadedLocalPaths,
  uploadResults,
  signal,
  postUploadRewriter = rewriteImageUploadPost,
  manifestSnapshotWriter = writeImageUploadManifestSnapshot,
}: {
  jobStore: JobStore
  jobId: string
  uploadedLocalPaths: Set<string>
  uploadResults: ImageUploadResult[]
  signal?: AbortSignal
  postUploadRewriter?: typeof rewriteImageUploadPost
  manifestSnapshotWriter?: typeof writeImageUploadManifestSnapshot
}) => {
  const job = jobStore.get(jobId)

  if (!job?.manifest) {
    return
  }

  const itemById = new Map(job.items.map((item) => [getJobItemId(item), item]))
  const readyPosts = job.manifest.posts.flatMap((post) => {
    const item = itemById.get(getJobItemId(post))

    if (
      !item ||
      !post.outputPath ||
      !item.outputPath ||
      !item.upload.eligible ||
      item.upload.rewriteStatus !== "pending"
    ) {
      return []
    }

    return item.upload.candidates.every((candidate) => uploadedLocalPaths.has(candidate.localPath))
      ? [{ post, item }]
      : []
  })

  if (readyPosts.length === 0) {
    return
  }

  const rewrittenAt = new Date().toISOString()

  for (const { post, item } of readyPosts) {
    throwIfAborted(signal)
    jobStore.appendLog(jobId, `문서 치환 시작: ${post.outputPath}`)

    try {
      const rewrittenEntry = await postUploadRewriter({
        outputDir: job.request.outputDir,
        post,
        item,
        uploadResults,
        rewrittenAt,
      })
      throwIfAborted(signal)

      job.items = job.items.map((currentItem) =>
        currentItem.outputPath === rewrittenEntry.item.outputPath
          ? rewrittenEntry.item
          : currentItem,
      )
      job.manifest = {
        ...job.manifest,
        upload: {
          ...job.manifest.upload,
          status: UPLOAD_STATUSES.UPLOADING,
          uploadedCount: uploadedLocalPaths.size,
          failedCount: 0,
          terminalReason: null,
        },
        posts: job.manifest.posts.map((currentPost) =>
          currentPost.outputPath === rewrittenEntry.post.outputPath
            ? rewrittenEntry.post
            : currentPost,
        ),
      }

      await manifestSnapshotWriter({
        outputDir: job.request.outputDir,
        manifest: job.manifest,
      })
      throwIfAborted(signal)
      jobStore.appendLog(jobId, `문서 치환 완료: ${post.outputPath}`)
    } catch (error) {
      if (isAbortOperationError(error)) {
        throw error
      }

      throw new Error(`Document rewrite failed for ${post.outputPath}: ${toErrorMessage(error)}`)
    }
  }
}
