import { JOB_STATUSES } from "@exitpress/domain/export-job/ExportJobState.js"
import { Box, Button, Flash, ProgressBar, Text } from "@primer/react"

import type { ExportJobState } from "@exitpress/domain/export-job/schema/ExportJobState.js"

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
    <Box
      as="section"
      sx={{
        display: "grid",
        gap: 3,
        border: "1px solid",
        borderColor: "border.default",
        borderRadius: 2,
        p: 3,
      }}
    >
      <Box sx={{ display: "grid", gap: 2, bg: "canvas.subtle", borderRadius: 2, p: 3 }}>
        <Box
          sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 3 }}
        >
          <Box as="strong" sx={{ color: "fg.default", fontSize: 1, fontWeight: 600 }}>
            수집 진행률
          </Box>
          <Text sx={{ color: "fg.muted", fontSize: 1 }}>
            {job?.progress.completed ?? 0} / {job?.progress.total ?? 0}
          </Text>
        </Box>
        <ProgressBar id="running-progress" progress={runningProgressValue} barSize="large" />
      </Box>
      <CompactMetrics
        items={[
          { label: "총 글", value: String(job?.progress.total ?? 0) },
          { label: "완료", value: String(job?.progress.completed ?? 0) },
          { label: "실패", value: String(job?.progress.failed ?? 0) },
        ]}
        sx={{ bg: "canvas.subtle", borderRadius: 2, px: 3, py: 2 }}
      />
      {showResumeExportButton ? (
        <Flash>
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 3,
            }}
          >
            <Text sx={{ fontSize: 1, lineHeight: "20px" }}>
              이전 내보내기 상태를 복구했습니다. 남은 글만 이어서 내보냅니다.
            </Text>
            <Button
              id="resume-export-submit"
              type="button"
              disabled={resumeSubmitting}
              onClick={() => {
                void onResumeExport()
              }}
            >
              {resumeSubmitting ? "재개 중..." : "남은 작업 계속"}
            </Button>
          </Box>
        </Flash>
      ) : null}
    </Box>
  )
}

export const ExportSummarySection = ({ job }: { job: ExportJobState | null }) => (
  <Box
    as="section"
    sx={{
      display: "grid",
      gap: 3,
      border: "1px solid",
      borderColor: "border.default",
      borderRadius: 2,
      p: 3,
    }}
  >
    <CompactMetrics
      items={[
        { label: "총 글", value: String(job?.progress.total ?? 0) },
        { label: "완료", value: String(job?.progress.completed ?? 0) },
        { label: "실패", value: String(job?.progress.failed ?? 0) },
        { label: "업로드", value: String(job?.upload.uploadedCount ?? 0) },
      ]}
      sx={{ bg: "canvas.subtle", borderRadius: 2, px: 3, py: 2 }}
    />

    {job?.status === JOB_STATUSES.FAILED && job.error ? (
      <Flash variant="danger">{job.error}</Flash>
    ) : null}

    {job?.upload.status === "skipped" ? (
      <Text sx={{ color: "fg.muted", fontSize: 1, lineHeight: "20px" }}>
        업로드할 로컬 이미지가 없어 내보내기만 끝났습니다.
      </Text>
    ) : null}
  </Box>
)
