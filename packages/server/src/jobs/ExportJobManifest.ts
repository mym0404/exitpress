import { randomUUID } from "node:crypto"
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises"
import path from "node:path"

import { extractBlogId } from "@exitpress/domain/blog/NaverUrl.js"
import { resolveExportResumePhase } from "@exitpress/domain/export-job/ExportJobState.js"
import { resolveRepoPath } from "@exitpress/engine/infra/node/FilePathUtils.js"

import type { ScanResult } from "@exitpress/domain/blog/Types.js"
import type {
  ExportJobItem,
  ExportJobState,
  ExportManifest,
  ExportManifestScanResult,
  PostManifestEntry,
} from "@exitpress/domain/export-job/Types.js"

const manifestFileName = "manifest.json"

const getJobItemId = ({ outputPath, logNo }: { outputPath: string | null; logNo: string }) =>
  outputPath ?? `failed:${logNo}`

const buildPostManifestEntryFromItem = (item: ExportJobItem): PostManifestEntry => ({
  logNo: item.logNo,
  title: item.title,
  source: item.source,
  category: item.category,
  status: item.status,
  outputPath: item.outputPath,
  assetPaths: item.assetPaths,
  upload: item.upload,
  error: item.error,
})

const mergeManifestPosts = ({
  manifest,
  items,
}: {
  manifest: ExportManifest
  items: ExportJobItem[]
}) => {
  if (items.length === 0) {
    return manifest.posts
  }

  const postById = new Map(manifest.posts.map((post) => [getJobItemId(post), post]))

  return items.map((item) => {
    const existingPost = postById.get(item.id)

    return {
      ...existingPost,
      ...buildPostManifestEntryFromItem(item),
    } satisfies PostManifestEntry
  })
}

const buildFallbackManifest = ({
  job,
  scanResult,
}: {
  job: ExportJobState
  scanResult: ScanResult | null
}): ExportManifest => ({
  blogId: scanResult?.blogId ?? extractBlogId(job.request.blogIdOrUrl) ?? job.request.blogIdOrUrl,
  profile: job.request.profile,
  options: job.request.options,
  selectedCategoryIds: job.request.options.scope.categoryIds,
  startedAt: job.startedAt ?? job.createdAt,
  finishedAt: job.finishedAt,
  totalPosts: job.progress.total,
  successCount: job.progress.completed,
  failureCount: job.progress.failed,
  upload: job.upload,
  categories: scanResult?.categories ?? [],
  posts: job.items.map((item) => buildPostManifestEntryFromItem(item)),
})

const getExportManifestPath = (outputDir: string) =>
  path.join(resolveRepoPath(outputDir), manifestFileName)

export const readExportManifest = async (outputDir: string) => {
  try {
    const raw = await readFile(getExportManifestPath(outputDir), "utf8")

    return JSON.parse(raw) as ExportManifest
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return null
    }

    throw error
  }
}

export const buildResumableExportManifest = ({
  job,
  scanResult,
}: {
  job: ExportJobState
  scanResult: ScanResult | null
}): ExportManifest => {
  const baseManifest =
    job.manifest ??
    buildFallbackManifest({
      job,
      scanResult,
    })
  const persistedScanResult = scanResult
    ? ({
        blogId: scanResult.blogId,
        totalPostCount: scanResult.totalPostCount,
      } satisfies ExportManifestScanResult)
    : null
  const mergedPosts = mergeManifestPosts({
    manifest: baseManifest,
    items: job.items,
  })

  return {
    ...baseManifest,
    blogId: scanResult?.blogId ?? baseManifest.blogId,
    profile: job.request.profile,
    options: job.request.options,
    selectedCategoryIds: job.request.options.scope.categoryIds,
    startedAt: job.startedAt ?? baseManifest.startedAt ?? job.createdAt,
    finishedAt: job.finishedAt,
    totalPosts: job.progress.total || baseManifest.totalPosts,
    successCount: job.progress.completed,
    failureCount: job.progress.failed,
    upload: job.upload,
    categories: scanResult?.categories ?? baseManifest.categories,
    posts: mergedPosts,
    job: {
      id: job.id,
      phase: resolveExportResumePhase(job.status),
      request: job.request,
      status: job.status,
      createdAt: job.createdAt,
      startedAt: job.startedAt,
      finishedAt: job.finishedAt,
      updatedAt: new Date().toISOString(),
      progress: job.progress,
      upload: job.upload,
      error: job.error,
      scanResult: persistedScanResult,
      summary: {
        status: job.status,
        outputDir: job.request.outputDir,
        totalPosts: job.progress.total,
        completedCount: job.progress.completed,
        failedCount: job.progress.failed,
        uploadCandidateCount: job.upload.candidateCount,
        uploadedCount: job.upload.uploadedCount,
      },
    },
  }
}

export const writeExportManifest = async ({
  outputDir,
  manifest,
}: {
  outputDir: string
  manifest: ExportManifest
}) => {
  const manifestPath = getExportManifestPath(outputDir)
  const tempPath = `${manifestPath}.${randomUUID()}.tmp`

  await mkdir(path.dirname(manifestPath), { recursive: true })
  await writeFile(tempPath, JSON.stringify(manifest, null, 2), "utf8")

  try {
    await rename(tempPath, manifestPath)
  } catch (error) {
    await rm(tempPath, { force: true })
    throw error
  }
}
