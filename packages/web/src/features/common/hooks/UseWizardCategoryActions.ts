import { useCallback } from "react"

import type { WizardScanActionsArgs } from "./schema/WizardActions.js"

import { toast } from "../../../components/primer/PrimerToast.js"
import { toggleCategorySelection } from "../../scan/CategorySelection.js"

export const useWizardCategoryActions = ({
  outputDirBaseline,
  activeScanResult,
  updateOptions,
  setOutputDir,
}: Pick<
  WizardScanActionsArgs,
  "outputDirBaseline" | "activeScanResult" | "updateOptions" | "setOutputDir"
>) => {
  const handleOutputDirChange = useCallback(
    (value: string) => {
      setOutputDir(value)
    },
    [setOutputDir],
  )

  const handleOutputDirBlur = useCallback(() => {
    setOutputDir((current) => current.trim() || outputDirBaseline)
  }, [outputDirBaseline, setOutputDir])

  const handleCategoryToggle = useCallback(
    (categoryId: number, checked: boolean) => {
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
    },
    [activeScanResult, updateOptions],
  )

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

  return {
    handleOutputDirChange,
    handleOutputDirBlur,
    handleCategoryToggle,
    handleSelectAllCategories,
    handleClearAllCategories,
  }
}
