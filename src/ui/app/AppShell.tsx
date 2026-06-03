import type { ReactNode, RefObject } from "react"

import type { ThemePreference } from "../../domain/preferences/ThemePreference.js"
import type { SetupStep, WizardStep } from "../features/common/shell/WizardFlow.js"
import type { ResumeDialogState } from "../features/resume/ResumeState.js"

import { Toaster } from "../components/ui/Sonner.js"
import { WizardDock } from "../features/common/shell/WizardDock.js"
import { NextActionIcon, stepMeta } from "../features/common/shell/WizardFlow.js"
import { WizardHeader } from "../features/common/shell/WizardHeader.js"
import { ResumeDialogPanel } from "../features/resume/ResumeDialogPanel.js"
import { cn } from "../lib/Cn.js"

import { BootstrapLoadingOverlay } from "./BootstrapLoadingOverlay.js"

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
}: {
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
}) => (
  <main
    className={cn("dashboard-shell relative min-h-screen w-full overflow-x-clip", themePreference)}
    aria-busy={bootstrapping || undefined}
  >
    <ResumeDialogPanel
      resumeDialog={resumeDialog}
      resettingResume={resettingResume}
      restoringResume={restoringResume}
      onReset={onResetResume}
      onRestore={onRestoreResume}
    />

    <div
      id="dashboard-backdrop"
      className="shell-backdrop pointer-events-none fixed inset-0 -z-10"
      aria-hidden="true"
    />
    <div
      className="dashboard-brand-mark pointer-events-none fixed inset-x-0 z-0"
      aria-hidden="true"
    >
      <img src="/brand/logo.svg" alt="" />
    </div>

    {bootstrapping ? <BootstrapLoadingOverlay /> : null}

    <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-5 px-4 py-5 xl:px-6 xl:py-6">
      <WizardHeader
        title={stepMeta[currentStep].title}
        themePreference={themePreference}
        headerStatus={headerStatus}
        summaryCards={summaryCards}
        onThemeChange={onThemeChange}
      />

      <section
        ref={stepViewRef}
        className={cn("grid gap-4", isSetupStep ? "pb-28 sm:pb-32" : "")}
        data-step-view={currentStep}
      >
        {children}
      </section>
    </div>

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
    <Toaster theme={themePreference} />
  </main>
)
