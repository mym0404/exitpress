import { Box, Text } from "@primer/react"

import type { ExportJobState } from "@exitpress/domain/export-job/schema/ExportJobState.js"
import type { RefObject } from "react"

export const JobLogsPanel = ({
  job,
  logsScrollAreaRef,
}: {
  job: ExportJobState | null
  logsScrollAreaRef: RefObject<HTMLDivElement | null>
}) => (
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
    <Text sx={{ color: "fg.muted", fontSize: 1, lineHeight: "20px" }}>작업 로그</Text>
    <Box sx={{ borderTop: "1px solid", borderColor: "border.default" }} />
    <Box
      id="logs"
      ref={logsScrollAreaRef}
      aria-live="polite"
      sx={{
        maxHeight: "min(28rem, 56vh)",
        overflow: "auto",
        border: "1px solid",
        borderColor: "border.default",
        borderRadius: 2,
        bg: "canvas.subtle",
      }}
    >
      <Box
        sx={{
          display: "grid",
          minHeight: "100%",
          gap: 2,
          px: 3,
          py: 3,
          color: "fg.default",
          fontFamily: "mono",
          fontSize: 1,
        }}
      >
        {(job?.logs ?? []).map((entry, index) => (
          <Box
            key={`${entry.timestamp}-${index}`}
            data-job-log-entry
            sx={{
              display: "grid",
              gap: 1,
              pb: 2,
              borderBottom: "1px solid",
              borderColor: "border.muted",
              "&:last-child": { borderBottom: 0, pb: 0 },
            }}
          >
            <Box
              as="span"
              data-job-log-timestamp
              sx={{ color: "fg.muted", fontSize: 0, lineHeight: "16px" }}
            >
              {entry.timestamp}
            </Box>
            <Box
              as="span"
              data-job-log-message
              sx={{
                color: "fg.default",
                fontSize: 1,
                lineHeight: "20px",
                whiteSpace: "pre-wrap",
                overflowWrap: "anywhere",
              }}
            >
              {entry.message}
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  </Box>
)
