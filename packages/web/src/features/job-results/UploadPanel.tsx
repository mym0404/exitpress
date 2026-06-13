import { JOB_STATUSES } from "@exitpress/domain/export-job/ExportJobState.js"
import { Box, Flash, ProgressBar, Text } from "@primer/react"

import type { ExportJobState } from "@exitpress/domain/export-job/schema/ExportJobState.js"

import type { JobResultsMode } from "./JobResultsHelpers.js"

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
      <Box
        sx={{
          display: "grid",
          gap: 3,
          "@media (min-width: 1012px)": {
            gridTemplateColumns: "minmax(0, 1fr) auto",
            alignItems: "start",
          },
        }}
      >
        {panelCopy[mode].description ? (
          <Text sx={{ color: "fg.muted", fontSize: 1, lineHeight: "20px" }}>
            {panelCopy[mode].description}
          </Text>
        ) : (
          <Box />
        )}
        <CompactMetrics
          items={[
            { label: "대상 글", value: String(job?.upload.eligiblePostCount ?? 0) },
            { label: "대상 자산", value: String(job?.upload.candidateCount ?? 0) },
            { label: "업로드 완료", value: String(job?.upload.uploadedCount ?? 0) },
            { label: "실패", value: String(job?.upload.failedCount ?? 0) },
          ]}
          sx={{
            bg: "canvas.subtle",
            borderRadius: 2,
            px: 3,
            py: 2,
            "@media (min-width: 1012px)": { maxWidth: "32rem", justifyContent: "flex-end" },
          }}
        />
      </Box>

      <Box sx={{ display: "grid", gap: 2, bg: "canvas.subtle", borderRadius: 2, p: 3 }}>
        <Box
          sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 3 }}
        >
          <Box as="strong" sx={{ color: "fg.default", fontSize: 1, fontWeight: 600 }}>
            업로드 진행률
          </Box>
          <Text sx={{ color: "fg.muted", fontSize: 1 }}>
            {job?.upload.uploadedCount ?? 0} / {job?.upload.candidateCount ?? 0}
          </Text>
        </Box>
        <ProgressBar id="upload-progress" progress={uploadProgressValue} barSize="large" />
      </Box>

      {job?.upload.status === "skipped" ? (
        <Text sx={{ color: "fg.muted", fontSize: 1, lineHeight: "20px" }}>
          업로드할 로컬 이미지가 없어 내보내기만 끝났습니다.
        </Text>
      ) : null}

      {job?.status === JOB_STATUSES.UPLOAD_FAILED && job.error ? (
        <Flash variant="danger">{job.error}</Flash>
      ) : null}
    </Box>
  )
}
