import { useCallback } from "react"
import type { UploadProviderFields } from "../../../../domain/upload/UploadProviderTypes.js"
import type { UseWizardActionsArgs } from "./UseWizardActionTypes.js"
import { toast } from "../../../components/ui/Sonner.js"
import { createErrorJobState } from "../../job-results/ExportJobFallback.js"
import { normalizeOutputDir } from "../../scan/ScanStatus.js"
import { setupSteps } from "../shell/WizardFlow.js"
import { useWizardResumeActions } from "./UseWizardResumeActions.js"
import { useWizardScanActions } from "./UseWizardScanActions.js"

export const useWizardActions = (args: UseWizardActionsArgs) => {
  const {
    isSetupStep,
    setupStep,
    setupStepIndex,
    currentScanTarget,
    outputDir,
    activeScanResult,
    scopedPostCount,
    options,
    frontmatterValidationErrors,
    startJob,
    startUpload,
    setJob,
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

    try {
      const jobId = await startJob({
        blogIdOrUrl: currentScanTarget,
        outputDir: normalizeOutputDir(outputDir),
        options,
        scanResult: activeScanResult,
      })
      toast.success("내보내기 작업을 등록했습니다.", {
        description: `${scopedPostCount}개 글을 처리합니다. 작업 ID ${jobId}`,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      setJob(
        createErrorJobState({
          error: message,
          request: {
            blogIdOrUrl: currentScanTarget,
            outputDir: normalizeOutputDir(outputDir),
            options,
          },
        }),
      )
      toast.error("내보내기 작업 등록에 실패했습니다.", {
        description: message,
      })
    }
  }, [
    activeScanResult,
    currentScanTarget,
    frontmatterValidationErrors.length,
    options,
    outputDir,
    scopedPostCount,
    setActiveJobFilter,
    setCategoryStatus,
    setJob,
    setSetupStep,
    startJob,
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
