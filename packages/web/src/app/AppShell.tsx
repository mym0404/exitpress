import { CheckIcon } from "@primer/octicons-react"
import { Box, Button, NavList, PageLayout, Text } from "@primer/react"

import type { ThemePreference } from "@exitpress/domain/preferences/schema/ThemePreference.js"
import type { ReactElement, ReactNode, RefObject } from "react"

import type { SetupStep, WizardStep } from "../features/common/shell/WizardFlow.js"
import type { ResumeDialogState } from "../features/resume/ResumeState.js"

import { PrimerToastViewport } from "../components/primer/PrimerToast.js"
import { NextActionIcon, setupSteps, stepMeta } from "../features/common/shell/WizardFlow.js"
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
  visibleSetupSteps: SetupStep[]
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
  onSetupStepSelect: (step: SetupStep) => void
  onPrevious: () => void
  onForceScan: () => void
  onNext: () => void
}

const WizardStepNav = ({
  currentStep,
  isSetupStep,
  setupStep,
  visibleSetupSteps,
  onSetupStepSelect,
}: {
  currentStep: WizardStep
  isSetupStep: boolean
  setupStep: SetupStep
  visibleSetupSteps: SetupStep[]
  onSetupStepSelect: (step: SetupStep) => void
}) => {
  const activeVisibleIndex = visibleSetupSteps.indexOf(setupStep)

  return (
    <Box
      as="nav"
      data-workflow-nav
      aria-label="내보내기 단계"
      sx={{
        display: "grid",
        gap: 2,
      }}
    >
      <Text sx={{ color: "fg.muted", fontSize: 0, fontWeight: 600, px: 2 }}>설정</Text>
      <NavList>
        {visibleSetupSteps.map((step, index) => {
          const active = isSetupStep && step === setupStep
          const complete = isSetupStep && index < activeVisibleIndex
          const canSelect = isSetupStep && index <= activeVisibleIndex

          return (
            <NavList.Item
              key={step}
              href="#step-view"
              aria-current={active ? "step" : undefined}
              aria-disabled={canSelect ? undefined : true}
              tabIndex={canSelect ? undefined : -1}
              sx={{
                color: canSelect ? "fg.default" : "fg.muted",
                opacity: canSelect ? 1 : 0.64,
              }}
              onClick={(event) => {
                event.preventDefault()

                if (canSelect) {
                  onSetupStepSelect(step)
                }
              }}
            >
              {complete ? (
                <NavList.LeadingVisual>
                  <CheckIcon />
                </NavList.LeadingVisual>
              ) : null}
              {stepMeta[step].title}
            </NavList.Item>
          )
        })}
      </NavList>

      {!isSetupStep ? (
        <>
          <Text sx={{ color: "fg.muted", fontSize: 0, fontWeight: 600, mt: 3, px: 2 }}>실행</Text>
          <NavList>
            {setupSteps
              .filter((step) => !visibleSetupSteps.includes(step))
              .map((step) => (
                <NavList.Item
                  key={step}
                  href="#step-view"
                  aria-disabled
                  tabIndex={-1}
                  sx={{ color: "fg.muted" }}
                >
                  {stepMeta[step].title}
                </NavList.Item>
              ))}
            {(["block-scan", "markdown-review", "running", "upload", "result"] as const).map(
              (step) => {
                const active = currentStep === step

                return (
                  <NavList.Item
                    key={step}
                    href="#step-view"
                    aria-current={active ? "step" : undefined}
                    aria-disabled={active ? undefined : true}
                    tabIndex={active ? undefined : -1}
                    sx={{ color: active ? "fg.default" : "fg.muted" }}
                    onClick={(event) => event.preventDefault()}
                  >
                    {stepMeta[step].title}
                  </NavList.Item>
                )
              },
            )}
          </NavList>
        </>
      ) : null}
    </Box>
  )
}

const WizardStepActions = ({
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
  setupStep: SetupStep
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
      data-step-actions
      sx={{
        display: "flex",
        flexDirection: ["column-reverse", "row"],
        flexWrap: "wrap",
        alignItems: ["stretch", "center"],
        justifyContent: "flex-end",
        gap: 2,
        pt: 3,
        borderTop: "1px solid",
        borderColor: "border.default",
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
  )
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
  visibleSetupSteps,
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
  onSetupStepSelect,
  onPrevious,
  onForceScan,
  onNext,
}: AppShellProps) => (
  <Box
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

    <PageLayout
      containerWidth="xlarge"
      padding="normal"
      rowGap="normal"
      columnGap="normal"
      sx={{ width: "100%", flex: "1 0 auto", py: [3, 4] }}
    >
      <PageLayout.Header divider="line" padding="none">
        <WizardHeader
          title={stepMeta[currentStep].title}
          description={stepMeta[currentStep].description}
          themePreference={themePreference}
          headerStatus={headerStatus}
          summaryCards={summaryCards}
          onThemeChange={onThemeChange}
        />
      </PageLayout.Header>

      <PageLayout.Pane
        position="start"
        width="small"
        divider="line"
        padding="none"
        aria-label="내보내기 단계"
        sx={{
          display: ["none", null, "block"],
        }}
      >
        <WizardStepNav
          currentStep={currentStep}
          isSetupStep={isSetupStep}
          setupStep={setupStep}
          visibleSetupSteps={visibleSetupSteps}
          onSetupStepSelect={onSetupStepSelect}
        />
      </PageLayout.Pane>

      <PageLayout.Content as="main" width="full" padding="none">
        <Box
          data-workflow-shell
          sx={{
            display: "grid",
            gap: 3,
            alignContent: "start",
            minWidth: 0,
          }}
        >
          <Box
            as="section"
            id="step-view"
            ref={stepViewRef}
            data-step-view={currentStep}
            sx={{
              display: "grid",
              gap: 3,
              alignContent: "start",
              minWidth: 0,
            }}
          >
            {children}
          </Box>

          <WizardStepActions
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
              <NextActionIcon
                setupStep={setupStep}
                scanPending={scanPending}
                submitting={submitting}
              />
            }
            onPrevious={onPrevious}
            onForceScan={onForceScan}
            onNext={onNext}
          />
        </Box>
      </PageLayout.Content>
    </PageLayout>
    <PrimerToastViewport />
  </Box>
)
