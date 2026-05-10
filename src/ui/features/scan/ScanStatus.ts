import type { ScanResult } from "../../../modules/blog/Types.js"
import { DEFAULT_OUTPUT_DIR } from "../../../modules/exporter/ExportDefaults.js"

export const defaultOutputDir = DEFAULT_OUTPUT_DIR
export const defaultScanStatus = "블로그를 아직 스캔하지 않았습니다."
export const defaultCategoryStatus = "스캔 후 카테고리를 선택할 수 있습니다."
export const restoredScanStatus = "이전 작업 상태를 복구했습니다."
export const restoredCategoryStatus = "이전 작업 상태를 복구했습니다."
export const restoredCategoryFallbackStatus = "복구된 작업 상태를 확인하세요."
export const readyCategoryStatus = "내보낼 카테고리를 선택하세요."
export const resumeLookupErrorStatus = "작업 상태 확인에 실패했습니다. 다시 시도하세요."
export const defaultScanLoadingStatus = "카테고리를 스캔하는 중입니다."
export const forceScanLoadingStatus = "캐시를 무효화하고 카테고리를 다시 불러오는 중입니다."

export const normalizeOutputDir = (value: string) => value.trim() || defaultOutputDir

export const resolveScopedCategoryIds = ({
  categories,
  currentCategoryIds,
}: {
  categories: ScanResult["categories"]
  currentCategoryIds: number[]
}) => {
  const validCategoryIds = currentCategoryIds.filter((categoryId) =>
    categories.some((category) => category.id === categoryId),
  )

  return validCategoryIds.length > 0 ? validCategoryIds : categories.map((category) => category.id)
}
