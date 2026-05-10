import { useCallback } from "react"

import { sanitizePersistedExportOptions } from "../../../../modules/exporter/ExportOptions.js"
import type { ExportOptions } from "../../../../modules/exporter/Types.js"
import type { ScanResult } from "../../../../modules/blog/Types.js"
import type { UploadProviderFields } from "../../../../server/Types.js"
import type { ExportBootstrapResponse, ExportResumeLookupResponse } from "../../../lib/Api.js"
import { postJson } from "../../../lib/Api.js"
import { toast } from "../../../components/ui/Sonner.js"
import { toggleCategorySelection } from "../../scan/CategorySelection.js"
import {
  defaultCategoryStatus,
  defaultScanLoadingStatus,
  defaultScanStatus,
  forceScanLoadingStatus,
  normalizeOutputDir,
  readyCategoryStatus,
  resolveScopedCategoryIds,
  resumeLookupErrorStatus,
} from "../../scan/ScanStatus.js"
import type { ResumeDialogState } from "../../resume/ResumeState.js"
import { createErrorJobState } from "../../job-results/ExportJobFallback.js"
import { getPersistedUiStateSignature, setupSteps, type SetupStep } from "../shell/WizardFlow.js"

export const useWizardActions = ({
  isSetupStep,
  setupStep,
  setupStepIndex,
  currentScanTarget,
  outputDir,
  outputDirBaseline,
  activeScanResult,
  scanCache,
  scopedPostCount,
  options,
  resumeDialog,
  frontmatterValidationErrors,
  updateOptions,
  startJob,
  startUpload,
  resumeJob,
  hydrateJob,
  applyResumedState,
  applyBootstrapState,
  setJob,
  setResumeDialog,
  setScanCache,
  setScanPending,
  setCategoryStatus,
  setCategorySearch,
  setSetupStep,
  setActiveJobFilter,
  setResettingResume,
  setRestoringResume,
  setBlogIdOrUrl,
  setOutputDir,
  setNeutralScanStatus,
  setErrorScanStatus,
  setOptions,
  latestPersistedOptionsRef,
  latestThemePreferenceRef,
  persistedUiStateSignatureRef,
}: {
  isSetupStep: boolean
  setupStep: SetupStep
  setupStepIndex: number
  currentScanTarget: string
  outputDir: string
  outputDirBaseline: string
  activeScanResult: ScanResult | null
  scanCache: Record<string, ScanResult>
  scopedPostCount: number
  options: ExportOptions
  resumeDialog: ResumeDialogState | null
  frontmatterValidationErrors: string[]
  updateOptions: (updater: (current: ExportOptions) => ExportOptions) => void
  startJob: (args: {
    blogIdOrUrl: string
    outputDir: string
    options: ExportOptions
    scanResult?: ScanResult | null
  }) => Promise<string | undefined>
  startUpload: (args: {
    providerKey: string
    providerFields: UploadProviderFields
  }) => Promise<unknown>
  resumeJob: () => Promise<unknown>
  hydrateJob: (job: ExportBootstrapResponse["resumedJob"]) => void
  applyResumedState: (args: {
    source: ResumeDialogState["source"]
    resumedJob: NonNullable<ExportBootstrapResponse["resumedJob"]>
    resumeSummary: NonNullable<ExportBootstrapResponse["resumeSummary"]>
    resumedScanResult: ScanResult | null
  }) => void
  applyBootstrapState: (defaults: ExportBootstrapResponse) => void
  setJob: (job: ReturnType<typeof createErrorJobState>) => void
  setResumeDialog: (value: ResumeDialogState | null) => void
  setScanCache: React.Dispatch<React.SetStateAction<Record<string, ScanResult>>>
  setScanPending: (value: boolean) => void
  setCategoryStatus: (value: string) => void
  setCategorySearch: (value: string) => void
  setSetupStep: (value: SetupStep) => void
  setActiveJobFilter: (value: "all" | "success" | "failed") => void
  setResettingResume: (value: boolean) => void
  setRestoringResume: (value: boolean) => void
  setBlogIdOrUrl: (value: string) => void
  setOutputDir: React.Dispatch<React.SetStateAction<string>>
  setNeutralScanStatus: (message: string) => void
  setErrorScanStatus: (message: string) => void
  setOptions: React.Dispatch<React.SetStateAction<ExportOptions>>
  latestPersistedOptionsRef: { current: ReturnType<typeof sanitizePersistedExportOptions> }
  latestThemePreferenceRef: { current: "dark" | "light" }
  persistedUiStateSignatureRef: { current: string | null }
}) => {
  const ensureScanResult = useCallback(async ({
    forceRefresh = false,
    skipResumeLookup = false,
  }: {
    forceRefresh?: boolean
    skipResumeLookup?: boolean
  } = {}) => {
    if (!currentScanTarget) {
      setErrorScanStatus("블로그 ID 또는 URL을 입력하세요.")
      return false
    }

    const normalizedOutputDir = normalizeOutputDir(outputDir)

    if (!forceRefresh && !skipResumeLookup) {
      setScanPending(true)
      setNeutralScanStatus("기존 작업 상태를 확인하는 중입니다.")
      setCategoryStatus("출력 경로의 manifest.json 상태를 확인하는 중입니다.")

      try {
        const resumed = await postJson<ExportResumeLookupResponse>("/api/export-resume/lookup", {
          outputDir: normalizedOutputDir,
        })
        const nextResumeDialog =
          resumed.resumedJob && resumed.resumeSummary
            ? {
                source: "before-scan" as const,
                resumedJob: resumed.resumedJob,
                resumeSummary: resumed.resumeSummary,
                resumedScanResult: resumed.resumedScanResult,
              }
            : null

        if (nextResumeDialog) {
          setResumeDialog(nextResumeDialog)
          setNeutralScanStatus("이 경로에서 이어서 불러올 작업을 찾았습니다.")
          setCategoryStatus("작업 초기화 또는 불러오기 중 하나를 선택하세요.")
          return false
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        setErrorScanStatus(message)
        setCategoryStatus(resumeLookupErrorStatus)
        toast.error("작업 상태 확인에 실패했습니다.", {
          description: message,
        })
        return false
      } finally {
        setScanPending(false)
      }
    }

    if (activeScanResult && !forceRefresh) {
      setNeutralScanStatus(`${activeScanResult.blogId} 스캔 결과를 재사용합니다.`)
      setCategoryStatus(readyCategoryStatus)
      setCategorySearch("")
      setOptions((current) => ({
        ...current,
        scope: {
          ...current.scope,
          categoryIds: resolveScopedCategoryIds({
            categories: activeScanResult.categories,
            currentCategoryIds: current.scope.categoryIds,
          }),
        },
      }))
      setSetupStep("category-selection")
      return true
    }

    setScanPending(true)
    setNeutralScanStatus(forceRefresh ? forceScanLoadingStatus : defaultScanLoadingStatus)
    setCategoryStatus("카테고리를 불러오는 중입니다.")

    if (forceRefresh) {
      setScanCache((current) => {
        const next = { ...current }
        delete next[currentScanTarget]
        return next
      })
    }

    try {
      const nextScanResult = await postJson<ScanResult>("/api/scan", {
        blogIdOrUrl: currentScanTarget,
        forceRefresh,
      })

      setScanCache((current) => ({
        ...current,
        [currentScanTarget]: nextScanResult,
      }))
      setNeutralScanStatus(`${nextScanResult.blogId} 스캔 완료`)
      setCategoryStatus(readyCategoryStatus)
      setCategorySearch("")
      setOptions((current) => ({
        ...current,
        scope: {
          ...current.scope,
          categoryIds: nextScanResult.categories.map((category) => category.id),
        },
      }))
      setSetupStep("category-selection")
      toast.success("카테고리 스캔이 완료되었습니다.", {
        description: `${nextScanResult.totalPostCount}개 글과 ${nextScanResult.categories.length}개 카테고리를 불러왔습니다.`,
      })

      return true
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      setErrorScanStatus(message)
      setCategoryStatus("스캔에 실패했습니다. 다시 시도하세요.")
      toast.error("카테고리 스캔에 실패했습니다.", {
        description: message,
      })
      return false
    } finally {
      setScanPending(false)
    }
  }, [
    activeScanResult,
    currentScanTarget,
    outputDir,
    setCategorySearch,
    setCategoryStatus,
    setErrorScanStatus,
    setNeutralScanStatus,
    setOptions,
    setResumeDialog,
    setScanCache,
    setScanPending,
    setSetupStep,
  ])

  const handleBlogInputChange = useCallback((value: string) => {
    setBlogIdOrUrl(value)
    setSetupStep("blog-input")

    if (value.trim() && scanCache[value.trim()]) {
      setNeutralScanStatus("캐시된 카테고리를 다시 사용할 수 있습니다.")
      setCategoryStatus(readyCategoryStatus)
      return
    }

    setNeutralScanStatus(
      value.trim() ? "블로그가 바뀌었습니다. 다음 단계에서 다시 스캔합니다." : defaultScanStatus,
    )
    setCategoryStatus(defaultCategoryStatus)
    setCategorySearch("")
    setOptions((current) => ({
      ...current,
      scope: {
        ...current.scope,
        categoryIds: [],
      },
    }))
  }, [scanCache, setBlogIdOrUrl, setCategorySearch, setCategoryStatus, setNeutralScanStatus, setOptions, setSetupStep])

  const handleOutputDirChange = useCallback((value: string) => {
    setOutputDir(value)
  }, [setOutputDir])

  const handleOutputDirBlur = useCallback(() => {
    setOutputDir((current) => current.trim() || outputDirBaseline)
  }, [outputDirBaseline, setOutputDir])

  const handleCategoryToggle = useCallback((categoryId: number, checked: boolean) => {
    if (!activeScanResult) {
      return
    }

    updateOptions((current) => ({
      ...current,
      scope: {
        ...current.scope,
        categoryIds: toggleCategorySelection({
          categories: activeScanResult.categories,
          selectedIds: current.scope.categoryIds,
          categoryId,
          checked,
        }),
      },
    }))
  }, [activeScanResult, updateOptions])

  const handleSelectAllCategories = useCallback(() => {
    if (!activeScanResult) {
      return
    }

    updateOptions((current) => ({
      ...current,
      scope: {
        ...current.scope,
        categoryIds: activeScanResult.categories.map((category) => category.id),
      },
    }))
    toast("카테고리를 전체 선택했습니다.", {
      description: `${activeScanResult.totalPostCount}개 글이 선택 범위에 포함됩니다.`,
    })
  }, [activeScanResult, updateOptions])

  const handleClearAllCategories = useCallback(() => {
    updateOptions((current) => ({
      ...current,
      scope: {
        ...current.scope,
        categoryIds: [],
      },
    }))
    toast("카테고리 선택을 모두 해제했습니다.", {
      description: "선택 범위가 비워졌습니다.",
    })
  }, [updateOptions])

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

  const handleUpload = useCallback(async ({
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
  }, [startUpload])

  const handleRestoreResume = useCallback(async () => {
    if (!resumeDialog) {
      return
    }

    if (resumeDialog.source === "bootstrap") {
      setResumeDialog(null)
      return
    }

    setRestoringResume(true)

    try {
      const restored = await postJson<ExportResumeLookupResponse>("/api/export-resume/restore", {
        outputDir: resumeDialog.resumeSummary.outputDir,
      })

      if (!restored.resumedJob || !restored.resumeSummary) {
        throw new Error("불러올 수 있는 작업 상태를 찾지 못했습니다.")
      }

      applyResumedState({
        source: "before-scan",
        resumedJob: restored.resumedJob,
        resumeSummary: restored.resumeSummary,
        resumedScanResult: restored.resumedScanResult,
      })
      toast.success("이전 작업을 다시 불러왔습니다.", {
        description: `${restored.resumeSummary.outputDir} 작업 상태를 복구했습니다.`,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      toast.error("이전 작업을 불러오지 못했습니다.", {
        description: message,
      })
    } finally {
      setRestoringResume(false)
    }
  }, [applyResumedState, resumeDialog, setRestoringResume, setResumeDialog])

  const handleResumeExport = useCallback(async () => {
    try {
      await resumeJob()
      toast("남은 내보내기를 다시 시작했습니다.", {
        description: "이전 진행 상태를 이어서 처리합니다.",
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      toast.error("내보내기를 다시 시작하지 못했습니다.", {
        description: message,
      })
    }
  }, [resumeJob])

  const handleResetResume = useCallback(async () => {
    if (!resumeDialog) {
      return
    }

    setResettingResume(true)

    try {
      const nextDefaults = await postJson<ExportBootstrapResponse>("/api/export-reset", {
        outputDir: resumeDialog.resumeSummary.outputDir,
        jobId: resumeDialog.resumedJob.id,
      })

      if (resumeDialog.source === "bootstrap") {
        const nextPersistedOptions = sanitizePersistedExportOptions(nextDefaults.options)

        latestPersistedOptionsRef.current = nextPersistedOptions
        latestThemePreferenceRef.current = nextDefaults.themePreference
        persistedUiStateSignatureRef.current = getPersistedUiStateSignature({
          options: nextDefaults.options,
          themePreference: nextDefaults.themePreference,
        })
        applyBootstrapState(nextDefaults)
      } else {
        setResumeDialog(null)
        hydrateJob(null)
        await ensureScanResult({
          skipResumeLookup: true,
        })
      }

      toast.success("이전 작업을 초기화했습니다.", {
        description: `${resumeDialog.resumeSummary.outputDir} 작업내역을 삭제했습니다.`,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      toast.error("작업 초기화에 실패했습니다.", {
        description: message,
      })
    } finally {
      setResettingResume(false)
    }
  }, [
    applyBootstrapState,
    ensureScanResult,
    hydrateJob,
    latestPersistedOptionsRef,
    latestThemePreferenceRef,
    persistedUiStateSignatureRef,
    resumeDialog,
    setResettingResume,
    setResumeDialog,
  ])

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
