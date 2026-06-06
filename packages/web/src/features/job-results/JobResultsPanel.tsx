import { isUploadActionableJob } from "@exitpress/domain/export-job/ExportJobState.js"
import { useEffect, useRef, useState } from "react"

import type { ExportJobState } from "@exitpress/domain/export-job/schema/ExportJobState.js"
import type {
  UploadProviderCatalogResponse,
  UploadProviderFields,
} from "@exitpress/domain/upload/schema/UploadProvider.js"

import type { JobFilter, JobResultsMode } from "./JobResultsHelpers.js"

import { Card, CardContent } from "../../components/ui/Card.js"
import { toast } from "../../components/ui/Sonner.js"
import { TooltipProvider } from "../../components/ui/Tooltip.js"
import { postSameOriginJson, postSameOriginJsonNoContent } from "../../lib/Api.js"

import { JobLogsPanel } from "./JobLogsPanel.js"
import { JobResultsTable } from "./JobResultsTable.js"
import { ExportSummarySection, RunningProgressSection } from "./ProgressSections.js"
import { UploadPanel } from "./UploadPanel.js"

export const JobResultsPanel = ({
  mode,
  job,
  activeJobFilter,
  resumeSubmitting,
  uploadSubmitting,
  uploadProviders,
  uploadProviderError,
  onFilterChange,
  onResumeExport,
  onUploadStart,
}: {
  mode: JobResultsMode
  job: ExportJobState | null
  activeJobFilter: JobFilter
  resumeSubmitting: boolean
  uploadSubmitting: boolean
  uploadProviders: UploadProviderCatalogResponse
  uploadProviderError: string | null
  onFilterChange: (filter: JobFilter) => void
  onResumeExport: () => Promise<void> | void
  onUploadStart: (input: {
    providerKey: string
    providerFields: UploadProviderFields
  }) => Promise<void> | void
}) => {
  const logsScrollAreaRef = useRef<HTMLDivElement | null>(null)
  const [previewPendingIds, setPreviewPendingIds] = useState<string[]>([])
  const showUploadPanel =
    (mode === "upload" || mode === "result") && (job?.upload.candidateCount ?? 0) > 0
  const showUploadForm = mode === "upload" && isUploadActionableJob(job)
  const showExportSummary = mode === "upload" || mode === "result"
  const showExportResults = mode === "running" || mode === "upload" || mode === "result"
  const latestLogSignature = (() => {
    const lastEntry = job?.logs.at(-1)

    if (!lastEntry) {
      return "empty"
    }

    return `${job?.logs.length ?? 0}:${lastEntry.timestamp}:${lastEntry.message}`
  })()

  const handleOpenLocalFile = async ({
    outputPath,
    title,
  }: {
    outputPath: string
    title: string
  }) => {
    try {
      await postSameOriginJsonNoContent("/api/local-file/open", {
        outputDir: job?.request.outputDir ?? "",
        outputPath,
      })
    } catch (error) {
      toast.error("파일을 열지 못했습니다.", {
        description: `${title}: ${error instanceof Error ? error.message : String(error)}`,
      })
    }
  }

  const handleOpenPreviewLink = async ({
    itemId,
    outputPath,
    title,
  }: {
    itemId: string
    outputPath: string
    title: string
  }) => {
    setPreviewPendingIds((current) => (current.includes(itemId) ? current : [...current, itemId]))

    try {
      const response = await postSameOriginJson<{
        previewUrl: string
      }>("/api/local-file/preview-link", {
        outputDir: job?.request.outputDir ?? "",
        outputPath,
      })

      window.open(response.previewUrl, "_blank", "noopener,noreferrer")
    } catch (error) {
      toast.error("미리보기를 열지 못했습니다.", {
        description: `${title}: ${error instanceof Error ? error.message : String(error)}`,
      })
    } finally {
      setPreviewPendingIds((current) => current.filter((currentId) => currentId !== itemId))
    }
  }

  const handleOpenSourceLink = ({ source }: { source: string }) => {
    window.open(source, "_blank", "noopener,noreferrer")
  }

  useEffect(() => {
    const viewport = logsScrollAreaRef.current?.querySelector<HTMLElement>(
      '[data-slot="scroll-area-viewport"]',
    )

    if (!viewport) {
      return
    }

    viewport.scrollTop = viewport.scrollHeight
  }, [latestLogSignature])

  return (
    <TooltipProvider>
      <Card variant="panel" className="board-card overflow-hidden" id="status-panel">
        <CardContent className="status-layout grid gap-5 p-6">
          {mode === "running" ? (
            <RunningProgressSection
              job={job}
              resumeSubmitting={resumeSubmitting}
              onResumeExport={onResumeExport}
            />
          ) : null}

          {showUploadPanel ? (
            <UploadPanel
              mode={mode}
              job={job}
              showUploadForm={showUploadForm}
              uploadSubmitting={uploadSubmitting}
              uploadProviders={uploadProviders}
              uploadProviderError={uploadProviderError}
              onUploadStart={onUploadStart}
            />
          ) : null}

          {showExportSummary ? <ExportSummarySection job={job} /> : null}

          {showExportResults ? (
            <JobResultsTable
              mode={mode}
              job={job}
              activeJobFilter={activeJobFilter}
              previewPendingIds={previewPendingIds}
              onFilterChange={onFilterChange}
              onOpenLocalFile={(input) => {
                void handleOpenLocalFile(input)
              }}
              onOpenPreviewLink={(input) => {
                void handleOpenPreviewLink(input)
              }}
              onOpenSourceLink={handleOpenSourceLink}
            />
          ) : null}

          <JobLogsPanel job={job} logsScrollAreaRef={logsScrollAreaRef} />
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}
