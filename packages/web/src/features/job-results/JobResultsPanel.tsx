import { useEffect, useRef, useState } from "react"

import type { ExportJobState } from "@exitpress/domain/export-job/schema/ExportJobState.js"

import type { JobFilter, JobResultsMode } from "./JobResultsHelpers.js"

import { PrimerPanel, PrimerPanelBody } from "../../components/primer/PrimerPage.js"
import { toast } from "../../components/primer/PrimerToast.js"
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
  onFilterChange,
  onResumeExport,
}: {
  mode: JobResultsMode
  job: ExportJobState | null
  activeJobFilter: JobFilter
  resumeSubmitting: boolean
  onFilterChange: (filter: JobFilter) => void
  onResumeExport: () => Promise<void> | void
}) => {
  const logsScrollAreaRef = useRef<HTMLDivElement | null>(null)
  const [previewPendingIds, setPreviewPendingIds] = useState<string[]>([])
  const showUploadPanel =
    (mode === "upload" || mode === "result") && (job?.upload.candidateCount ?? 0) > 0
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
    if (!logsScrollAreaRef.current) {
      return
    }

    logsScrollAreaRef.current.scrollTop = logsScrollAreaRef.current.scrollHeight
  }, [latestLogSignature])

  return (
    <PrimerPanel>
      <div id="status-panel">
        <PrimerPanelBody>
          {mode === "running" ? (
            <RunningProgressSection
              job={job}
              resumeSubmitting={resumeSubmitting}
              onResumeExport={onResumeExport}
            />
          ) : null}

          {showUploadPanel ? <UploadPanel mode={mode} job={job} /> : null}

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
        </PrimerPanelBody>
      </div>
    </PrimerPanel>
  )
}
