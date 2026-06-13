import { Box, Flash, FormControl, TextInput } from "@primer/react"

import { PrimerPanel, PrimerPanelBody } from "../../components/primer/PrimerPage.js"

const allScanStatusTones = ["default", "error"] as const
export type ScanStatusTone = (typeof allScanStatusTones)[number]

export const BlogInputPanel = ({
  sourceInput,
  outputDir,
  scanPending,
  scanStatus,
  scanStatusTone,
  onSourceIdOrUrlChange,
  onOutputDirChange,
  onOutputDirBlur,
}: {
  sourceInput: string
  outputDir: string
  scanPending: boolean
  scanStatus: string
  scanStatusTone: ScanStatusTone
  onSourceIdOrUrlChange: (value: string) => void
  onOutputDirChange: (value: string) => void
  onOutputDirBlur: () => void
}) => (
  <PrimerPanel>
    <PrimerPanelBody>
      <Box
        sx={{
          display: "grid",
          gap: 3,
          gridTemplateColumns: ["1fr", null, "minmax(0, 1.1fr) minmax(0, 1fr)"],
          alignItems: "start",
        }}
      >
        <FormControl id="sourceInput" disabled={scanPending}>
          <FormControl.Label>블로그 ID 또는 URL</FormControl.Label>
          <TextInput
            block
            id="sourceInput"
            placeholder="mym0404 또는 https://blog.naver.com/..."
            disabled={scanPending}
            value={sourceInput}
            aria-invalid={scanStatusTone === "error" || undefined}
            validationStatus={scanStatusTone === "error" ? "error" : undefined}
            onChange={(event) => onSourceIdOrUrlChange(event.target.value)}
          />
        </FormControl>
        <FormControl id="outputDir" required>
          <FormControl.Label>출력 경로</FormControl.Label>
          <TextInput
            block
            value={outputDir}
            onChange={(event) => onOutputDirChange(event.target.value)}
            onBlur={onOutputDirBlur}
          />
          <FormControl.Caption>결과를 저장할 위치입니다.</FormControl.Caption>
        </FormControl>
      </Box>
      <Flash
        id="scan-status"
        variant={scanStatusTone === "error" ? "danger" : "default"}
        sx={{ color: "fg.muted", fontSize: 1 }}
      >
        {scanStatus}
      </Flash>
    </PrimerPanelBody>
  </PrimerPanel>
)
