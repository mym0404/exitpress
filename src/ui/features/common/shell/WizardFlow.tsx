import { RiArrowRightLine, RiDownload2Line, RiLoader4Line, RiRadarLine } from "@remixicon/react"
import type { ScanResult } from "../../../../domain/blog/Types.js"
import type { ExportJobState } from "../../../../domain/export-job/Types.js"
import type { PartialExportOptions } from "../../../../domain/export-options/ExportOptions.js"
import type { ExportOptions } from "../../../../domain/export-options/Types.js"
import { JOB_STATUSES } from "../../../../domain/export-job/ExportJobState.js"
import { sanitizePersistedExportOptions } from "../../../../domain/export-options/ExportOptions.js"
import { exportOptionsStepMeta } from "../../options/ExportOptionsSteps.js"

export const setupSteps = [
  "blog-input",
  "category-selection",
  "structure-options",
  "frontmatter-options",
  "markdown-options",
  "assets-options",
  "links-options",
  "diagnostics-options",
] as const

export type SetupStep = (typeof setupSteps)[number]
export type WizardStep = SetupStep | "running" | "upload" | "result"

type SummaryCard = {
  label: string
  value: string
}

export const NextActionIcon = ({
  setupStep,
  scanPending,
  submitting,
}: {
  setupStep: SetupStep
  scanPending: boolean
  submitting: boolean
}) => {
  if (setupStep === "blog-input") {
    return scanPending ? (
      <RiLoader4Line className="size-4 motion-safe:animate-spin" aria-hidden="true" />
    ) : (
      <RiRadarLine className="size-4" aria-hidden="true" />
    )
  }

  if (setupStep === "diagnostics-options") {
    return submitting ? (
      <RiLoader4Line className="size-4 motion-safe:animate-spin" aria-hidden="true" />
    ) : (
      <RiDownload2Line className="size-4" aria-hidden="true" />
    )
  }

  return <RiArrowRightLine className="size-4" aria-hidden="true" />
}

export const stepMeta: Record<WizardStep, { title: string; description: string }> = {
  "blog-input": {
    title: "블로그 입력",
    description: "블로그 ID와 출력 경로를 정한 뒤 카테고리를 불러옵니다.",
  },
  "category-selection": {
    title: "카테고리 선택",
    description: "",
  },
  "structure-options": {
    title: exportOptionsStepMeta.structure.title,
    description: "",
  },
  "frontmatter-options": {
    title: exportOptionsStepMeta.frontmatter.title,
    description: "",
  },
  "markdown-options": {
    title: exportOptionsStepMeta.markdown.title,
    description: "",
  },
  "assets-options": {
    title: exportOptionsStepMeta.assets.title,
    description: "",
  },
  "links-options": {
    title: exportOptionsStepMeta.links.title,
    description: "",
  },
  "diagnostics-options": {
    title: exportOptionsStepMeta.diagnostics.title,
    description: "",
  },
  running: {
    title: "실행 중",
    description: "",
  },
  upload: {
    title: "Image Upload",
    description: "",
  },
  result: {
    title: "결과",
    description: "",
  },
}

export const getPersistedUiStateSignature = ({
  options,
  themePreference,
}: {
  options: ExportOptions | PartialExportOptions
  themePreference: "dark" | "light"
}) =>
  JSON.stringify({
    options: sanitizePersistedExportOptions(options),
    themePreference,
  })

export const resolveWizardStep = ({
  setupStep,
  jobStatus,
  submitting,
  uploadSubmitting,
}: {
  setupStep: string
  jobStatus: ExportJobState["status"] | undefined
  submitting: boolean
  uploadSubmitting: boolean
}) => {
  if (submitting || jobStatus === JOB_STATUSES.QUEUED || jobStatus === JOB_STATUSES.RUNNING) {
    return "running"
  }

  if (
    uploadSubmitting ||
    jobStatus === JOB_STATUSES.UPLOAD_READY ||
    jobStatus === JOB_STATUSES.UPLOADING ||
    jobStatus === JOB_STATUSES.UPLOAD_FAILED
  ) {
    return "upload"
  }

  if (
    jobStatus === JOB_STATUSES.COMPLETED ||
    jobStatus === JOB_STATUSES.FAILED ||
    jobStatus === JOB_STATUSES.UPLOAD_COMPLETED
  ) {
    return "result"
  }

  return setupStep
}

export const buildSummaryCards = ({
  currentStep,
  job,
  scopedPostCount,
  activeCategoryCount,
  selectedCount,
  outputDir,
}: {
  currentStep: string
  job: ExportJobState | null
  scopedPostCount: number
  activeCategoryCount: number
  selectedCount: number
  outputDir: string
}): SummaryCard[] => {
  if (currentStep === "running" || currentStep === "upload" || currentStep === "result") {
    const total = job?.progress.total ?? scopedPostCount

    return [
      { label: "총 글", value: String(total) },
      { label: "완료", value: String(job?.progress.completed ?? 0) },
      { label: "실패", value: String(job?.progress.failed ?? 0) },
      { label: "업로드", value: String(job?.upload.uploadedCount ?? 0) },
    ]
  }

  return [
    { label: "대상 글", value: String(scopedPostCount) },
    { label: "카테고리", value: String(activeCategoryCount) },
    { label: "선택", value: String(selectedCount) },
    { label: "출력", value: outputDir.trim() || "." },
  ]
}

export const getHeaderStatus = ({
  job,
  scanPending,
  activeScanResult,
}: {
  job: ExportJobState | null
  scanPending: boolean
  activeScanResult: ScanResult | null
}) => {
  if (job?.status) {
    return job.status
  }

  if (scanPending) {
    return "running"
  }

  if (activeScanResult) {
    return "ready"
  }

  return "idle"
}

export const getNextButtonLabel = ({
  setupStep,
  scanPending,
  submitting,
}: {
  setupStep: string
  scanPending: boolean
  submitting: boolean
}) => {
  switch (setupStep) {
    case "blog-input":
      return scanPending ? "스캔 중" : "카테고리 불러오기"
    case "category-selection":
      return "구조 설정"
    case "structure-options":
      return "Frontmatter 설정"
    case "frontmatter-options":
      return "Markdown 설정"
    case "markdown-options":
      return "Assets 설정"
    case "assets-options":
      return "Link 처리"
    case "links-options":
      return "진단 설정"
    case "diagnostics-options":
      return submitting ? "작업 등록 중" : "내보내기"
    default:
      return ""
  }
}
