import { randomUUID } from "node:crypto"

import { JOB_STATUSES, UPLOAD_STATUSES } from "@exitpress/domain/export-job/ExportJobState.js"

import type {
  ExportJobItem,
  ExportJobState,
} from "@exitpress/domain/export-job/schema/ExportJobState.js"
import type { ExportManifest } from "@exitpress/domain/export-job/schema/ExportManifest.js"
import type { ExportRequest } from "@exitpress/domain/export-job/schema/ExportRequest.js"

const getJobItemId = ({ outputPath, postId }: { outputPath: string | null; postId: string }) =>
  outputPath ?? `failed:${postId}`

// Converts persisted manifest posts back into polling job items.
export const buildJobItemFromPost = (
  post: ExportManifest["posts"][number],
  updatedAt: string,
): ExportJobItem => ({
  id: getJobItemId(post),
  blogKey: post.blogKey,
  sourceId: post.sourceId,
  postId: post.postId,
  title: post.title,
  source: post.source,
  category: post.category,
  status: post.status,
  outputPath: post.outputPath,
  assetPaths: post.assetPaths,
  upload: post.upload,
  error: post.error,
  updatedAt,
})

// Creates the initial in-memory state before the export worker starts.
export const createQueuedJobState = (request: ExportRequest): ExportJobState => ({
  id: randomUUID(),
  request,
  status: JOB_STATUSES.QUEUED,
  resumeAvailable: false,
  logs: [],
  createdAt: new Date().toISOString(),
  startedAt: null,
  finishedAt: null,
  progress: {
    total: 0,
    completed: 0,
    failed: 0,
  },
  upload: {
    status: UPLOAD_STATUSES.NOT_REQUESTED,
    eligiblePostCount: 0,
    candidateCount: 0,
    uploadedCount: 0,
    failedCount: 0,
    terminalReason: null,
  },
  items: [],
  manifest: null,
  error: null,
})

// Rehydrates an export job from the manifest snapshot written beside output files.
export const hydrateJobState = (manifest: ExportManifest): ExportJobState => {
  if (!manifest.job) {
    throw new Error("manifest job snapshot is missing")
  }

  return {
    id: manifest.job.id,
    request: manifest.job.request,
    status: manifest.job.status,
    resumeAvailable:
      manifest.job.status === JOB_STATUSES.RUNNING ||
      manifest.job.status === JOB_STATUSES.UPLOADING,
    logs: [],
    createdAt: manifest.job.createdAt,
    startedAt: manifest.job.startedAt,
    finishedAt: manifest.job.finishedAt,
    progress: manifest.job.progress,
    upload: manifest.job.upload,
    items: manifest.posts.map((post) => buildJobItemFromPost(post, manifest.job!.updatedAt)),
    manifest,
    error: manifest.job.error,
  }
}

// Counts upload candidates that already have uploaded local paths.
export const countUploadedCandidates = ({
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

// Copies current job item upload data back into manifest posts.
export const syncManifestPostsFromItems = ({
  manifest,
  items,
}: {
  manifest: ExportManifest
  items: ExportJobItem[]
}) => {
  const itemById = new Map(items.map((item) => [getJobItemId(item), item]))

  manifest.posts = manifest.posts.map((post) => {
    const item = itemById.get(getJobItemId(post))

    return item
      ? {
          ...post,
          assetPaths: item.assetPaths,
          upload: item.upload,
        }
      : post
  })
}
