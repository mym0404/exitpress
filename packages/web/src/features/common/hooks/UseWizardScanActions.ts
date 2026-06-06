import { useCallback } from "react"

import type { ScanResult } from "@exitpress/domain/blog/Types.js"

import type { ExportResumeLookupResponse } from "../../../lib/Api.js"

import type { WizardScanActionsArgs } from "./UseWizardActionTypes.js"

import { toast } from "../../../components/ui/Sonner.js"
import { postJson } from "../../../lib/Api.js"
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

import { useWizardCategoryActions } from "./UseWizardCategoryActions.js"

export const useWizardScanActions = ({
  currentScanTarget,
  outputDir,
  outputDirBaseline,
  activeScanResult,
  scanCache,
  updateOptions,
  setResumeDialog,
  setScanCache,
  setScanPending,
  setCategoryStatus,
  setCategorySearch,
  setSetupStep,
  setBlogIdOrUrl,
  setOutputDir,
  setNeutralScanStatus,
  setErrorScanStatus,
  setOptions,
}: WizardScanActionsArgs) => {
  const categoryActions = useWizardCategoryActions({
    outputDirBaseline,
    activeScanResult,
    updateOptions,
    setOutputDir,
  })

  const ensureScanResult = useCallback(
    async ({
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
    },
    [
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
    ],
  )

  const handleBlogInputChange = useCallback(
    (value: string) => {
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
    },
    [
      scanCache,
      setBlogIdOrUrl,
      setCategorySearch,
      setCategoryStatus,
      setNeutralScanStatus,
      setOptions,
      setSetupStep,
    ],
  )

  return {
    ensureScanResult,
    handleBlogInputChange,
    ...categoryActions,
  }
}
