import {
  isUploadActionableJob,
  JOB_STATUSES,
  UPLOAD_STATUSES,
} from "@exitpress/domain/export-job/ExportJobState.js"
import {
  sanitizePersistedExportOptions,
  validateFrontmatterAliases,
} from "@exitpress/domain/export-options/ExportOptions.js"
import { filterPostsByScope } from "@exitpress/domain/export-scope/ExportScope.js"
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react"

import type { BlockScanJobState } from "@exitpress/domain/block-scan/Types.js"
import type { ScanCacheMap, ScanResult } from "@exitpress/domain/blog/Types.js"
import type { ExportJobState } from "@exitpress/domain/export-job/Types.js"
import type { ExportOptions } from "@exitpress/domain/export-options/Types.js"
import type { ThemePreference } from "@exitpress/domain/preferences/ThemePreference.js"

import type { SetupStep, WizardStep } from "../features/common/shell/WizardFlow.js"
import type { ResumeDialogState } from "../features/resume/ResumeState.js"

import { toast } from "../components/ui/Sonner.js"
import { useBeforeUnloadWarning } from "../features/common/hooks/UseBeforeUnloadWarning.js"
import { useBootstrapDefaults } from "../features/common/hooks/UseBootstrapDefaults.js"
import { useExportSettingsSync } from "../features/common/hooks/UseExportSettingsSync.js"
import { useStepScroll } from "../features/common/hooks/UseStepScroll.js"
import { useThemePreference } from "../features/common/hooks/UseThemePreference.js"
import { useWizardActions } from "../features/common/hooks/UseWizardActions.js"
import {
  getPersistedUiStateSignature,
  resolveWizardStep,
  setupSteps,
} from "../features/common/shell/WizardFlow.js"
import { setExportJobPollingConfig, useExportJob } from "../features/job-results/UseExportJob.js"
import { useJobNotifications } from "../features/job-results/UseJobNotifications.js"
import { useUploadProvidersCatalog } from "../features/job-results/UseUploadProvidersCatalog.js"
import {
  defaultCategoryStatus,
  defaultOutputDir,
  defaultScanStatus,
  normalizeOutputDir,
} from "../features/scan/ScanStatus.js"
import { fetchJson, postJson } from "../lib/Api.js"
import { getAppRoute } from "../lib/AppRoutes.js"

import { fallbackDefaults } from "./AppDefaults.js"
import { useAppResumeBootstrap } from "./AppResumeBootstrap.js"
import { AppShell } from "./AppShell.js"
import { getAppShellState, shouldWarnBeforeLeavingApp } from "./AppShellState.js"
import { AppStepView } from "./AppStepView.js"

const getBlockDetectionScopeSignature = (options: Pick<ExportOptions, "scope">) =>
  JSON.stringify(options.scope)

const StorybookPage = lazy(() =>
  import("../features/storybook/StorybookPage.js").then((module) => ({
    default: module.StorybookPage,
  })),
)

const waitForBlockScanPoll = () =>
  new Promise((resolve) => {
    setTimeout(resolve, 250)
  })

const createErrorJobState = ({
  error,
  request,
}: {
  error: string
  request: { blogIdOrUrl: string; outputDir: string; options: ExportOptions }
}) =>
  ({
    id: "failed-local",
    request: {
      blogIdOrUrl: request.blogIdOrUrl,
      outputDir: request.outputDir,
      profile: "gfm",
      options: request.options,
    },
    status: JOB_STATUSES.FAILED,
    resumeAvailable: false,
    logs: [],
    createdAt: new Date().toISOString(),
    startedAt: new Date().toISOString(),
    finishedAt: new Date().toISOString(),
    progress: {
      total: 0,
      completed: 0,
      failed: 0,
    },
    upload: {
      status: UPLOAD_STATUSES.NOT_REQUESTED,
      eligiblePostCount: 0,
      candidateCount: 0,
      uploadedCount: 0,
      failedCount: 0,
      terminalReason: null,
    },
    items: [],
    manifest: null,
    error,
  }) satisfies ExportJobState

const getCurrentAppRoute = () =>
  typeof window !== "undefined"
    ? getAppRoute({
        pathname: window.location.pathname,
        basePath: import.meta.env.BASE_URL,
      })
    : "export"

const useAppRoute = () => {
  const [route, setRoute] = useState(getCurrentAppRoute)

  useEffect(() => {
    const handlePopState = () => {
      setRoute(getCurrentAppRoute())
    }

    window.addEventListener("popstate", handlePopState)

    return () => {
      window.removeEventListener("popstate", handlePopState)
    }
  }, [])

  return route
}

export const App = () => {
  const route = useAppRoute()

  return route === "storybook" ? (
    <Suspense fallback={null}>
      <StorybookPage />
    </Suspense>
  ) : (
    <ExportApp />
  )
}

const ExportApp = () => {
  const [defaults, setDefaults] = useState(fallbackDefaults)
  const [bootstrapping, setBootstrapping] = useState(true)
  const [resettingResume, setResettingResume] = useState(false)
  const [restoringResume, setRestoringResume] = useState(false)
  const [blogIdOrUrl, setBlogIdOrUrl] = useState("")
  const [outputDir, setOutputDir] = useState(defaultOutputDir)
  const [resumeDialog, setResumeDialog] = useState<ResumeDialogState | null>(null)
  const [scanCache, setScanCache] = useState<ScanCacheMap>({})
  const [themePreference, setThemePreference] = useState<ThemePreference>(
    fallbackDefaults.themePreference,
  )
  const [options, setOptions] = useState<ExportOptions>(fallbackDefaults.options)
  const [scanStatus, setScanStatus] = useState(defaultScanStatus)
  const [scanStatusTone, setScanStatusTone] = useState<"default" | "error">("default")
  const [categoryStatus, setCategoryStatus] = useState(defaultCategoryStatus)
  const [categorySearch, setCategorySearch] = useState("")
  const [scanPending, setScanPending] = useState(false)
  const [setupStep, setSetupStep] = useState<SetupStep>("blog-input")
  const [postExportStep, setPostExportStep] = useState<"block-scan" | "markdown-review" | null>(
    null,
  )
  const [blockScanJob, setBlockScanJob] = useState<BlockScanJobState | null>(null)
  const [blockScanError, setBlockScanError] = useState<string | null>(null)
  const [activeJobFilter, setActiveJobFilter] = useState<"all" | "success" | "failed">("all")
  const {
    job,
    submitting,
    uploadSubmitting,
    hydrateJob,
    resumeJob,
    setJob,
    startJob,
    startUpload,
  } = useExportJob()

  const lastNotifiedJobKeyRef = useRef<string | null>(null)
  const blockScanRequestIdRef = useRef(0)
  const stepViewRef = useRef<HTMLElement | null>(null)
  const previousStepRef = useRef<string | null>(null)
  const persistedUiStateSignatureRef = useRef<string | null>(null)
  const hasLoadedDefaultsRef = useRef(false)
  const hasUserInteractedRef = useRef(false)
  const latestPersistedOptionsRef = useRef(sanitizePersistedExportOptions(fallbackDefaults.options))
  const latestThemePreferenceRef = useRef<ThemePreference>(fallbackDefaults.themePreference)

  const setNeutralScanStatus = useCallback((message: string) => {
    setScanStatus(message)
    setScanStatusTone("default")
  }, [])

  const setErrorScanStatus = useCallback((message: string) => {
    setScanStatus(message)
    setScanStatusTone("error")
  }, [])

  const { applyBootstrapState, applyResumedState } = useAppResumeBootstrap({
    hydrateJob,
    setDefaults,
    setOptions,
    setOutputDir,
    setBlogIdOrUrl,
    setCategorySearch,
    setSetupStep,
    setActiveJobFilter,
    setScanPending,
    setScanCache,
    setCategoryStatus,
    setThemePreference,
    setResumeDialog,
    setNeutralScanStatus,
    hasUserInteractedRef,
    lastNotifiedJobKeyRef,
  })

  const currentScanTarget = blogIdOrUrl.trim()
  const activeScanResult = currentScanTarget ? (scanCache[currentScanTarget] ?? null) : null
  const frontmatterValidationErrors = useMemo(
    () => validateFrontmatterAliases(options.frontmatter),
    [options.frontmatter],
  )
  const scopedPosts = useMemo(() => {
    if (!activeScanResult?.posts) {
      return []
    }

    return filterPostsByScope({
      posts: activeScanResult.posts,
      categories: activeScanResult.categories,
      options,
    })
  }, [activeScanResult, options])
  const scopedPostCount = activeScanResult?.posts
    ? scopedPosts.length
    : (activeScanResult?.totalPostCount ?? 0)
  const linkTemplatePreviewPost = scopedPosts[0] ?? activeScanResult?.posts?.[0] ?? null
  const selectedCategoryIds = options.scope.categoryIds
  const selectedCount = activeScanResult ? selectedCategoryIds.length : 0
  const exportDisabled = !activeScanResult || frontmatterValidationErrors.length > 0
  const setupStepIndex = setupSteps.indexOf(setupStep)
  const persistedOptions = useMemo(() => sanitizePersistedExportOptions(options), [options])
  const persistedUiStateSignature = useMemo(
    () => getPersistedUiStateSignature({ options: persistedOptions, themePreference }),
    [persistedOptions, themePreference],
  )
  const outputDirBaseline = normalizeOutputDir(
    defaults.resumedJob?.request.outputDir ?? defaults.lastOutputDir,
  )
  const shouldWarnBeforeUnload = shouldWarnBeforeLeavingApp({
    bootstrapping,
    blogIdOrUrl,
    outputDir: normalizeOutputDir(outputDir),
    outputDirBaseline,
    activeScanResult,
    job,
  })
  const currentStep = useMemo(() => {
    const resolvedStep = resolveWizardStep({
      setupStep,
      jobStatus: job?.status,
      submitting,
      uploadSubmitting,
    })

    return resolvedStep === setupStep && postExportStep
      ? postExportStep
      : (resolvedStep as WizardStep)
  }, [job?.status, postExportStep, setupStep, submitting, uploadSubmitting])
  const isSetupStep = currentStep === setupStep

  const { uploadProviders, uploadProviderError } = useUploadProvidersCatalog({
    jobId: job?.id,
    shouldLoad: isUploadActionableJob(job),
  })

  useThemePreference(themePreference)
  useStepScroll({
    currentStep,
    isSetupStep,
    previousStepRef,
    stepViewRef,
  })
  useBootstrapDefaults({
    fallbackDefaults,
    applyBootstrapState,
    setBootstrapping,
    setErrorScanStatus,
    setExportJobPollingConfig,
    hasLoadedDefaultsRef,
    latestPersistedOptionsRef,
    latestThemePreferenceRef,
    persistedUiStateSignatureRef,
  })
  useExportSettingsSync({
    hasLoadedDefaultsRef,
    persistedUiStateSignature,
    persistedUiStateSignatureRef,
    latestPersistedOptionsRef,
    latestThemePreferenceRef,
  })
  useJobNotifications({
    job,
    lastNotifiedJobKeyRef,
  })
  useBeforeUnloadWarning(shouldWarnBeforeUnload)

  useEffect(() => {
    latestPersistedOptionsRef.current = persistedOptions
  }, [persistedOptions])

  useEffect(() => {
    latestThemePreferenceRef.current = themePreference
  }, [themePreference])

  const updateOptions = useCallback((updater: (current: ExportOptions) => ExportOptions) => {
    hasUserInteractedRef.current = true
    setOptions((current) => updater(current))
  }, [])

  const startExportWithScanResult = useCallback(
    async (scanResult: ScanResult) => {
      setActiveJobFilter("all")

      try {
        const jobId = await startJob({
          blogIdOrUrl: currentScanTarget,
          outputDir: normalizeOutputDir(outputDir),
          options,
          scanResult,
        })
        setPostExportStep(null)
        toast.success("내보내기 작업을 등록했습니다.", {
          description: `${scopedPostCount}개 글을 처리합니다. 작업 ID ${jobId}`,
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        setPostExportStep(null)
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
    },
    [currentScanTarget, options, outputDir, scopedPostCount, setJob, startJob],
  )

  const startBlockScan = useCallback(async () => {
    if (!activeScanResult?.posts) {
      setCategoryStatus("먼저 스캔을 완료해야 합니다.")
      return
    }

    const requestId = blockScanRequestIdRef.current + 1
    blockScanRequestIdRef.current = requestId
    const initialJob: BlockScanJobState = {
      id: "",
      status: "queued",
      total: scopedPostCount,
      completed: 0,
      failed: 0,
      detectedBlockTemplateKeys: [],
      error: null,
    }

    setBlockScanJob(initialJob)
    setBlockScanError(null)
    setPostExportStep("block-scan")
    setScanPending(true)
    setCategoryStatus("Markdown 옵션을 확인하는 중입니다.")

    try {
      const { jobId } = await postJson<{ jobId: string }>("/api/scan-blocks/jobs", {
        blogIdOrUrl: currentScanTarget,
        scanResult: activeScanResult,
        options,
      })

      let latestJob: BlockScanJobState = {
        ...initialJob,
        id: jobId,
      }
      setBlockScanJob(latestJob)
      await waitForBlockScanPoll()

      while (latestJob.status === "queued" || latestJob.status === "running") {
        if (blockScanRequestIdRef.current !== requestId) {
          return
        }

        latestJob = await fetchJson<BlockScanJobState>(`/api/scan-blocks/jobs/${jobId}`)
        setBlockScanJob(latestJob)

        if (latestJob.status === "queued" || latestJob.status === "running") {
          await waitForBlockScanPoll()
        }
      }

      if (blockScanRequestIdRef.current !== requestId) {
        return
      }

      if (latestJob.status === "failed") {
        const message = latestJob.error ?? "Markdown 옵션 준비에 실패했습니다."
        setBlockScanError(message)
        setCategoryStatus("Markdown 옵션 준비에 실패했습니다.")
        toast.error("Markdown 옵션 준비에 실패했습니다.", {
          description: message,
        })
        return
      }

      const nextScanResult: ScanResult = {
        ...activeScanResult,
        detectedBlockTemplateKeys: latestJob.detectedBlockTemplateKeys,
        detectedBlockTemplateScopeSignature: getBlockDetectionScopeSignature(options),
      }

      setScanCache((current) => ({
        ...current,
        [currentScanTarget]: nextScanResult,
      }))
      setCategoryStatus("Markdown 옵션 준비가 끝났습니다.")

      if (latestJob.detectedBlockTemplateKeys.length > 0) {
        setPostExportStep("markdown-review")
        return
      }

      setPostExportStep(null)
      await startExportWithScanResult(nextScanResult)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      setBlockScanError(message)
      setCategoryStatus("Markdown 옵션 준비에 실패했습니다.")
      toast.error("Markdown 옵션 준비에 실패했습니다.", {
        description: message,
      })
    } finally {
      if (blockScanRequestIdRef.current === requestId) {
        setScanPending(false)
      }
    }
  }, [
    activeScanResult,
    currentScanTarget,
    options,
    scopedPostCount,
    setCategoryStatus,
    setScanCache,
    startExportWithScanResult,
  ])

  const confirmMarkdownAndStartExport = useCallback(async () => {
    if (!activeScanResult) {
      setCategoryStatus("먼저 스캔을 완료해야 합니다.")
      return
    }

    await startExportWithScanResult(activeScanResult)
  }, [activeScanResult, setCategoryStatus, startExportWithScanResult])

  const goBackFromBlockScan = useCallback(() => {
    blockScanRequestIdRef.current += 1
    setScanPending(false)
    setBlockScanError(null)
    setPostExportStep(null)
    setSetupStep("diagnostics-options")
  }, [])

  const {
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
  } = useWizardActions({
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
    startBlockScan,
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
  })

  const { summaryCards, headerStatus, nextButtonLabel, nextDisabled } = getAppShellState({
    currentStep,
    job,
    scopedPostCount,
    activeCategoryCount: activeScanResult?.categories.length ?? 0,
    selectedCount,
    outputDir: normalizeOutputDir(outputDir),
    activeScanResult,
    setupStep,
    scanPending,
    submitting,
    exportDisabled,
    currentScanTarget,
  })

  return (
    <AppShell
      themePreference={themePreference}
      bootstrapping={bootstrapping}
      resumeDialog={resumeDialog}
      resettingResume={resettingResume}
      restoringResume={restoringResume}
      currentStep={currentStep}
      isSetupStep={isSetupStep}
      setupStep={setupStep}
      setupStepIndex={setupStepIndex}
      stepViewRef={stepViewRef}
      headerStatus={headerStatus}
      summaryCards={summaryCards}
      currentScanTarget={currentScanTarget}
      scanPending={scanPending}
      exportDisabled={exportDisabled}
      nextDisabled={nextDisabled}
      submitting={submitting}
      nextButtonLabel={nextButtonLabel}
      onThemeChange={setThemePreference}
      onResetResume={() => void handleResetResume()}
      onRestoreResume={() => void handleRestoreResume()}
      onPrevious={goToPreviousStep}
      onForceScan={() => {
        void ensureScanResult({ forceRefresh: true })
      }}
      onNext={() => {
        void goToNextStep()
      }}
    >
      <AppStepView
        currentStep={currentStep}
        job={job}
        activeJobFilter={activeJobFilter}
        submitting={submitting}
        uploadSubmitting={uploadSubmitting}
        uploadProviders={uploadProviders}
        uploadProviderError={uploadProviderError}
        blogIdOrUrl={blogIdOrUrl}
        outputDir={outputDir}
        scanPending={scanPending}
        blockScanJob={blockScanJob}
        blockScanError={blockScanError}
        scanStatus={scanStatus}
        scanStatusTone={scanStatusTone}
        activeScanResult={activeScanResult}
        selectedCategoryIds={selectedCategoryIds}
        categorySearch={categorySearch}
        categoryStatus={categoryStatus}
        scopedPostCount={scopedPostCount}
        options={options}
        selectedCount={selectedCount}
        defaults={defaults}
        frontmatterValidationErrors={frontmatterValidationErrors}
        linkTemplatePreviewPost={linkTemplatePreviewPost}
        setActiveJobFilter={setActiveJobFilter}
        setCategorySearch={setCategorySearch}
        updateOptions={updateOptions}
        handleBlogInputChange={handleBlogInputChange}
        handleOutputDirChange={handleOutputDirChange}
        handleOutputDirBlur={handleOutputDirBlur}
        handleSelectAllCategories={handleSelectAllCategories}
        handleClearAllCategories={handleClearAllCategories}
        handleCategoryToggle={handleCategoryToggle}
        handleResumeExport={handleResumeExport}
        handleUpload={handleUpload}
        handleRetryBlockScan={startBlockScan}
        handleBackFromBlockScan={goBackFromBlockScan}
        handleConfirmMarkdownReview={confirmMarkdownAndStartExport}
      />
    </AppShell>
  )
}
