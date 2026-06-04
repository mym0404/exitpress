import { JOB_STATUSES } from "../../../../domain/export-job/ExportJobState.js"
import { cn } from "../../../lib/Cn.js"

export const getStatusPillClassName = (status: string | undefined) =>
  cn(
    "status-pill rounded-full px-2 py-0.5 text-[10px] font-semibold",
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

export const getStatusPillLabel = (status: string | undefined) => {
  switch (status) {
    case "idle":
      return "대기"
    case "ready":
      return "준비"
    case JOB_STATUSES.QUEUED:
      return "대기열"
    case JOB_STATUSES.RUNNING:
      return "실행"
    case JOB_STATUSES.COMPLETED:
      return "완료"
    case JOB_STATUSES.FAILED:
      return "실패"
    case JOB_STATUSES.UPLOAD_READY:
      return "업로드"
    case JOB_STATUSES.UPLOADING:
      return "업로드 중"
    case JOB_STATUSES.UPLOAD_COMPLETED:
      return "업로드 완료"
    case JOB_STATUSES.UPLOAD_FAILED:
      return "업로드 실패"
    default:
      return status ?? "대기"
  }
}
