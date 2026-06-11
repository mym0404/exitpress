import { JOB_STATUSES } from "@exitpress/domain/export-job/ExportJobState.js"

import type { ExportJobState } from "@exitpress/domain/export-job/schema/ExportJobState.js"

import { Button } from "../../components/ui/Button.js"
import { Progress } from "../../components/ui/Progress.js"

import { CompactMetrics } from "./CompactMetrics.js"
import { toProgressValue } from "./JobResultsHelpers.js"

export const RunningProgressSection = ({
  job,
  resumeSubmitting,
  onResumeExport,
}: {
  job: ExportJobState | null
  resumeSubmitting: boolean
  onResumeExport: () => Promise<void> | void
}) => {
  const runningProgressValue = toProgressValue(
    job?.progress.completed ?? 0,
    job?.progress.total ?? 0,
  )
  const showResumeExportButton = job?.status === JOB_STATUSES.RUNNING && job.resumeAvailable

  return (
    <section className="subtle-panel grid gap-4 rounded-[1.5rem] p-4">
      <div className="field-card grid gap-2 rounded-2xl p-4">
        <div className="flex items-center justify-between gap-3">
          <strong className="text-sm font-semibold text-foreground">수집 진행률</strong>
          <span className="text-sm text-muted-foreground">
            {job?.progress.completed ?? 0} / {job?.progress.total ?? 0}
          </span>
        </div>
        <Progress
          id="running-progress"
          value={runningProgressValue}
          indicatorClassName="bg-[var(--status-running-fg)]"
        />
      </div>
      <CompactMetrics
        items={[
          { label: "총 글", value: String(job?.progress.total ?? 0) },
          { label: "완료", value: String(job?.progress.completed ?? 0) },
          { label: "실패", value: String(job?.progress.failed ?? 0) },
        ]}
        className="field-card rounded-2xl px-4 py-3"
      />
      {showResumeExportButton ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[color-mix(in_srgb,var(--status-running-fg)_25%,transparent)] bg-[var(--status-running-bg)] px-4 py-3">
          <p className="info-copy text-sm leading-6">
            이전 내보내기 상태를 복구했습니다. 남은 글만 이어서 내보냅니다.
          </p>
          <Button
            id="resume-export-submit"
            type="button"
            className="rounded-xl"
            disabled={resumeSubmitting}
            onClick={() => {
              void onResumeExport()
            }}
          >
            {resumeSubmitting ? "재개 중..." : "남은 작업 계속"}
          </Button>
        </div>
      ) : null}
    </section>
  )
}

export const ExportSummarySection = ({ job }: { job: ExportJobState | null }) => (
  <section className="subtle-panel grid gap-4 rounded-[1.5rem] p-4">
    <CompactMetrics
      items={[
        { label: "총 글", value: String(job?.progress.total ?? 0) },
        { label: "완료", value: String(job?.progress.completed ?? 0) },
        { label: "실패", value: String(job?.progress.failed ?? 0) },
        { label: "업로드", value: String(job?.upload.uploadedCount ?? 0) },
      ]}
      className="field-card rounded-2xl px-4 py-3"
    />

    {job?.status === JOB_STATUSES.FAILED && job.error ? (
      <p className="danger-copy text-sm leading-7">{job.error}</p>
    ) : null}

    {job?.upload.status === "skipped" ? (
      <p className="text-sm leading-7 text-muted-foreground">
        업로드할 로컬 이미지가 없어 내보내기만 끝났습니다.
      </p>
    ) : null}
  </section>
)
