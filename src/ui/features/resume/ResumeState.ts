import type { ExportJobState, ExportResumeSummary } from "../../../modules/exporter/Types.js"
import type { ScanResult } from "../../../modules/blog/Types.js"

export type ResumeDialogState = {
  source: "bootstrap" | "before-scan"
  resumedJob: ExportJobState
  resumeSummary: ExportResumeSummary
  resumedScanResult: ScanResult | null
}
