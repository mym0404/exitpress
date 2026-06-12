import type { BlockScanJobState } from "@exitpress/domain/block-scan/schema/BlockScanJobState.js"
import type { PostSummary, ScanResult } from "@exitpress/domain/blog/schema/BlogScan.js"
import type { ExportJobState } from "@exitpress/domain/export-job/schema/ExportJobState.js"
import type { ExportOptions } from "@exitpress/domain/export-options/schema/ExportOptions.js"
import type { UploadProviderCatalogResponse } from "@exitpress/domain/upload/schema/UploadProvider.js"
import type { Dispatch, SetStateAction } from "react"

import type { WizardStep } from "../features/common/shell/WizardFlow.js"
import type { JobFilter } from "../features/job-results/JobResultsHelpers.js"
import type { ScanStatusTone } from "../features/scan/BlogInputPanel.js"
import type { UploadProviderSettingsValue } from "../features/upload/UploadProviderSettingsForm.js"
import type { ExportBootstrapResponse } from "../lib/Api.js"

import { Button } from "../components/ui/Button.js"
import { Progress } from "../components/ui/Progress.js"
import { JobResultsPanel } from "../features/job-results/JobResultsPanel.js"
import { ExportOptionsPanel } from "../features/options/ExportOptionsPanel.js"
import { UploadProviderOptionsStep } from "../features/options/UploadProviderOptionsStep.js"
import { BlogInputPanel } from "../features/scan/BlogInputPanel.js"
import { CategoryPanel } from "../features/scan/CategoryPanel.js"

type AppStepViewProps = {
  currentStep: WizardStep
  job: ExportJobState | null
  activeJobFilter: JobFilter
  submitting: boolean
  uploadProviders: UploadProviderCatalogResponse
  uploadProviderError: string | null
  uploadProviderStepMessage: string | null
  testUploadSubmitting: boolean
  testUploadResult: string | null
  testUploadError: string | null
  sourceInput: string
  outputDir: string
  scanPending: boolean
  blockScanJob: BlockScanJobState | null
  blockScanError: string | null
  scanStatus: string
  scanStatusTone: ScanStatusTone
  activeScanResult: ScanResult | null
  selectedCategoryIds: number[]
  categorySearch: string
  categoryStatus: string
  scopedPostCount: number
  options: ExportOptions
  selectedCount: number
  defaults: ExportBootstrapResponse
  frontmatterValidationErrors: string[]
  linkTemplatePreviewPost: Pick<
    PostSummary,
    "sourceId" | "postId" | "title" | "publishedAt" | "categoryName"
  > | null
  setActiveJobFilter: Dispatch<SetStateAction<JobFilter>>
  setCategorySearch: Dispatch<SetStateAction<string>>
  updateOptions: (updater: (current: ExportOptions) => ExportOptions) => void
  handleBlogInputChange: (value: string) => void
  handleOutputDirChange: (value: string) => void
  handleOutputDirBlur: () => void
  handleSelectAllCategories: () => void
  handleClearAllCategories: () => void
  handleCategoryToggle: (categoryId: number, checked: boolean) => void
  handleUploadProviderSettingsChange: (value: UploadProviderSettingsValue) => void
  handleUploadProviderSettingsReadyChange: (ready: boolean) => void
  handleTestUpload: (value: UploadProviderSettingsValue) => Promise<void> | void
  handleResumeExport: () => Promise<void> | void
  handleRetryBlockScan: () => Promise<void> | void
  handleBackFromBlockScan: () => void
  handleConfirmMarkdownReview: () => Promise<void> | void
}

export const AppStepView = ({
  currentStep,
  job,
  activeJobFilter,
  submitting,
  uploadProviders,
  uploadProviderError,
  uploadProviderStepMessage,
  testUploadSubmitting,
  testUploadResult,
  testUploadError,
  sourceInput,
  outputDir,
  scanPending,
  blockScanJob,
  blockScanError,
  scanStatus,
  scanStatusTone,
  activeScanResult,
  selectedCategoryIds,
  categorySearch,
  categoryStatus,
  scopedPostCount,
  options,
  selectedCount,
  defaults,
  frontmatterValidationErrors,
  linkTemplatePreviewPost,
  setActiveJobFilter,
  setCategorySearch,
  updateOptions,
  handleBlogInputChange,
  handleOutputDirChange,
  handleOutputDirBlur,
  handleSelectAllCategories,
  handleClearAllCategories,
  handleCategoryToggle,
  handleUploadProviderSettingsChange,
  handleUploadProviderSettingsReadyChange,
  handleTestUpload,
  handleResumeExport,
  handleRetryBlockScan,
  handleBackFromBlockScan,
  handleConfirmMarkdownReview,
}: AppStepViewProps) => {
  const blockTemplateDefinitions = defaults.blockTemplateDefinitions ?? []
  const detectedBlockTemplateKeys = activeScanResult?.detectedBlockTemplateKeys
  const visibleBlockTemplateDefinitions = detectedBlockTemplateKeys
    ? blockTemplateDefinitions.filter((definition) =>
        detectedBlockTemplateKeys.includes(definition.key),
      )
    : blockTemplateDefinitions

  if (currentStep === "running" || currentStep === "upload" || currentStep === "result") {
    return (
      <JobResultsPanel
        mode={currentStep}
        job={job}
        activeJobFilter={activeJobFilter}
        resumeSubmitting={submitting}
        onFilterChange={setActiveJobFilter}
        onResumeExport={handleResumeExport}
      />
    )
  }

  if (currentStep === "blog-input") {
    return (
      <BlogInputPanel
        sourceInput={sourceInput}
        outputDir={outputDir}
        scanPending={scanPending}
        scanStatus={scanStatus}
        scanStatusTone={scanStatusTone}
        onSourceIdOrUrlChange={handleBlogInputChange}
        onOutputDirChange={handleOutputDirChange}
        onOutputDirBlur={handleOutputDirBlur}
      />
    )
  }

  if (currentStep === "category-selection") {
    return (
      <CategoryPanel
        scanResult={activeScanResult}
        selectedCategoryIds={selectedCategoryIds}
        categorySearch={categorySearch}
        categoryStatus={categoryStatus}
        categoryMode={options.scope.categoryMode}
        dateFrom={options.scope.dateFrom}
        dateTo={options.scope.dateTo}
        selectedCount={selectedCount}
        selectedPostCount={scopedPostCount}
        totalPostCount={activeScanResult?.totalPostCount ?? 0}
        onCategorySearchChange={setCategorySearch}
        onCategoryModeChange={(value) =>
          updateOptions((current) => ({
            ...current,
            scope: {
              ...current.scope,
              categoryMode: value,
            },
          }))
        }
        onDateFromChange={(value) =>
          updateOptions((current) => ({
            ...current,
            scope: {
              ...current.scope,
              dateFrom: value,
            },
          }))
        }
        onDateToChange={(value) =>
          updateOptions((current) => ({
            ...current,
            scope: {
              ...current.scope,
              dateTo: value,
            },
          }))
        }
        onSelectAll={handleSelectAllCategories}
        onClearAll={handleClearAllCategories}
        onCategoryToggle={handleCategoryToggle}
      />
    )
  }

  if (currentStep === "block-scan") {
    const total = blockScanJob?.total ?? scopedPostCount
    const completed = blockScanJob?.completed ?? 0
    const failed = blockScanJob?.failed ?? 0
    const progressValue = total > 0 ? ((completed + failed) / total) * 100 : 100

    return (
      <div className="grid gap-5 rounded-[var(--radius-lg)] border border-border bg-card p-5 shadow-[var(--panel-shadow-border)]">
        <div className="grid gap-2">
          <div className="flex items-center justify-between gap-4 text-sm">
            <span className="font-medium text-foreground">
              {blockScanError ? "준비 실패" : "준비 중"}
            </span>
            <span className="text-muted-foreground">
              총 {total} / 완료 {completed} / 실패 {failed}
            </span>
          </div>
          <Progress value={progressValue} />
        </div>
        <p className="text-sm text-muted-foreground">
          {blockScanError ?? "선택한 글에서 필요한 Markdown 옵션을 확인 중입니다."}
        </p>
        {blockScanError ? (
          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="secondary" onClick={handleBackFromBlockScan}>
              이전
            </Button>
            <Button type="button" onClick={() => void handleRetryBlockScan()}>
              재시도
            </Button>
          </div>
        ) : null}
      </div>
    )
  }

  if (currentStep === "markdown-review") {
    return (
      <>
        <ExportOptionsPanel
          step="markdown"
          outputDir={outputDir}
          options={options}
          optionDescriptions={defaults.optionDescriptions}
          blockTemplateDefinitions={visibleBlockTemplateDefinitions}
          frontmatterFieldOrder={defaults.frontmatterFieldOrder}
          frontmatterFieldMeta={defaults.frontmatterFieldMeta}
          frontmatterValidationErrors={frontmatterValidationErrors}
          linkTemplatePreviewPost={linkTemplatePreviewPost}
          onOptionsChange={updateOptions}
        />
        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="secondary" onClick={handleBackFromBlockScan}>
            이전
          </Button>
          <Button type="button" onClick={() => void handleConfirmMarkdownReview()}>
            변환 시작
          </Button>
        </div>
      </>
    )
  }

  if (currentStep === "upload-provider-options") {
    return (
      <UploadProviderOptionsStep
        uploadProviders={uploadProviders}
        uploadProviderError={uploadProviderError}
        stepMessage={uploadProviderStepMessage}
        testUploadSubmitting={testUploadSubmitting}
        testUploadResult={testUploadResult}
        testUploadError={testUploadError}
        onChange={handleUploadProviderSettingsChange}
        onReadyChange={handleUploadProviderSettingsReadyChange}
        onTestUpload={handleTestUpload}
      />
    )
  }

  return (
    <ExportOptionsPanel
      step={
        currentStep === "structure-options"
          ? "structure"
          : currentStep === "frontmatter-options"
            ? "frontmatter"
            : currentStep === "assets-options"
              ? "assets"
              : currentStep === "links-options"
                ? "links"
                : "diagnostics"
      }
      outputDir={outputDir}
      options={options}
      optionDescriptions={defaults.optionDescriptions}
      blockTemplateDefinitions={visibleBlockTemplateDefinitions}
      frontmatterFieldOrder={defaults.frontmatterFieldOrder}
      frontmatterFieldMeta={defaults.frontmatterFieldMeta}
      frontmatterValidationErrors={frontmatterValidationErrors}
      linkTemplatePreviewPost={linkTemplatePreviewPost}
      onOptionsChange={updateOptions}
    />
  )
}
