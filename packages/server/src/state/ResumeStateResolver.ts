import type { ScanCacheMap, ScanResult } from "@exitpress/domain/blog/Types.js"
import type {
  ExportJobState,
  ExportManifestScanResult,
} from "@exitpress/domain/export-job/Types.js"

const toTimestamp = (value: string | null | undefined) => {
  if (!value) {
    return 0
  }

  const timestamp = Date.parse(value)

  return Number.isNaN(timestamp) ? 0 : timestamp
}

export const getJobActivityTimestamp = (job: ExportJobState) =>
  Math.max(
    toTimestamp(job.createdAt),
    toTimestamp(job.startedAt),
    toTimestamp(job.finishedAt),
    toTimestamp(job.manifest?.job?.updatedAt),
    ...job.logs.map((entry) => toTimestamp(entry.timestamp)),
    ...job.items.map((item) => toTimestamp(item.updatedAt)),
  )

export const getManifestJobTimestamp = (updatedAt: string) => toTimestamp(updatedAt)

export const resolveResumedScanResult = ({
  manifestBlogId,
  manifestCategories,
  manifestTotalPosts,
  manifestScanResult,
  cachedScans,
}: {
  manifestBlogId: string
  manifestCategories: ScanResult["categories"]
  manifestTotalPosts: number
  manifestScanResult: ExportManifestScanResult | null
  cachedScans: ScanCacheMap
}) => {
  const blogId = manifestScanResult?.blogId ?? manifestBlogId
  const totalPostCount = manifestScanResult?.totalPostCount || manifestTotalPosts
  const minimalScanResult: ScanResult = {
    blogId,
    totalPostCount,
    categories: manifestCategories,
  }
  const cachedScanResult = cachedScans[blogId]

  if (!cachedScanResult) {
    return minimalScanResult
  }

  return {
    ...cachedScanResult,
    blogId,
    totalPostCount: totalPostCount || cachedScanResult.totalPostCount,
    categories:
      cachedScanResult.categories.length > 0 ? cachedScanResult.categories : manifestCategories,
  } satisfies ScanResult
}
