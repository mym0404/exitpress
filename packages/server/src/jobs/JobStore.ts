import { JOB_STATUSES, UPLOAD_STATUSES } from "@exitpress/domain/export-job/ExportJobState.js"

import type {
  ExportJobItem,
  ExportJobState,
  ExportManifest,
  ExportRequest,
} from "@exitpress/domain/export-job/Types.js"

import {
  buildJobItemFromPost,
  countUploadedCandidates,
  createQueuedJobState,
  hydrateJobState,
  syncManifestPostsFromItems,
} from "./JobStoreFactory.js"

export class JobStore {
  readonly jobs = new Map<string, ExportJobState>()

  create(request: ExportRequest) {
    const state = createQueuedJobState(request)

    this.jobs.set(state.id, state)

    return state
  }

  hydrate(manifest: ExportManifest) {
    const state = hydrateJobState(manifest)

    this.jobs.set(state.id, state)

    return state
  }

  get(id: string) {
    return this.jobs.get(id) ?? null
  }

  delete(id: string) {
    this.jobs.delete(id)
  }

  start(id: string) {
    const job = this.mustGet(id)
    job.status = JOB_STATUSES.RUNNING
    job.resumeAvailable = false
    job.startedAt = new Date().toISOString()
  }

  resume(id: string) {
    const job = this.mustGet(id)
    job.resumeAvailable = false
    job.finishedAt = null
    job.error = null
  }

  appendLog(id: string, message: string) {
    const job = this.mustGet(id)

    job.logs.push({
      timestamp: new Date().toISOString(),
      message,
    })
  }

  updateProgress(
    id: string,
    progress: {
      total: number
      completed: number
      failed: number
    },
  ) {
    const job = this.mustGet(id)
    job.progress = progress
  }

  appendItem(id: string, item: ExportJobItem) {
    const job = this.mustGet(id)
    const existingItemIndex = job.items.findIndex((existing) => existing.id === item.id)

    if (existingItemIndex >= 0) {
      job.items[existingItemIndex] = item
      return
    }

    job.items.push(item)
  }

  completeExport(id: string, manifest: ExportManifest) {
    const job = this.mustGet(id)
    job.manifest = manifest
    job.resumeAvailable = false
    job.progress = {
      total: manifest.totalPosts,
      completed: manifest.successCount,
      failed: manifest.failureCount,
    }
    job.upload = manifest.upload
    job.items =
      job.items.length > 0
        ? job.items
        : manifest.posts.map((post) => buildJobItemFromPost(post, new Date().toISOString()))

    if (manifest.upload.status === UPLOAD_STATUSES.UPLOAD_READY) {
      job.status = JOB_STATUSES.UPLOAD_READY
      job.finishedAt = null
      return
    }

    job.status = JOB_STATUSES.COMPLETED
    job.finishedAt = new Date().toISOString()
  }

  startUpload(id: string, initialUploadedLocalPaths: Set<string> = new Set()) {
    const job = this.mustGet(id)
    const updatedAt = new Date().toISOString()

    job.status = JOB_STATUSES.UPLOADING
    job.resumeAvailable = false
    job.error = null
    job.upload = {
      ...job.upload,
      status: UPLOAD_STATUSES.UPLOADING,
      uploadedCount: initialUploadedLocalPaths.size,
      failedCount: 0,
      terminalReason: null,
    }
    job.finishedAt = null
    job.items = job.items.map((item) =>
      item.upload.eligible
        ? item.upload.rewriteStatus === "completed"
          ? item
          : {
              ...item,
              upload: {
                ...item.upload,
                uploadedCount: countUploadedCandidates({
                  item,
                  uploadedLocalPaths: initialUploadedLocalPaths,
                }),
                failedCount: 0,
                uploadedUrls: [],
                rewriteStatus: "pending",
                rewrittenAt: null,
              },
              updatedAt,
            }
        : item,
    )

    if (job.manifest) {
      job.manifest.upload = {
        ...job.manifest.upload,
        status: UPLOAD_STATUSES.UPLOADING,
        uploadedCount: initialUploadedLocalPaths.size,
        failedCount: 0,
        terminalReason: null,
      }
      syncManifestPostsFromItems({
        manifest: job.manifest,
        items: job.items,
      })
    }
  }

  updateUpload(id: string, upload: ExportJobState["upload"]) {
    const job = this.mustGet(id)
    job.upload = upload
  }

  completeUpload(id: string, input: { manifest: ExportManifest; items: ExportJobItem[] }) {
    const job = this.mustGet(id)

    job.status = JOB_STATUSES.UPLOAD_COMPLETED
    job.resumeAvailable = false
    job.finishedAt = new Date().toISOString()
    job.manifest = input.manifest
    job.items = input.items
    job.upload = input.manifest.upload
  }

  failUpload(id: string, error: string) {
    const job = this.mustGet(id)
    const updatedAt = new Date().toISOString()

    job.status = JOB_STATUSES.UPLOAD_FAILED
    job.resumeAvailable = false
    job.finishedAt = new Date().toISOString()
    job.error = error
    job.upload = {
      ...job.upload,
      status: UPLOAD_STATUSES.UPLOAD_FAILED,
      failedCount: job.upload.candidateCount - job.upload.uploadedCount,
      terminalReason: null,
    }
    job.items = job.items.map((item) =>
      item.upload.eligible && item.upload.rewriteStatus !== "completed"
        ? {
            ...item,
            upload: {
              ...item.upload,
              failedCount: Math.max(item.upload.candidateCount - item.upload.uploadedCount, 0),
              rewriteStatus: "failed",
            },
            updatedAt,
          }
        : item,
    )

    if (job.manifest) {
      job.manifest.upload = {
        ...job.manifest.upload,
        status: UPLOAD_STATUSES.UPLOAD_FAILED,
        uploadedCount: job.upload.uploadedCount,
        failedCount: job.upload.failedCount,
        terminalReason: null,
      }
      syncManifestPostsFromItems({
        manifest: job.manifest,
        items: job.items,
      })
    }
  }

  fail(id: string, error: string) {
    const job = this.mustGet(id)
    job.status = JOB_STATUSES.FAILED
    job.resumeAvailable = false
    job.finishedAt = new Date().toISOString()
    job.error = error
  }

  private mustGet(id: string) {
    const job = this.jobs.get(id)

    if (!job) {
      throw new Error(`job not found: ${id}`)
    }

    return job
  }
}
