import type { ScanResult } from "@exitpress/domain/blog/schema/BlogScan.js"
import type { ExportJobState } from "@exitpress/domain/export-job/schema/ExportJobState.js"

import type { SetupStep, WizardStep } from "../features/common/shell/WizardFlow.js"

import {
  buildSummaryCards,
  getHeaderStatus,
  getNextButtonLabel,
} from "../features/common/shell/WizardFlow.js"

export const shouldWarnBeforeLeavingApp = ({
  bootstrapping,
  sourceInput,
  outputDir,
  outputDirBaseline,
  activeScanResult,
  job,
}: {
  bootstrapping: boolean
  sourceInput: string
  outputDir: string
  outputDirBaseline: string
  activeScanResult: ScanResult | null
  job: ExportJobState | null
}) =>
  !bootstrapping &&
  (sourceInput.trim().length > 0 ||
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
        : setupStep === "diagnostics-options"
          ? exportDisabled || submitting
          : !activeScanResult,
})
