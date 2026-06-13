import { Box, Button } from "@primer/react"

import type { ReactElement } from "react"

export const WizardDock = ({
  isSetupStep,
  setupStep,
  setupStepIndex,
  currentScanTarget,
  scanPending,
  exportDisabled,
  nextDisabled,
  submitting,
  nextButtonLabel,
  nextActionIcon,
  onPrevious,
  onForceScan,
  onNext,
}: {
  isSetupStep: boolean
  setupStep: string
  setupStepIndex: number
  currentScanTarget: string
  scanPending: boolean
  exportDisabled: boolean
  nextDisabled: boolean
  submitting: boolean
  nextButtonLabel: string
  nextActionIcon: ReactElement
  onPrevious: () => void
  onForceScan: () => void
  onNext: () => void
}) => {
  if (!isSetupStep) {
    return null
  }

  return (
    <Box
      sx={{
        position: ["sticky", "fixed"],
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 40,
        px: [3, 4, 5],
        pb: [3, 4],
      }}
    >
      <Box
        sx={{
          mx: "auto",
          display: "flex",
          width: "100%",
          maxWidth: "1280px",
          justifyContent: "center",
        }}
      >
        <Box
          sx={{
            display: "flex",
            minHeight: "64px",
            width: "100%",
            maxWidth: "max-content",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: 2,
            px: 3,
            py: 3,
            border: "1px solid",
            borderColor: "border.default",
            borderRadius: 2,
            bg: "canvas.overlay",
            boxShadow: "shadow.floating.medium",
          }}
        >
          {setupStepIndex > 0 ? (
            <Button type="button" variant="default" onClick={onPrevious}>
              이전
            </Button>
          ) : null}

          {setupStep === "blog-input" ? (
            <Button
              type="button"
              id="force-scan-button"
              variant="default"
              title="캐시 비우기"
              disabled={!currentScanTarget || scanPending}
              onClick={onForceScan}
            >
              새로 불러오기
            </Button>
          ) : null}

          <Button
            type="button"
            id={
              setupStep === "blog-input"
                ? "scan-button"
                : setupStep === "diagnostics-options"
                  ? "export-button"
                  : undefined
            }
            disabled={
              setupStep === "diagnostics-options"
                ? exportDisabled || submitting || nextDisabled
                : nextDisabled
            }
            onClick={onNext}
            variant="primary"
            leadingVisual={nextActionIcon}
          >
            {nextButtonLabel}
          </Button>
        </Box>
      </Box>
    </Box>
  )
}
