import type { ScanResult } from "@exitpress/domain/blog/schema/BlogScan.js"
import type { ExportJobState } from "@exitpress/domain/export-job/schema/ExportJobState.js"
import type { ExportResumeSummary } from "@exitpress/domain/export-job/schema/ExportManifest.js"

export const allResumeDialogSources = ["bootstrap", "before-scan"] as const
export type ResumeDialogSource = (typeof allResumeDialogSources)[number]

export type ResumeDialogState = {
  source: ResumeDialogSource
  resumedJob: ExportJobState
  resumeSummary: ExportResumeSummary
  resumedScanResult: ScanResult | null
}
