import { JOB_STATUSES } from "@exitpress/domain/export-job/ExportJobState.js"
import { sanitizePersistedExportOptions } from "@exitpress/domain/export-options/ExportOptions.js"
import { RiArrowRightLine, RiDownload2Line, RiLoader4Line, RiRadarLine } from "@remixicon/react"

import type { ScanResult } from "@exitpress/domain/blog/Types.js"
import type { ExportJobState } from "@exitpress/domain/export-job/Types.js"
import type { PartialExportOptions } from "@exitpress/domain/export-options/ExportOptions.js"
import type { ExportOptions } from "@exitpress/domain/export-options/Types.js"

import { exportOptionsStepMeta } from "../../options/ExportOptionsSteps.js"

export const setupSteps = [
  "blog-input",
  "category-selection",
  "structure-options",
  "frontmatter-options",
  "assets-options",
  "links-options",
  "diagnostics-options",
] as const

export type SetupStep = (typeof setupSteps)[number]
export type WizardStep =
  | SetupStep
  | "block-scan"
  | "markdown-review"
  | "running"
  | "upload"
  | "result"

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
    description: "네이버 블로그 ID나 주소와 결과를 저장할 경로를 먼저 정합니다.",
  },
  "category-selection": {
    title: "카테고리 선택",
    description: "카테고리, 포함 범위, 날짜 조건으로 내보낼 글을 좁힙니다.",
  },
  "structure-options": {
    title: exportOptionsStepMeta.structure.title,
    description: "출력 폴더와 글 파일 이름 규칙을 정합니다.",
  },
  "frontmatter-options": {
    title: exportOptionsStepMeta.frontmatter.title,
    description: "Markdown 파일 앞에 넣을 메타데이터와 alias를 정합니다.",
  },
  "assets-options": {
    title: exportOptionsStepMeta.assets.title,
    description: "이미지와 썸네일을 저장하거나 원본 URL로 유지할지 정합니다.",
  },
  "links-options": {
    title: exportOptionsStepMeta.links.title,
    description: "같은 블로그 글 링크를 export 결과 기준으로 바꿀지 정합니다.",
  },
  "diagnostics-options": {
    title: exportOptionsStepMeta.diagnostics.title,
    description: "이미지 다운로드 실패 같은 예외를 어떻게 다룰지 정합니다.",
  },
  "block-scan": {
    title: "Markdown 옵션 준비",
    description: "선택한 글에서 필요한 Markdown 옵션을 확인합니다.",
  },
  "markdown-review": {
    title: exportOptionsStepMeta.markdown.title,
    description: "감지된 에디터 블록별 Markdown 출력 방식을 정합니다.",
  },
  running: {
    title: "실행 중",
    description: "선택한 글을 Markdown과 자산 파일로 내보내는 중입니다.",
  },
  upload: {
    title: "Image Upload",
    description: "내보낸 자산을 이미지 호스팅 대상으로 업로드합니다.",
  },
  result: {
    title: "결과",
    description: "완료된 파일, 실패 항목, 로그를 확인합니다.",
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
