import type { ExportJobState, ExportResumePhase, JobStatus, UploadStatus } from "./Types.js"

export const JOB_STATUSES = {
  COMPLETED: "completed",
  FAILED: "failed",
  QUEUED: "queued",
  RUNNING: "running",
  UPLOAD_COMPLETED: "upload-completed",
  UPLOAD_FAILED: "upload-failed",
  UPLOAD_READY: "upload-ready",
  UPLOADING: "uploading",
} as const satisfies Record<string, JobStatus>

export const UPLOAD_STATUSES = {
  NOT_REQUESTED: "not-requested",
  SKIPPED: "skipped",
  UPLOAD_COMPLETED: "upload-completed",
  UPLOAD_FAILED: "upload-failed",
  UPLOAD_READY: "upload-ready",
  UPLOADING: "uploading",
} as const satisfies Record<string, UploadStatus>

const terminalJobStatusMap: Record<JobStatus, boolean> = {
  [JOB_STATUSES.COMPLETED]: true,
  [JOB_STATUSES.FAILED]: true,
  [JOB_STATUSES.QUEUED]: false,
  [JOB_STATUSES.RUNNING]: false,
  [JOB_STATUSES.UPLOAD_COMPLETED]: true,
  [JOB_STATUSES.UPLOAD_FAILED]: true,
  [JOB_STATUSES.UPLOAD_READY]: false,
  [JOB_STATUSES.UPLOADING]: false,
}

export const isTerminalJobStatus = (status: JobStatus | null | undefined) =>
  status ? terminalJobStatusMap[status] : false

export const isUploadActionableJob = (
  job: Pick<ExportJobState, "status" | "resumeAvailable"> | null | undefined,
) =>
  Boolean(
    job &&
      (job.status === JOB_STATUSES.UPLOAD_READY ||
        job.status === JOB_STATUSES.UPLOAD_FAILED ||
        (job.status === JOB_STATUSES.UPLOADING && job.resumeAvailable)),
  )

export const resolveExportResumePhase = (status: JobStatus): ExportResumePhase => {
  if (status === JOB_STATUSES.UPLOAD_READY) {
    return "upload-ready"
  }

  if (status === JOB_STATUSES.UPLOADING) {
    return "uploading"
  }

  if (isTerminalJobStatus(status)) {
    return "result"
  }

  return "export"
}
