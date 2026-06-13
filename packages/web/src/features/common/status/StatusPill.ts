import { JOB_STATUSES } from "@exitpress/domain/export-job/ExportJobState.js"

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
