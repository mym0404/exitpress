import { UPLOAD_STATUSES } from "@exitpress/domain/export-job/ExportJobState.js"

import type { ExportJobItem } from "@exitpress/domain/export-job/schema/ExportJobState.js"
import type { ExportManifest } from "@exitpress/domain/export-job/schema/ExportManifest.js"

import type { JobStore } from "../jobs/JobStore.js"

export const getJobItemId = ({ outputPath, logNo }: { outputPath: string | null; logNo: string }) =>
  outputPath ?? `failed:${logNo}`

const countUploadedCandidates = ({
  item,
  uploadedLocalPaths,
}: {
  item: ExportJobItem
  uploadedLocalPaths: Set<string>
}) =>
  item.upload.candidates.reduce(
    (count, candidate) => count + (uploadedLocalPaths.has(candidate.localPath) ? 1 : 0),
    0,
  )

const syncManifestUploadProgress = ({
  manifest,
  items,
  uploadedLocalPaths,
}: {
  manifest: ExportManifest
  items: ExportJobItem[]
  uploadedLocalPaths: Set<string>
}) => {
  const itemById = new Map(items.map((item) => [getJobItemId(item), item]))

  manifest.upload = {
    ...manifest.upload,
    status: UPLOAD_STATUSES.UPLOADING,
    uploadedCount: uploadedLocalPaths.size,
    failedCount: 0,
    terminalReason: null,
  }
  manifest.posts = manifest.posts.map((post) => {
    const item = itemById.get(getJobItemId(post))

    if (!item) {
      return post
    }

    return {
      ...post,
      assetPaths: item.assetPaths,
      upload: {
        ...post.upload,
        ...item.upload,
        uploadedCount: countUploadedCandidates({
          item,
          uploadedLocalPaths,
        }),
      },
    }
  })
}

export const syncJobUploadProgress = ({
  jobStore,
  jobId,
  uploadedLocalPaths,
}: {
  jobStore: JobStore
  jobId: string
  uploadedLocalPaths: Set<string>
}) => {
  const job = jobStore.get(jobId)

  if (!job) {
    return
  }

  const updatedAt = new Date().toISOString()
  const nextItems = job.items.map((item) => {
    if (!item.upload.eligible) {
      return item
    }

    const uploadedCount = countUploadedCandidates({
      item,
      uploadedLocalPaths,
    })

    if (uploadedCount === item.upload.uploadedCount && item.upload.failedCount === 0) {
      return item
    }

    return {
      ...item,
      upload: {
        ...item.upload,
        uploadedCount,
        failedCount: 0,
      },
      updatedAt,
    }
  })

  job.items = nextItems

  jobStore.updateUpload(jobId, {
    ...job.upload,
    status: UPLOAD_STATUSES.UPLOADING,
    uploadedCount: uploadedLocalPaths.size,
    failedCount: 0,
    terminalReason: null,
  })

  if (job.manifest) {
    syncManifestUploadProgress({
      manifest: job.manifest,
      items: nextItems,
      uploadedLocalPaths,
    })
  }
}
