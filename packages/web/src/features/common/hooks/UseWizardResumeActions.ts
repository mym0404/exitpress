import { sanitizePersistedExportOptions } from "@exitpress/domain/export-options/ExportOptions.js"
import { useCallback } from "react"

import type { ExportBootstrapResponse, ExportResumeLookupResponse } from "../../../lib/Api.js"

import type { UseWizardActionsArgs } from "./schema/WizardActions.js"

import { toast } from "../../../components/primer/PrimerToast.js"
import { postJson } from "../../../lib/Api.js"
import { getPersistedUiStateSignature } from "../shell/WizardFlow.js"

type UseWizardResumeActionsArgs = Pick<
  UseWizardActionsArgs,
  | "resumeDialog"
  | "resumeJob"
  | "hydrateJob"
  | "applyResumedState"
  | "applyBootstrapState"
  | "setResumeDialog"
  | "setResettingResume"
  | "setRestoringResume"
  | "latestPersistedOptionsRef"
  | "latestThemePreferenceRef"
  | "persistedUiStateSignatureRef"
> & {
  ensureScanResult: (options?: { skipResumeLookup?: boolean }) => Promise<boolean>
}

export const useWizardResumeActions = ({
  resumeDialog,
  resumeJob,
  hydrateJob,
  applyResumedState,
  applyBootstrapState,
  setResumeDialog,
  setResettingResume,
  setRestoringResume,
  latestPersistedOptionsRef,
  latestThemePreferenceRef,
  persistedUiStateSignatureRef,
  ensureScanResult,
}: UseWizardResumeActionsArgs) => {
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
        throw new Error("불러올 작업 상태를 찾지 못했습니다.")
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
        description: "이전 상태부터 이어서 내보냅니다.",
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
        latestPersistedOptionsRef.current = sanitizePersistedExportOptions(nextDefaults.options)
        latestThemePreferenceRef.current = nextDefaults.themePreference
        persistedUiStateSignatureRef.current = getPersistedUiStateSignature({
          options: nextDefaults.options,
          themePreference: nextDefaults.themePreference,
        })
        applyBootstrapState(nextDefaults)
      } else {
        setResumeDialog(null)
        hydrateJob(null)
        await ensureScanResult({ skipResumeLookup: true })
      }

      toast.success("이전 작업을 초기화했습니다.", {
        description: `${resumeDialog.resumeSummary.outputDir} 작업 내역을 삭제했습니다.`,
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

  return {
    handleRestoreResume,
    handleResumeExport,
    handleResetResume,
  }
}
