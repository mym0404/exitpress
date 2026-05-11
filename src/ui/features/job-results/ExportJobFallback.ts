import type { ExportJobState } from "../../../domain/export-job/Types.js"
import type { ExportOptions } from "../../../domain/export-options/Types.js"
import {
  isUploadActionableJob,
  JOB_STATUSES,
  UPLOAD_STATUSES,
} from "../../../domain/export-job/ExportJobState.js"

export const shouldLoadUploadProviders = (job: ExportJobState | null) => isUploadActionableJob(job)

export const createErrorJobState = ({
  error,
  request,
}: {
  error: string
  request: { blogIdOrUrl: string; outputDir: string; options: ExportOptions }
}) =>
  ({
    id: "failed-local",
    request: {
      blogIdOrUrl: request.blogIdOrUrl,
      outputDir: request.outputDir,
      profile: "gfm",
      options: request.options,
    },
    status: JOB_STATUSES.FAILED,
    resumeAvailable: false,
    logs: [],
    createdAt: new Date().toISOString(),
    startedAt: new Date().toISOString(),
    finishedAt: new Date().toISOString(),
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
    error,
  }) satisfies ExportJobState
