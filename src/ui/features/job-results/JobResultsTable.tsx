import { RiExternalLinkLine, RiFileTextLine, RiFolderOpenLine } from "@remixicon/react"

import type { ExportJobState } from "../../../domain/export-job/Types.js"

import type { JobFilter, JobResultsMode } from "./JobResultsHelpers.js"

import { Badge } from "../../components/ui/Badge.js"
import { Button, buttonVariants } from "../../components/ui/Button.js"
import { ScrollArea } from "../../components/ui/ScrollArea.js"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/Table.js"
import { Tooltip, TooltipContent, TooltipTrigger } from "../../components/ui/Tooltip.js"
import { cn } from "../../lib/Cn.js"

import {
  buildJobItemPathMeta,
  buildJobItemSeverity,
  buildLocalOutputPath,
  buildUploadedLinkMeta,
  buildUploadRowStatus,
  getJobItems,
  severityMeta,
  shouldShowUploadColumns,
} from "./JobResultsHelpers.js"

const uploadRowBadgeClass = (status: "pending" | "partial" | "complete" | "failed") =>
  cn(
    "rounded-full border px-2.5 py-0.5",
    status === "pending"
      ? "upload-badge--pending"
      : status === "partial"
        ? "upload-badge--partial"
        : status === "complete"
          ? "upload-badge--complete"
          : "upload-badge--failed",
  )

const jobActionButtonClassName = cn(
  buttonVariants({
    variant: "ghost",
    size: "icon",
  }),
  "size-8 rounded-full text-muted-foreground",
)

const getJobFilterCounts = (job: ExportJobState | null) =>
  getJobItems(job).reduce(
    (counts, item) => {
      const severity = buildJobItemSeverity(item)

      counts.all += 1

      if (severity === "success") {
        counts.success += 1
      }

      if (severity === "error") {
        counts.failed += 1
      }

      return counts
    },
    {
      all: 0,
      success: 0,
      failed: 0,
    } satisfies Record<JobFilter, number>,
  )

export const JobResultsTable = ({
  mode,
  job,
  activeJobFilter,
  previewPendingIds,
  onFilterChange,
  onOpenLocalFile,
  onOpenPreviewLink,
  onOpenSourceLink,
}: {
  mode: JobResultsMode
  job: ExportJobState | null
  activeJobFilter: JobFilter
  previewPendingIds: string[]
  onFilterChange: (filter: JobFilter) => void
  onOpenLocalFile: (input: { outputPath: string; title: string }) => void
  onOpenPreviewLink: (input: { itemId: string; outputPath: string; title: string }) => void
  onOpenSourceLink: (input: { source: string }) => void
}) => {
  const allJobItems = getJobItems(job)
  const jobFilterCounts = getJobFilterCounts(job)
  const jobItems = allJobItems.filter((item) => {
    const severity = buildJobItemSeverity(item)

    if (activeJobFilter === "success") {
      return severity === "success"
    }

    if (activeJobFilter === "failed") {
      return severity === "error"
    }

    return true
  })
  const showUploadColumns = shouldShowUploadColumns(job)

  return (
    <section className="job-results-panel subtle-panel grid gap-4 rounded-[1.5rem] p-4">
      <div className="job-results-header grid gap-4 lg:flex lg:items-start lg:justify-between">
        <div
          className="job-filter-group flex flex-wrap items-center gap-2"
          role="tablist"
          aria-label="완료 리스트 필터"
        >
          {(["all", "success", "failed"] as const).map((filter) => (
            <Button
              key={filter}
              type="button"
              variant={activeJobFilter === filter ? "outline" : "ghost"}
              className={`job-filter-button min-w-16 rounded-full px-4 ${activeJobFilter === filter ? "is-active" : ""}`}
              data-job-filter={filter}
              onClick={() => onFilterChange(filter)}
            >
              {filter === "all" ? "전체" : filter === "success" ? "성공" : "실패"}{" "}
              {jobFilterCounts[filter]}
            </Button>
          ))}
        </div>
      </div>

      {jobItems.length === 0 ? (
        <div
          id="job-file-tree"
          className="job-file-tree empty-state-surface grid min-h-28 place-items-center rounded-2xl px-4 py-6 text-center text-sm"
        >
          {activeJobFilter === "all"
            ? mode === "running"
              ? "완료된 결과가 아직 없습니다."
              : "완료된 결과가 여기에 표시됩니다."
            : "현재 필터에 맞는 결과가 없습니다."}
        </div>
      ) : (
        <ScrollArea
          id="job-file-tree"
          className="job-file-tree job-file-tree-scroll section-card max-h-[min(32rem,62vh)] overflow-hidden rounded-[1.5rem]"
        >
          <Table
            className={cn(
              "w-full text-[11px] sm:text-xs",
              showUploadColumns ? "min-w-[50rem] table-fixed" : "table-fixed",
            )}
          >
            <TableHeader className="sticky top-0 z-10">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[7.5rem] text-[10px] sm:w-[8.5rem] sm:text-[11px]">
                  카테고리
                </TableHead>
                <TableHead className="text-[10px] sm:text-[11px]">파일</TableHead>
                {showUploadColumns ? (
                  <TableHead className="w-[7rem] text-center text-[10px] sm:w-[8rem] sm:text-[11px]">
                    업로드
                  </TableHead>
                ) : null}
                {showUploadColumns ? (
                  <TableHead className="w-[7rem] text-center text-[10px] sm:w-[8rem] sm:text-[11px]">
                    업로드 상태
                  </TableHead>
                ) : null}
                <TableHead className="w-[6.5rem] text-center text-[10px] sm:w-[7.5rem] sm:text-[11px]">
                  상태
                </TableHead>
                <TableHead className="w-[6.5rem] text-center text-[10px] sm:w-[7.5rem] sm:text-[11px]">
                  액션
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobItems.map((item) => {
                const severity = buildJobItemSeverity(item)
                const pathMeta = buildJobItemPathMeta(item)
                const meta = severityMeta[severity]
                const localOutputPath = buildLocalOutputPath({
                  outputDir: job?.request.outputDir ?? "",
                  outputPath: item.outputPath,
                })
                const previewPending = previewPendingIds.includes(item.id)
                const canOpenPreview = Boolean(item.outputPath)
                const hasUploadCandidate = item.upload.candidateCount > 0
                const uploadRowStatus =
                  showUploadColumns && hasUploadCandidate
                    ? buildUploadRowStatus({
                        jobStatus: job?.status,
                        item,
                      })
                    : null
                const uploadedLinks =
                  showUploadColumns && hasUploadCandidate ? buildUploadedLinkMeta(item) : []

                return (
                  <TableRow
                    key={item.id}
                    className={cn(
                      "last:border-b-0",
                      severity === "error" ? "bg-[var(--status-error-bg)]" : "",
                    )}
                    data-upload-row-id={
                      showUploadColumns && hasUploadCandidate ? item.id : undefined
                    }
                    data-upload-row-status={uploadRowStatus?.key}
                    data-severity={severity}
                  >
                    <TableCell className="align-top">
                      <div className="flex min-h-[3.5rem] items-start">
                        <Badge
                          variant="outline"
                          className="max-w-full rounded-full px-2.5 py-1 text-[10px] font-medium normal-case sm:text-[11px]"
                          title={item.category.path.join(" / ")}
                        >
                          <span className="truncate">{item.category.name}</span>
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="min-w-0 align-top">
                      <div
                        className="job-results-row grid min-h-0 w-full min-w-0 whitespace-normal rounded-xl px-1.5 py-1 text-left"
                        data-job-item-id={item.id}
                        data-severity={severity}
                      >
                        <span className="grid min-w-0 gap-1">
                          {localOutputPath ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  type="button"
                                  className="w-fit max-w-full cursor-help border-0 bg-transparent p-0 text-left outline-none"
                                >
                                  <strong className="break-words text-[11px] font-semibold leading-[1.45] text-foreground sm:text-[13px]">
                                    {pathMeta.fileLabel}
                                  </strong>
                                </button>
                              </TooltipTrigger>
                              <TooltipContent align="start" side="top" sideOffset={8}>
                                <span className="font-mono">{localOutputPath}</span>
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <strong className="break-words text-[11px] font-semibold leading-[1.45] text-foreground sm:text-[13px]">
                              {pathMeta.fileLabel}
                            </strong>
                          )}
                          <span className="whitespace-normal break-words text-[10px] leading-[1.45] text-muted-foreground sm:text-[11px]">
                            {item.title}
                          </span>
                        </span>
                      </div>
                    </TableCell>
                    {showUploadColumns ? (
                      <TableCell className="align-middle text-center text-[11px] text-foreground sm:text-xs">
                        {hasUploadCandidate ? (
                          <div className="grid justify-items-center gap-1">
                            <span>
                              {item.upload.uploadedCount} / {item.upload.candidateCount}
                            </span>
                            {uploadedLinks.length > 0 ? (
                              <div className="flex flex-wrap justify-center gap-1.5 text-[10px] sm:text-xs">
                                {uploadedLinks.map((link) => (
                                  <a
                                    key={`${item.id}:${link.label}`}
                                    href={link.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="font-medium text-[var(--status-running-fg)] underline underline-offset-2"
                                  >
                                    {link.label}
                                  </a>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        ) : (
                          <span className="text-muted-foreground/70">-</span>
                        )}
                      </TableCell>
                    ) : null}
                    {showUploadColumns ? (
                      <TableCell className="align-middle text-center">
                        {uploadRowStatus ? (
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] sm:text-[11px]",
                              uploadRowBadgeClass(uploadRowStatus.key),
                            )}
                            data-upload-row-status-badge={uploadRowStatus.key}
                          >
                            {uploadRowStatus.label}
                          </Badge>
                        ) : (
                          <span className="text-sm text-muted-foreground/70">-</span>
                        )}
                      </TableCell>
                    ) : null}
                    <TableCell className="align-middle text-center">
                      <Badge
                        className="min-w-14 justify-center rounded-full px-2 py-0.5 text-[10px] sm:min-w-16 sm:px-2.5 sm:text-[11px]"
                        variant={severity === "success" ? "secondary" : meta.badge}
                      >
                        {meta.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="align-middle text-center">
                      <div className="inline-flex items-center rounded-full border border-border bg-card p-1 shadow-[var(--panel-shadow-border)]">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className={jobActionButtonClassName}
                              aria-label={`${item.title} 네이버 원문 보기`}
                              data-job-item-source-link
                              onClick={() => {
                                onOpenSourceLink({
                                  source: item.source,
                                })
                              }}
                            >
                              <RiExternalLinkLine data-icon="inline-start" aria-hidden="true" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="top" sideOffset={8}>
                            네이버 원문 보기
                          </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className={jobActionButtonClassName}
                              aria-label={`${item.title} 마크다운 미리보기`}
                              data-job-item-preview-link
                              disabled={!canOpenPreview || previewPending}
                              onClick={() => {
                                if (!item.outputPath) {
                                  return
                                }

                                onOpenPreviewLink({
                                  itemId: item.id,
                                  outputPath: item.outputPath,
                                  title: item.title,
                                })
                              }}
                            >
                              <RiFileTextLine data-icon="inline-start" aria-hidden="true" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="top" sideOffset={8}>
                            {previewPending
                              ? "미리보기 링크 생성 중"
                              : canOpenPreview
                                ? "마크다운 미리보기"
                                : "미리보기 없음"}
                          </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className={jobActionButtonClassName}
                              aria-label={`${item.title} 파일 열기`}
                              disabled={!item.outputPath}
                              onClick={() => {
                                if (!item.outputPath) {
                                  return
                                }

                                onOpenLocalFile({
                                  outputPath: item.outputPath,
                                  title: item.title,
                                })
                              }}
                            >
                              <RiFolderOpenLine data-icon="inline-start" aria-hidden="true" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="top" sideOffset={8}>
                            {item.outputPath ? "로컬 파일 열기" : "열 파일 없음"}
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </ScrollArea>
      )}
    </section>
  )
}
