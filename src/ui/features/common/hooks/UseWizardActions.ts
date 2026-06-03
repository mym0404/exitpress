import { useCallback } from "react"

import type { UploadProviderFields } from "../../../../domain/upload/UploadProviderTypes.js"

import type { UseWizardActionsArgs } from "./UseWizardActionTypes.js"

import { toast } from "../../../components/ui/Sonner.js"
import { setupSteps } from "../shell/WizardFlow.js"

import { useWizardResumeActions } from "./UseWizardResumeActions.js"
import { useWizardScanActions } from "./UseWizardScanActions.js"

export const useWizardActions = (args: UseWizardActionsArgs) => {
  const {
    isSetupStep,
    setupStep,
    setupStepIndex,
    activeScanResult,
    frontmatterValidationErrors,
    startBlockScan,
    startUpload,
    setCategoryStatus,
    setSetupStep,
    setActiveJobFilter,
  } = args

  const {
    ensureScanResult,
    handleBlogInputChange,
    handleOutputDirChange,
    handleOutputDirBlur,
    handleCategoryToggle,
    handleSelectAllCategories,
    handleClearAllCategories,
  } = useWizardScanActions(args)
  const { handleRestoreResume, handleResumeExport, handleResetResume } = useWizardResumeActions({
    ...args,
    ensureScanResult,
  })

  const handleSubmit = useCallback(async () => {
    if (!activeScanResult) {
      setCategoryStatus("먼저 스캔을 완료해야 합니다.")
      return
    }

    if (frontmatterValidationErrors.length > 0) {
      setSetupStep("frontmatter-options")
      setCategoryStatus("Frontmatter alias 오류를 먼저 해결해야 합니다.")
      return
    }

    setActiveJobFilter("all")
    await startBlockScan()
  }, [
    activeScanResult,
    frontmatterValidationErrors.length,
    setActiveJobFilter,
    setCategoryStatus,
    setSetupStep,
    startBlockScan,
  ])

  const handleUpload = useCallback(
    async ({
      providerKey,
      providerFields,
    }: {
      providerKey: string
      providerFields: UploadProviderFields
    }) => {
      try {
        await startUpload({
          providerKey,
          providerFields,
        })
        toast("Image Upload를 시작했습니다.", {
          description: "현재 단계에서 진행률을 확인할 수 있습니다.",
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        toast.error("Image Upload를 시작하지 못했습니다.", {
          description: message,
        })
      }
    },
    [startUpload],
  )

  const goToPreviousStep = useCallback(() => {
    if (!isSetupStep || setupStepIndex <= 0) {
      return
    }

    setSetupStep(setupSteps[setupStepIndex - 1])
  }, [isSetupStep, setSetupStep, setupStepIndex])

  const goToNextStep = useCallback(async () => {
    if (!isSetupStep) {
      return
    }

    if (setupStep === "blog-input") {
      await ensureScanResult()
      return
    }

    if (setupStep === "category-selection") {
      setSetupStep("structure-options")
      return
    }

    if (setupStep === "diagnostics-options") {
      await handleSubmit()
      return
    }

    setSetupStep(setupSteps[setupStepIndex + 1] ?? setupStep)
  }, [ensureScanResult, handleSubmit, isSetupStep, setSetupStep, setupStep, setupStepIndex])

  return {
    ensureScanResult,
    handleBlogInputChange,
    handleOutputDirChange,
    handleOutputDirBlur,
    handleCategoryToggle,
    handleSelectAllCategories,
    handleClearAllCategories,
    handleUpload,
    handleRestoreResume,
    handleResumeExport,
    handleResetResume,
    goToPreviousStep,
    goToNextStep,
  }
}
