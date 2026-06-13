import {
  FileCodeIcon,
  FileDirectoryOpenFillIcon,
  KebabHorizontalIcon,
  LinkExternalIcon,
} from "@primer/octicons-react"
import { ActionList, ActionMenu, Box, Button, Label, Text, Tooltip } from "@primer/react"

import type { ExportJobState } from "@exitpress/domain/export-job/schema/ExportJobState.js"

import type { JobFilter, JobResultsMode, UploadRowStatus } from "./JobResultsHelpers.js"

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

const uploadRowLabelVariant = (status: UploadRowStatus) => {
  if (status === "complete") {
    return "success"
  }

  if (status === "failed") {
    return "danger"
  }

  if (status === "partial") {
    return "attention"
  }

  return "secondary"
}

type JobItem = ReturnType<typeof getJobItems>[number]

const JobItemActionMenu = ({
  item,
  previewPending,
  canOpenPreview,
  onOpenLocalFile,
  onOpenPreviewLink,
  onOpenSourceLink,
}: {
  item: JobItem
  previewPending: boolean
  canOpenPreview: boolean
  onOpenLocalFile: (input: { outputPath: string; title: string }) => void
  onOpenPreviewLink: (input: { itemId: string; outputPath: string; title: string }) => void
  onOpenSourceLink: (input: { source: string }) => void
}) => {
  const openPreviewLabel = previewPending
    ? "미리보기 링크 생성 중"
    : canOpenPreview
      ? "마크다운 미리보기"
      : "미리보기 없음"

  return (
    <ActionMenu>
      <ActionMenu.Button
        aria-label={`${item.title} 작업 메뉴`}
        size="small"
        variant="invisible"
        icon={KebabHorizontalIcon}
      />
      <ActionMenu.Overlay align="end">
        <ActionList>
          <ActionList.Item
            data-job-item-source-link
            onSelect={() => {
              onOpenSourceLink({
                source: item.source,
              })
            }}
          >
            <ActionList.LeadingVisual>
              <LinkExternalIcon />
            </ActionList.LeadingVisual>
            네이버 원문 보기
          </ActionList.Item>
          <ActionList.Item
            data-job-item-preview-link
            disabled={!canOpenPreview || previewPending}
            onSelect={(event) => {
              if (!item.outputPath) {
                event.preventDefault()
                return
              }

              onOpenPreviewLink({
                itemId: item.id,
                outputPath: item.outputPath,
                title: item.title,
              })
            }}
          >
            <ActionList.LeadingVisual>
              <FileCodeIcon />
            </ActionList.LeadingVisual>
            {openPreviewLabel}
          </ActionList.Item>
          <ActionList.Item
            disabled={!item.outputPath}
            onSelect={(event) => {
              if (!item.outputPath) {
                event.preventDefault()
                return
              }

              onOpenLocalFile({
                outputPath: item.outputPath,
                title: item.title,
              })
            }}
          >
            <ActionList.LeadingVisual>
              <FileDirectoryOpenFillIcon />
            </ActionList.LeadingVisual>
            로컬 파일 열기
          </ActionList.Item>
        </ActionList>
      </ActionMenu.Overlay>
    </ActionMenu>
  )
}

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

const filterLabel = (filter: JobFilter) =>
  filter === "all" ? "전체" : filter === "success" ? "성공" : "실패"

const tableColumnCount = (showUploadColumns: boolean) => (showUploadColumns ? 6 : 4)

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
    <Box
      as="section"
      sx={{
        display: "grid",
        gap: 3,
        border: "1px solid",
        borderColor: "border.default",
        borderRadius: 2,
        p: 3,
      }}
    >
      <Box
        role="tablist"
        aria-label="완료 리스트 필터"
        sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 2 }}
      >
        {(["all", "success", "failed"] as const).map((filter) => (
          <Button
            key={filter}
            type="button"
            variant={activeJobFilter === filter ? "default" : "invisible"}
            data-job-filter={filter}
            count={jobFilterCounts[filter]}
            aria-selected={activeJobFilter === filter}
            onClick={() => onFilterChange(filter)}
          >
            {filterLabel(filter)}
          </Button>
        ))}
      </Box>

      {jobItems.length === 0 ? (
        <Box
          id="job-file-tree"
          sx={{
            display: "grid",
            minHeight: "7rem",
            placeItems: "center",
            border: "1px dashed",
            borderColor: "border.default",
            borderRadius: 2,
            px: 3,
            py: 4,
            color: "fg.muted",
            fontSize: 1,
            textAlign: "center",
          }}
        >
          {activeJobFilter === "all"
            ? mode === "running"
              ? "완료된 결과가 아직 없습니다."
              : "완료된 결과가 여기에 표시됩니다."
            : "현재 필터에 맞는 결과가 없습니다."}
        </Box>
      ) : (
        <Box
          id="job-file-tree"
          sx={{
            maxHeight: "min(32rem, 62vh)",
            overflow: "auto",
            border: "1px solid",
            borderColor: "border.default",
            borderRadius: 2,
          }}
        >
          <Box
            as="table"
            sx={{
              width: "100%",
              minWidth: showUploadColumns ? "50rem" : "42rem",
              borderCollapse: "collapse",
              tableLayout: "fixed",
              fontSize: [0, 1],
            }}
          >
            <Box
              as="thead"
              sx={{
                position: "sticky",
                top: 0,
                zIndex: 1,
                bg: "canvas.subtle",
              }}
            >
              <Box as="tr" sx={{ borderBottom: "1px solid", borderColor: "border.default" }}>
                <Box as="th" sx={{ width: ["7.5rem", "8.5rem"], px: 3, py: 2, textAlign: "left" }}>
                  카테고리
                </Box>
                <Box as="th" sx={{ px: 3, py: 2, textAlign: "left" }}>
                  파일
                </Box>
                {showUploadColumns ? (
                  <Box as="th" sx={{ width: ["7rem", "8rem"], px: 3, py: 2, textAlign: "center" }}>
                    업로드
                  </Box>
                ) : null}
                {showUploadColumns ? (
                  <Box as="th" sx={{ width: ["7rem", "8rem"], px: 3, py: 2, textAlign: "center" }}>
                    업로드 상태
                  </Box>
                ) : null}
                <Box
                  as="th"
                  sx={{ width: ["6.5rem", "7.5rem"], px: 3, py: 2, textAlign: "center" }}
                >
                  상태
                </Box>
                <Box
                  as="th"
                  sx={{ width: ["3.25rem", "3.5rem"], px: 2, py: 2, textAlign: "center" }}
                >
                  작업
                </Box>
              </Box>
            </Box>
            <Box as="tbody">
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
                    : undefined
                const uploadedLinks =
                  showUploadColumns && hasUploadCandidate ? buildUploadedLinkMeta(item) : []

                return (
                  <Box
                    key={item.id}
                    as="tr"
                    data-upload-row-id={
                      showUploadColumns && hasUploadCandidate ? item.id : undefined
                    }
                    data-upload-row-status={uploadRowStatus?.key}
                    data-severity={severity}
                    sx={{
                      bg: severity === "error" ? "danger.subtle" : "canvas.default",
                      borderBottom: "1px solid",
                      borderColor: "border.muted",
                      "&:last-child": { borderBottom: 0 },
                    }}
                  >
                    <Box as="td" sx={{ px: 3, py: 3, verticalAlign: "top" }}>
                      <Label
                        title={item.category.path.join(" / ")}
                        variant="secondary"
                        sx={{
                          maxWidth: "100%",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {item.category.name}
                      </Label>
                    </Box>
                    <Box as="td" sx={{ minWidth: 0, px: 3, py: 3, verticalAlign: "top" }}>
                      <Box
                        data-job-item-id={item.id}
                        data-severity={severity}
                        sx={{ display: "grid", minWidth: 0, gap: 1 }}
                      >
                        {localOutputPath ? (
                          <Tooltip text={localOutputPath} direction="n">
                            <Box
                              as="button"
                              type="button"
                              sx={{
                                width: "fit-content",
                                maxWidth: "100%",
                                m: 0,
                                p: 0,
                                border: 0,
                                bg: "transparent",
                                color: "fg.default",
                                font: "inherit",
                                textAlign: "left",
                                cursor: "help",
                              }}
                            >
                              <Box
                                as="strong"
                                sx={{
                                  display: "block",
                                  overflowWrap: "anywhere",
                                  fontSize: [0, 1],
                                  fontWeight: 600,
                                  lineHeight: "20px",
                                }}
                              >
                                {pathMeta.fileLabel}
                              </Box>
                            </Box>
                          </Tooltip>
                        ) : (
                          <Box
                            as="strong"
                            sx={{
                              overflowWrap: "anywhere",
                              fontSize: [0, 1],
                              fontWeight: 600,
                              lineHeight: "20px",
                            }}
                          >
                            {pathMeta.fileLabel}
                          </Box>
                        )}
                        <Text
                          sx={{
                            color: "fg.muted",
                            fontSize: 0,
                            lineHeight: "18px",
                            overflowWrap: "anywhere",
                          }}
                        >
                          {item.title}
                        </Text>
                      </Box>
                    </Box>
                    {showUploadColumns ? (
                      <Box
                        as="td"
                        sx={{ px: 3, py: 3, textAlign: "center", verticalAlign: "middle" }}
                      >
                        {hasUploadCandidate ? (
                          <Box sx={{ display: "grid", justifyItems: "center", gap: 1 }}>
                            <Text>
                              {item.upload.uploadedCount} / {item.upload.candidateCount}
                            </Text>
                            {uploadedLinks.length > 0 ? (
                              <Box
                                sx={{
                                  display: "flex",
                                  flexWrap: "wrap",
                                  justifyContent: "center",
                                  gap: 2,
                                }}
                              >
                                {uploadedLinks.map((link) => (
                                  <Box
                                    key={`${item.id}:${link.label}`}
                                    as="a"
                                    href={link.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    sx={{
                                      color: "accent.fg",
                                      fontSize: 0,
                                      fontWeight: 600,
                                      textDecoration: "underline",
                                      textUnderlineOffset: "2px",
                                    }}
                                  >
                                    {link.label}
                                  </Box>
                                ))}
                              </Box>
                            ) : null}
                          </Box>
                        ) : (
                          <Text sx={{ color: "fg.subtle" }}>-</Text>
                        )}
                      </Box>
                    ) : null}
                    {showUploadColumns ? (
                      <Box
                        as="td"
                        sx={{ px: 3, py: 3, textAlign: "center", verticalAlign: "middle" }}
                      >
                        {uploadRowStatus ? (
                          <Label
                            variant={uploadRowLabelVariant(uploadRowStatus.key)}
                            data-upload-row-status-badge={uploadRowStatus.key}
                          >
                            {uploadRowStatus.label}
                          </Label>
                        ) : (
                          <Text sx={{ color: "fg.subtle" }}>-</Text>
                        )}
                      </Box>
                    ) : null}
                    <Box
                      as="td"
                      sx={{ px: 3, py: 3, textAlign: "center", verticalAlign: "middle" }}
                    >
                      <Label variant={severity === "success" ? "success" : "danger"}>
                        {meta.label}
                      </Label>
                    </Box>
                    <Box
                      as="td"
                      sx={{ px: 2, py: 3, textAlign: "center", verticalAlign: "middle" }}
                    >
                      <JobItemActionMenu
                        item={item}
                        previewPending={previewPending}
                        canOpenPreview={canOpenPreview}
                        onOpenLocalFile={onOpenLocalFile}
                        onOpenPreviewLink={onOpenPreviewLink}
                        onOpenSourceLink={onOpenSourceLink}
                      />
                    </Box>
                  </Box>
                )
              })}
              {jobItems.length > 0 ? (
                <Box as="tr" sx={{ display: "none" }}>
                  <Box as="td" colSpan={tableColumnCount(showUploadColumns)} />
                </Box>
              ) : null}
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  )
}
