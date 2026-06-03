import type { ScanResult } from "../../domain/blog/Types.js"
import type { ExportJobState } from "../../domain/export-job/Types.js"
import type { SetupStep, WizardStep } from "../features/common/shell/WizardFlow.js"

import {
  buildSummaryCards,
  getHeaderStatus,
  getNextButtonLabel,
} from "../features/common/shell/WizardFlow.js"

export const shouldWarnBeforeLeavingApp = ({
  bootstrapping,
  blogIdOrUrl,
  outputDir,
  outputDirBaseline,
  activeScanResult,
  job,
}: {
  bootstrapping: boolean
  blogIdOrUrl: string
  outputDir: string
  outputDirBaseline: string
  activeScanResult: ScanResult | null
  job: ExportJobState | null
}) =>
  !bootstrapping &&
  (blogIdOrUrl.trim().length > 0 ||
    outputDir !== outputDirBaseline ||
    activeScanResult !== null ||
    Boolean(job))

export const getAppShellState = ({
  currentStep,
  job,
  scopedPostCount,
  activeCategoryCount,
  selectedCount,
  outputDir,
  scanPending,
  activeScanResult,
  setupStep,
  submitting,
  exportDisabled,
  currentScanTarget,
}: {
  currentStep: WizardStep
  job: ExportJobState | null
  scopedPostCount: number
  activeCategoryCount: number
  selectedCount: number
  outputDir: string
  scanPending: boolean
  activeScanResult: ScanResult | null
  setupStep: SetupStep
  submitting: boolean
  exportDisabled: boolean
  currentScanTarget: string
}) => ({
  summaryCards: buildSummaryCards({
    currentStep,
    job,
    scopedPostCount,
    activeCategoryCount,
    selectedCount,
    outputDir,
  }),
  headerStatus: getHeaderStatus({
    job,
    scanPending,
    activeScanResult,
  }) as ReturnType<typeof getHeaderStatus>,
  nextButtonLabel: getNextButtonLabel({
    setupStep,
    scanPending,
    submitting,
  }),
  nextDisabled:
    setupStep === "blog-input"
      ? currentScanTarget.length === 0 || scanPending
      : setupStep === "category-selection"
        ? !activeScanResult || selectedCount === 0
        : setupStep === "markdown-options"
          ? !activeScanResult
          : setupStep === "diagnostics-options"
            ? exportDisabled || submitting
            : !activeScanResult,
})
