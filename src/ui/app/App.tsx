import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { ScanCacheMap } from "../../domain/blog/Types.js"
import type { ExportOptions } from "../../domain/export-options/Types.js"
import type { ThemePreference } from "../../domain/preferences/ThemePreference.js"
import type { SetupStep, WizardStep } from "../features/common/shell/WizardFlow.js"
import type { ResumeDialogState } from "../features/resume/ResumeState.js"
import {
  sanitizePersistedExportOptions,
  validateFrontmatterAliases,
} from "../../domain/export-options/ExportOptions.js"
import { filterPostsByScope } from "../../exporting/workflow/ExportScope.js"
import { useBeforeUnloadWarning } from "../features/common/hooks/UseBeforeUnloadWarning.js"
import { useBootstrapDefaults } from "../features/common/hooks/UseBootstrapDefaults.js"
import { useBrandMarkScroll } from "../features/common/hooks/UseBrandMarkScroll.js"
import { useExportSettingsSync } from "../features/common/hooks/UseExportSettingsSync.js"
import { useStepScroll } from "../features/common/hooks/UseStepScroll.js"
import { useThemePreference } from "../features/common/hooks/UseThemePreference.js"
import { useWizardActions } from "../features/common/hooks/UseWizardActions.js"
import {
  getPersistedUiStateSignature,
  resolveWizardStep,
  setupSteps,
} from "../features/common/shell/WizardFlow.js"
import { shouldLoadUploadProviders } from "../features/job-results/ExportJobFallback.js"
import { setExportJobPollingConfig, useExportJob } from "../features/job-results/UseExportJob.js"
import { useJobNotifications } from "../features/job-results/UseJobNotifications.js"
import { useUploadProvidersCatalog } from "../features/job-results/UseUploadProvidersCatalog.js"
import {
  defaultCategoryStatus,
  defaultOutputDir,
  defaultScanStatus,
  normalizeOutputDir,
} from "../features/scan/ScanStatus.js"
import { fallbackDefaults } from "./AppDefaults.js"
import { useAppResumeBootstrap } from "./AppResumeBootstrap.js"
import { AppShell } from "./AppShell.js"
import { getAppShellState, shouldWarnBeforeLeavingApp } from "./AppShellState.js"
import { AppStepView } from "./AppStepView.js"

export const App = () => {
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
  const currentStep = useMemo(
    () =>
      resolveWizardStep({
        setupStep,
        jobStatus: job?.status,
        submitting,
        uploadSubmitting,
      }) as WizardStep,
    [job?.status, setupStep, submitting, uploadSubmitting],
  )
  const isSetupStep = currentStep === setupStep

  const { uploadProviders, uploadProviderError } = useUploadProvidersCatalog({
    jobId: job?.id,
    shouldLoad: shouldLoadUploadProviders(job),
  })

  useThemePreference(themePreference)
  useBrandMarkScroll()
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
      />
    </AppShell>
  )
}
