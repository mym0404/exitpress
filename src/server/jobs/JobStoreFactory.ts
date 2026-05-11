import type {
  ExportJobItem,
  ExportJobState,
  ExportManifest,
  ExportRequest,
} from "../../domain/export-job/Types.js"
import { JOB_STATUSES, UPLOAD_STATUSES } from "../../domain/export-job/ExportJobState.js"
import { randomUUID } from "node:crypto"

const getJobItemId = ({ outputPath, logNo }: { outputPath: string | null; logNo: string }) =>
  outputPath ?? `failed:${logNo}`

export const buildJobItemFromPost = (
  post: ExportManifest["posts"][number],
  updatedAt: string,
): ExportJobItem => ({
  id: getJobItemId(post),
  logNo: post.logNo,
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
