import { useEffect } from "react"

import type { MutableRefObject } from "react"

import type { ExportJobState } from "../../../domain/export-job/Types.js"

import { JOB_STATUSES } from "../../../domain/export-job/ExportJobState.js"
import { toast } from "../../components/ui/Sonner.js"

export const useJobNotifications = ({
  job,
  lastNotifiedJobKeyRef,
}: {
  job: ExportJobState | null
  lastNotifiedJobKeyRef: MutableRefObject<string | null>
}) => {
  useEffect(() => {
    if (!job) {
      lastNotifiedJobKeyRef.current = null
      return
    }

    const notificationKey = `${job.id}:${job.status}:${job.finishedAt ?? ""}`

    if (lastNotifiedJobKeyRef.current === notificationKey) {
      return
    }

    lastNotifiedJobKeyRef.current = notificationKey

    if (job.status === JOB_STATUSES.UPLOAD_READY) {
      toast("내보내기가 끝났습니다. Image Upload를 시작할 수 있습니다.", {
        description: `업로드 대상 ${job.upload.candidateCount}개`,
      })
      return
    }

    if (job.status === JOB_STATUSES.COMPLETED) {
      toast.success("내보내기가 완료되었습니다.", {
        description: `완료 ${job.progress.completed}개, 실패 ${job.progress.failed}개`,
      })
      return
    }

    if (job.status === JOB_STATUSES.UPLOAD_COMPLETED) {
      toast.success("Image Upload까지 완료되었습니다.", {
        description: `업로드 ${job.upload.uploadedCount}개`,
      })
      return
    }

    if (job.status === JOB_STATUSES.UPLOAD_FAILED) {
      toast.error("Image Upload에 실패했습니다.", {
        description: job.error ?? "로그를 확인하세요.",
      })
      return
    }

    if (job.status === JOB_STATUSES.FAILED) {
      toast.error("내보내기 작업이 실패했습니다.", {
        description: job.error ?? "로그를 확인하세요.",
      })
    }
  }, [job, lastNotifiedJobKeyRef])
}
