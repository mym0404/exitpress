import { Box, Button, Dialog, Flash, Text } from "@primer/react"

import type { ComponentProps } from "react"

import type { ResumeDialogState } from "./ResumeState.js"

const ResumeDialogHeader = ({
  dialogDescriptionId,
  dialogLabelId,
  subtitle,
  title,
}: ComponentProps<typeof Dialog> & {
  dialogDescriptionId?: string
  dialogLabelId?: string
}) => (
  <Dialog.Header>
    <Box sx={{ display: "grid", gap: 1, px: 2, py: "6px" }}>
      <Dialog.Title id={dialogLabelId}>{title}</Dialog.Title>
      {subtitle ? <Dialog.Subtitle id={dialogDescriptionId}>{subtitle}</Dialog.Subtitle> : null}
    </Box>
  </Dialog.Header>
)

export const ResumeDialogPanel = ({
  resumeDialog,
  resettingResume,
  restoringResume,
  onReset,
  onRestore,
}: {
  resumeDialog: ResumeDialogState | null
  resettingResume: boolean
  restoringResume: boolean
  onReset: () => void
  onRestore: () => void
}) =>
  resumeDialog ? (
    <Dialog
      title={
        resumeDialog.source === "before-scan"
          ? "진행 중인 작업이 있습니다."
          : "이전 작업을 다시 불러왔습니다."
      }
      subtitle={
        resumeDialog.source === "before-scan"
          ? "이 경로에 불러올 작업 상태가 남아 있습니다."
          : "출력 상태를 읽어 마지막 작업 화면을 복구했습니다."
      }
      role="alertdialog"
      width="large"
      renderHeader={ResumeDialogHeader}
      onClose={() => null}
    >
      <Box sx={{ display: "grid", gap: 3 }}>
        <Box
          sx={{
            display: "grid",
            gap: 2,
            border: "1px solid",
            borderColor: "border.default",
            borderRadius: 2,
            bg: "canvas.subtle",
            p: 3,
            color: "fg.default",
            fontSize: 1,
          }}
        >
          <Text>
            <Text sx={{ fontWeight: 600 }}>상태</Text> {resumeDialog.resumeSummary.status}
          </Text>
          <Text>
            <Text sx={{ fontWeight: 600 }}>출력 경로</Text> {resumeDialog.resumeSummary.outputDir}
          </Text>
          <Text>
            <Text sx={{ fontWeight: 600 }}>진행</Text> 총 {resumeDialog.resumeSummary.totalPosts} /
            완료 {resumeDialog.resumeSummary.completedCount} / 실패{" "}
            {resumeDialog.resumeSummary.failedCount}
          </Text>
          <Text>
            <Text sx={{ fontWeight: 600 }}>업로드</Text> {resumeDialog.resumeSummary.uploadedCount}{" "}
            / {resumeDialog.resumeSummary.uploadCandidateCount}
          </Text>
        </Box>
        <Flash variant="danger">
          <Text sx={{ display: "block", fontWeight: 600 }}>초기화 주의</Text>
          <Text>
            작업을 초기화하면 {resumeDialog.resumeSummary.outputDir} 경로의 작업 내역과 출력 파일을
            함께 삭제합니다.
          </Text>
        </Flash>
        <Box
          sx={{
            display: "flex",
            flexDirection: ["column", "row"],
            justifyContent: "flex-end",
            gap: 2,
          }}
        >
          <Button variant="danger" onClick={onReset} disabled={resettingResume}>
            {resettingResume ? "초기화 중" : "작업 초기화"}
          </Button>
          <Button
            variant="primary"
            onClick={onRestore}
            disabled={restoringResume || resettingResume}
          >
            {restoringResume ? "불러오는 중" : "불러오기"}
          </Button>
        </Box>
      </Box>
    </Dialog>
  ) : null
