import { JOB_STATUSES } from "../../../../domain/export-job/ExportJobState.js"
import { cn } from "../../../lib/Cn.js"

export const getStatusPillClassName = (status: string | undefined) =>
  cn(
    "status-pill rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]",
    status === JOB_STATUSES.COMPLETED ||
      status === JOB_STATUSES.UPLOAD_COMPLETED ||
      status === "ready"
      ? "status-pill--success"
      : status === JOB_STATUSES.UPLOAD_READY
        ? "status-pill--ready"
        : status === JOB_STATUSES.RUNNING ||
            status === JOB_STATUSES.QUEUED ||
            status === "success" ||
            status === JOB_STATUSES.UPLOADING
          ? "status-pill--running"
          : status === JOB_STATUSES.FAILED || status === JOB_STATUSES.UPLOAD_FAILED
            ? "status-pill--error"
            : "status-pill--idle",
  )
