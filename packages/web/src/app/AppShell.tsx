import { Box } from "@primer/react"

import type { ThemePreference } from "@exitpress/domain/preferences/schema/ThemePreference.js"
import type { ReactNode, RefObject } from "react"

import type { SetupStep, WizardStep } from "../features/common/shell/WizardFlow.js"
import type { ResumeDialogState } from "../features/resume/ResumeState.js"

import { PrimerToastViewport } from "../components/primer/PrimerToast.js"
import { WizardDock } from "../features/common/shell/WizardDock.js"
import { NextActionIcon, stepMeta } from "../features/common/shell/WizardFlow.js"
import { WizardHeader } from "../features/common/shell/WizardHeader.js"
import { ResumeDialogPanel } from "../features/resume/ResumeDialogPanel.js"

import { BootstrapLoadingOverlay } from "./BootstrapLoadingOverlay.js"

type AppShellProps = {
  themePreference: ThemePreference
  bootstrapping: boolean
  resumeDialog: ResumeDialogState | null
  resettingResume: boolean
  restoringResume: boolean
  currentStep: WizardStep
  isSetupStep: boolean
  setupStep: SetupStep
  setupStepIndex: number
  stepViewRef: RefObject<HTMLElement | null>
  headerStatus: ReturnType<typeof import("../features/common/shell/WizardFlow.js").getHeaderStatus>
  summaryCards: ReturnType<
    typeof import("../features/common/shell/WizardFlow.js").buildSummaryCards
  >
  currentScanTarget: string
  scanPending: boolean
  exportDisabled: boolean
  nextDisabled: boolean
  submitting: boolean
  nextButtonLabel: string
  children: ReactNode
  onThemeChange: (value: ThemePreference) => void
  onResetResume: () => void
  onRestoreResume: () => void
  onPrevious: () => void
  onForceScan: () => void
  onNext: () => void
}

export const AppShell = ({
  themePreference,
  bootstrapping,
  resumeDialog,
  resettingResume,
  restoringResume,
  currentStep,
  isSetupStep,
  setupStep,
  setupStepIndex,
  stepViewRef,
  headerStatus,
  summaryCards,
  currentScanTarget,
  scanPending,
  exportDisabled,
  nextDisabled,
  submitting,
  nextButtonLabel,
  children,
  onThemeChange,
  onResetResume,
  onRestoreResume,
  onPrevious,
  onForceScan,
  onNext,
}: AppShellProps) => (
  <Box
    as="main"
    aria-busy={bootstrapping || undefined}
    sx={{
      minHeight: "100vh",
      bg: "canvas.default",
      color: "fg.default",
      display: "flex",
      flexDirection: "column",
      overflowX: "clip",
      position: "relative",
    }}
  >
    <ResumeDialogPanel
      resumeDialog={resumeDialog}
      resettingResume={resettingResume}
      restoringResume={restoringResume}
      onReset={onResetResume}
      onRestore={onRestoreResume}
    />

    {bootstrapping ? <BootstrapLoadingOverlay /> : null}

    <Box
      sx={{
        width: "100%",
        maxWidth: "1280px",
        minHeight: isSetupStep ? ["auto", "100vh"] : "100vh",
        flex: isSetupStep ? ["1 0 auto", "initial"] : "initial",
        mx: "auto",
        px: [3, 4, 5],
        pt: [3, 4],
        pb: isSetupStep ? [0, "128px"] : [3, 4],
        display: "grid",
        gridTemplateRows: "auto 1fr",
        gap: [3, 4],
        position: "relative",
        zIndex: 1,
      }}
    >
      <WizardHeader
        title={stepMeta[currentStep].title}
        description={stepMeta[currentStep].description}
        themePreference={themePreference}
        headerStatus={headerStatus}
        summaryCards={summaryCards}
        onThemeChange={onThemeChange}
      />

      <Box
        as="section"
        ref={stepViewRef}
        data-step-view={currentStep}
        sx={{
          display: "grid",
          gap: 3,
          alignContent: "start",
        }}
      >
        {children}
      </Box>
    </Box>

    <WizardDock
      isSetupStep={isSetupStep}
      setupStep={setupStep}
      setupStepIndex={setupStepIndex}
      currentScanTarget={currentScanTarget}
      scanPending={scanPending}
      exportDisabled={exportDisabled}
      nextDisabled={nextDisabled}
      submitting={submitting}
      nextButtonLabel={nextButtonLabel}
      nextActionIcon={
        <NextActionIcon setupStep={setupStep} scanPending={scanPending} submitting={submitting} />
      }
      onPrevious={onPrevious}
      onForceScan={onForceScan}
      onNext={onNext}
    />
    <PrimerToastViewport />
  </Box>
)
