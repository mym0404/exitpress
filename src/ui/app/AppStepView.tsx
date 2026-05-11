import type { Dispatch, SetStateAction } from "react"
import type { PostSummary, ScanResult } from "../../domain/blog/Types.js"
import type { ExportJobState } from "../../domain/export-job/Types.js"
import type { ExportOptions } from "../../domain/export-options/Types.js"
import type {
  UploadProviderCatalogResponse,
  UploadProviderFields,
} from "../../domain/upload/UploadProviderTypes.js"
import type { WizardStep } from "../features/common/shell/WizardFlow.js"
import type { ExportBootstrapResponse } from "../lib/Api.js"
import { JobResultsPanel } from "../features/job-results/JobResultsPanel.js"
import { ExportOptionsPanel } from "../features/options/ExportOptionsPanel.js"
import { BlogInputPanel } from "../features/scan/BlogInputPanel.js"
import { CategoryPanel } from "../features/scan/CategoryPanel.js"

type AppStepViewProps = {
  currentStep: WizardStep
  job: ExportJobState | null
  activeJobFilter: "all" | "success" | "failed"
  submitting: boolean
  uploadSubmitting: boolean
  uploadProviders: UploadProviderCatalogResponse
  uploadProviderError: string | null
  blogIdOrUrl: string
  outputDir: string
  scanPending: boolean
  scanStatus: string
  scanStatusTone: "default" | "error"
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
    "blogId" | "logNo" | "title" | "publishedAt" | "categoryName"
  > | null
  setActiveJobFilter: Dispatch<SetStateAction<"all" | "success" | "failed">>
  setCategorySearch: Dispatch<SetStateAction<string>>
  updateOptions: (updater: (current: ExportOptions) => ExportOptions) => void
  handleBlogInputChange: (value: string) => void
  handleOutputDirChange: (value: string) => void
  handleOutputDirBlur: () => void
  handleSelectAllCategories: () => void
  handleClearAllCategories: () => void
  handleCategoryToggle: (categoryId: number, checked: boolean) => void
  handleResumeExport: () => Promise<void> | void
  handleUpload: (input: {
    providerKey: string
    providerFields: UploadProviderFields
  }) => Promise<void> | void
}

export const AppStepView = ({
  currentStep,
  job,
  activeJobFilter,
  submitting,
  uploadSubmitting,
  uploadProviders,
  uploadProviderError,
  blogIdOrUrl,
  outputDir,
  scanPending,
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
  handleResumeExport,
  handleUpload,
}: AppStepViewProps) => {
  if (currentStep === "running" || currentStep === "upload" || currentStep === "result") {
    return (
      <JobResultsPanel
        mode={currentStep}
        job={job}
        activeJobFilter={activeJobFilter}
        resumeSubmitting={submitting}
        uploadSubmitting={uploadSubmitting}
        uploadProviders={uploadProviders}
        uploadProviderError={uploadProviderError}
        onFilterChange={setActiveJobFilter}
        onResumeExport={handleResumeExport}
        onUploadStart={handleUpload}
      />
    )
  }

  if (currentStep === "blog-input") {
    return (
      <BlogInputPanel
        blogIdOrUrl={blogIdOrUrl}
        outputDir={outputDir}
        scanPending={scanPending}
        scanStatus={scanStatus}
        scanStatusTone={scanStatusTone}
        onBlogIdOrUrlChange={handleBlogInputChange}
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

  return (
    <ExportOptionsPanel
      step={
        currentStep === "structure-options"
          ? "structure"
          : currentStep === "frontmatter-options"
            ? "frontmatter"
            : currentStep === "markdown-options"
              ? "markdown"
              : currentStep === "assets-options"
                ? "assets"
                : currentStep === "links-options"
                  ? "links"
                  : "diagnostics"
      }
      outputDir={outputDir}
      options={options}
      optionDescriptions={defaults.optionDescriptions}
      blockOutputDefinitions={defaults.blockOutputDefinitions ?? []}
      frontmatterFieldOrder={defaults.frontmatterFieldOrder}
      frontmatterFieldMeta={defaults.frontmatterFieldMeta}
      frontmatterValidationErrors={frontmatterValidationErrors}
      linkTemplatePreviewPost={linkTemplatePreviewPost}
      onOptionsChange={updateOptions}
    />
  )
}
