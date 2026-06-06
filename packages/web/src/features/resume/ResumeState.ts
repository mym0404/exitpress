import type { ScanResult } from "@exitpress/domain/blog/Types.js"
import type { ExportJobState, ExportResumeSummary } from "@exitpress/domain/export-job/Types.js"

export type ResumeDialogState = {
  source: "bootstrap" | "before-scan"
  resumedJob: ExportJobState
  resumeSummary: ExportResumeSummary
  resumedScanResult: ScanResult | null
}
