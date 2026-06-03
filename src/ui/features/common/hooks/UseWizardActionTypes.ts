import type { Dispatch, SetStateAction } from "react"

import type { ScanResult } from "../../../../domain/blog/Types.js"
import type { sanitizePersistedExportOptions } from "../../../../domain/export-options/ExportOptions.js"
import type { ExportOptions } from "../../../../domain/export-options/Types.js"
import type { UploadProviderFields } from "../../../../domain/upload/UploadProviderTypes.js"
import type { ExportBootstrapResponse } from "../../../lib/Api.js"
import type { createErrorJobState } from "../../job-results/ExportJobFallback.js"
import type { ResumeDialogState } from "../../resume/ResumeState.js"
import type { SetupStep } from "../shell/WizardFlow.js"

export type UseWizardActionsArgs = {
  isSetupStep: boolean
  setupStep: SetupStep
  setupStepIndex: number
  currentScanTarget: string
  outputDir: string
  outputDirBaseline: string
  activeScanResult: ScanResult | null
  scanCache: Record<string, ScanResult>
  scopedPostCount: number
  options: ExportOptions
  resumeDialog: ResumeDialogState | null
  frontmatterValidationErrors: string[]
  updateOptions: (updater: (current: ExportOptions) => ExportOptions) => void
  startBlockScan: () => Promise<void>
  startUpload: (args: {
    providerKey: string
    providerFields: UploadProviderFields
  }) => Promise<unknown>
  resumeJob: () => Promise<unknown>
  hydrateJob: (job: ExportBootstrapResponse["resumedJob"]) => void
  applyResumedState: (args: {
    source: ResumeDialogState["source"]
    resumedJob: NonNullable<ExportBootstrapResponse["resumedJob"]>
    resumeSummary: NonNullable<ExportBootstrapResponse["resumeSummary"]>
    resumedScanResult: ScanResult | null
  }) => void
  applyBootstrapState: (defaults: ExportBootstrapResponse) => void
  setJob: (job: ReturnType<typeof createErrorJobState>) => void
  setResumeDialog: (value: ResumeDialogState | null) => void
  setScanCache: Dispatch<SetStateAction<Record<string, ScanResult>>>
  setScanPending: (value: boolean) => void
  setCategoryStatus: (value: string) => void
  setCategorySearch: (value: string) => void
  setSetupStep: (value: SetupStep) => void
  setActiveJobFilter: (value: "all" | "success" | "failed") => void
  setResettingResume: (value: boolean) => void
  setRestoringResume: (value: boolean) => void
  setBlogIdOrUrl: (value: string) => void
  setOutputDir: Dispatch<SetStateAction<string>>
  setNeutralScanStatus: (message: string) => void
  setErrorScanStatus: (message: string) => void
  setOptions: Dispatch<SetStateAction<ExportOptions>>
  latestPersistedOptionsRef: { current: ReturnType<typeof sanitizePersistedExportOptions> }
  latestThemePreferenceRef: { current: "dark" | "light" }
  persistedUiStateSignatureRef: { current: string | null }
}

export type WizardScanActionsArgs = Pick<
  UseWizardActionsArgs,
  | "currentScanTarget"
  | "outputDir"
  | "outputDirBaseline"
  | "activeScanResult"
  | "scanCache"
  | "options"
  | "setResumeDialog"
  | "setScanCache"
  | "setScanPending"
  | "setCategoryStatus"
  | "setCategorySearch"
  | "setSetupStep"
  | "setBlogIdOrUrl"
  | "setOutputDir"
  | "setNeutralScanStatus"
  | "setErrorScanStatus"
  | "setOptions"
  | "updateOptions"
>
