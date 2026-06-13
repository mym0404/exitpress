import { JOB_STATUSES } from "@exitpress/domain/export-job/ExportJobState.js"
import { sanitizePersistedExportOptions } from "@exitpress/domain/export-options/ExportOptions.js"

import type { ScanResult } from "@exitpress/domain/blog/schema/BlogScan.js"
import type { ExportJobState } from "@exitpress/domain/export-job/schema/ExportJobState.js"
import type { ImageHandlingMode } from "@exitpress/domain/export-options/schema/ExportOptions.js"
import type { PartialExportOptions } from "@exitpress/domain/export-options/schema/ExportOptions.js"
import type { ExportOptions } from "@exitpress/domain/export-options/schema/ExportOptions.js"
import type { ThemePreference } from "@exitpress/domain/preferences/schema/ThemePreference.js"

import { exportOptionsStepMeta } from "../../options/ExportOptionsSteps.js"

export const setupSteps = [
  "blog-input",
  "category-selection",
  "structure-options",
  "frontmatter-options",
  "assets-options",
  "upload-provider-options",
  "links-options",
  "diagnostics-options",
] as const

const allWizardSteps = [
  ...setupSteps,
  "block-scan",
  "markdown-review",
  "running",
  "upload",
  "result",
] as const

export type SetupStep = (typeof setupSteps)[number]
export type WizardStep = (typeof allWizardSteps)[number]

type SummaryCard = {
  label: string
  value: string
}

export const stepMeta: Record<WizardStep, { title: string; description: string }> = {
  "blog-input": {
    title: "블로그 입력",
    description: "네이버 블로그 ID나 주소, 결과 저장 경로를 입력합니다.",
  },
  "category-selection": {
    title: "카테고리 선택",
    description: "카테고리, 포함 범위, 날짜 조건으로 내보낼 글을 고릅니다.",
  },
  "structure-options": {
    title: exportOptionsStepMeta.structure.title,
    description: "출력 폴더와 글 파일 이름 규칙을 정합니다.",
  },
  "frontmatter-options": {
    title: exportOptionsStepMeta.frontmatter.title,
    description: "Markdown 파일 앞에 넣을 메타데이터와 별칭을 설정합니다.",
  },
  "assets-options": {
    title: exportOptionsStepMeta.assets.title,
    description: "이미지와 썸네일 저장 방식을 고릅니다.",
  },
  "upload-provider-options": {
    title: "이미지 업로드 설정",
    description: "내보낸 이미지를 올릴 서비스와 인증 정보를 입력합니다.",
  },
  "links-options": {
    title: exportOptionsStepMeta.links.title,
    description: "같은 블로그 글 링크를 내보낸 결과에 맞춰 바꿉니다.",
  },
  "diagnostics-options": {
    title: exportOptionsStepMeta.diagnostics.title,
    description: "이미지 다운로드 실패 같은 예외 처리 방식을 고릅니다.",
  },
  "block-scan": {
    title: "Markdown 옵션 준비",
    description: "선택한 글에서 필요한 Markdown 옵션을 확인합니다.",
  },
  "markdown-review": {
    title: exportOptionsStepMeta.markdown.title,
    description: "감지한 에디터 블록의 Markdown 출력 방식을 고릅니다.",
  },
  running: {
    title: "실행 중",
    description: "선택한 글을 Markdown과 자산 파일로 내보내고 있습니다.",
  },
  upload: {
    title: "이미지 업로드",
    description: "내보낸 자산을 이미지 호스팅에 업로드합니다.",
  },
  result: {
    title: "결과",
    description: "완료 파일, 실패 항목, 로그를 확인합니다.",
  },
}

export const getPersistedUiStateSignature = ({
  options,
  themePreference,
}: {
  options: ExportOptions | PartialExportOptions
  themePreference: ThemePreference
}) =>
  JSON.stringify({
    options: sanitizePersistedExportOptions(options),
    themePreference,
  })

export const getNextSetupStep = ({
  setupStep,
  imageHandlingMode,
}: {
  setupStep: SetupStep
  imageHandlingMode: ImageHandlingMode
}) => {
  if (setupStep === "assets-options") {
    return imageHandlingMode === "download-and-upload" ? "upload-provider-options" : "links-options"
  }

  const nextStep = setupSteps[setupSteps.indexOf(setupStep) + 1]

  return nextStep ?? setupStep
}

export const getPreviousSetupStep = ({
  setupStep,
  imageHandlingMode,
}: {
  setupStep: SetupStep
  imageHandlingMode: ImageHandlingMode
}) => {
  if (setupStep === "links-options") {
    return imageHandlingMode === "download-and-upload"
      ? "upload-provider-options"
      : "assets-options"
  }

  const previousStep = setupSteps[setupSteps.indexOf(setupStep) - 1]

  return previousStep ?? setupStep
}

export const resolveWizardStep = ({
  setupStep,
  jobStatus,
  submitting,
}: {
  setupStep: string
  jobStatus: ExportJobState["status"] | undefined
  submitting: boolean
}) => {
  if (submitting || jobStatus === JOB_STATUSES.QUEUED || jobStatus === JOB_STATUSES.RUNNING) {
    return "running"
  }

  if (
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
      return "자산 설정"
    case "assets-options":
      return "다음"
    case "upload-provider-options":
      return "링크 처리"
    case "links-options":
      return "진단 설정"
    case "diagnostics-options":
      return submitting ? "작업 등록 중" : "내보내기"
    default:
      return ""
  }
}
