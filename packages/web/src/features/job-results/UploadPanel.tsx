import { JOB_STATUSES } from "@exitpress/domain/export-job/ExportJobState.js"

import type { ExportJobState } from "@exitpress/domain/export-job/schema/ExportJobState.js"

import type { JobResultsMode } from "./JobResultsHelpers.js"

import { CardDescription } from "../../components/ui/Card.js"
import { Progress } from "../../components/ui/Progress.js"

import { CompactMetrics } from "./CompactMetrics.js"
import { panelCopy, toProgressValue } from "./JobResultsHelpers.js"

type UploadPanelProps = {
  mode: JobResultsMode
  job: ExportJobState | null
}

export const UploadPanel = ({ mode, job }: UploadPanelProps) => {
  const uploadProgressValue = toProgressValue(
    job?.upload.uploadedCount ?? 0,
    job?.upload.candidateCount ?? 0,
  )

  return (
    <section className="upload-panel subtle-panel grid gap-4 rounded-[1.5rem] p-4">
      <div className="grid gap-3 lg:flex lg:items-start lg:justify-between">
        {panelCopy[mode].description ? (
          <div>
            <CardDescription className="text-sm leading-7 text-muted-foreground">
              {panelCopy[mode].description}
            </CardDescription>
          </div>
        ) : null}
        <CompactMetrics
          items={[
            { label: "대상 글", value: String(job?.upload.eligiblePostCount ?? 0) },
            { label: "대상 자산", value: String(job?.upload.candidateCount ?? 0) },
            { label: "업로드 완료", value: String(job?.upload.uploadedCount ?? 0) },
            { label: "실패", value: String(job?.upload.failedCount ?? 0) },
          ]}
          className="field-card rounded-2xl px-4 py-3 lg:max-w-[32rem] lg:justify-end"
        />
      </div>

      <div className="field-card grid gap-2 rounded-2xl p-4">
        <div className="flex items-center justify-between gap-3">
          <strong className="text-sm font-semibold text-foreground">업로드 진행률</strong>
          <span className="text-sm text-muted-foreground">
            {job?.upload.uploadedCount ?? 0} / {job?.upload.candidateCount ?? 0}
          </span>
        </div>
        <Progress
          id="upload-progress"
          value={uploadProgressValue}
          indicatorClassName="bg-[var(--status-ready-fg)]"
        />
      </div>

      {job?.upload.status === "skipped" ? (
        <p className="text-sm leading-7 text-muted-foreground">
          업로드할 로컬 이미지가 없어 내보내기만 끝났습니다.
        </p>
      ) : null}

      {job?.status === JOB_STATUSES.UPLOAD_FAILED && job.error ? (
        <p className="danger-copy text-sm leading-7">{job.error}</p>
      ) : null}
    </section>
  )
}
