import { randomUUID } from "node:crypto"
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises"
import path from "node:path"

import { resolveExportResumePhase } from "@exitpress/domain/export-job/ExportJobState.js"
import { resolveRepoPath } from "@exitpress/engine/infra/node/FilePaths.js"

import type { ScanResult } from "@exitpress/domain/blog/schema/BlogScan.js"
import type {
  ExportJobItem,
  ExportJobState,
} from "@exitpress/domain/export-job/schema/ExportJobState.js"
import type {
  ExportManifest,
  ExportManifestScanResult,
  PostManifestEntry,
} from "@exitpress/domain/export-job/schema/ExportManifest.js"

const manifestFileName = "manifest.json"

const getJobItemId = ({ outputPath, postId }: { outputPath: string | null; postId: string }) =>
  outputPath ?? `failed:${postId}`

const buildPostManifestEntryFromItem = (item: ExportJobItem): PostManifestEntry => ({
  blogKey: item.blogKey,
  sourceId: item.sourceId,
  postId: item.postId,
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
  sourceId,
}: {
  job: ExportJobState
  scanResult: ScanResult | null
  sourceId?: string
}): ExportManifest => ({
  blogKey: scanResult?.blogKey ?? job.request.blogKey,
  sourceId: scanResult?.sourceId ?? sourceId ?? job.request.sourceInput,
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

// Reads a manifest when present and returns null for fresh output directories.
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

// Builds the manifest snapshot used by resume, upload, and UI bootstrap.
export const buildResumableExportManifest = ({
  job,
  scanResult,
  sourceId,
}: {
  job: ExportJobState
  scanResult: ScanResult | null
  sourceId?: string
}): ExportManifest => {
  const baseManifest =
    job.manifest ??
    buildFallbackManifest({
      job,
      scanResult,
      sourceId,
    })
  const persistedScanResult = scanResult
    ? ({
        blogKey: scanResult.blogKey,
        sourceId: scanResult.sourceId,
        totalPostCount: scanResult.totalPostCount,
      } satisfies ExportManifestScanResult)
    : null
  const mergedPosts = mergeManifestPosts({
    manifest: baseManifest,
    items: job.items,
  })

  return {
    ...baseManifest,
    blogKey: scanResult?.blogKey ?? baseManifest.blogKey,
    sourceId: scanResult?.sourceId ?? baseManifest.sourceId,
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

// Writes manifest changes atomically to avoid partial resume state.
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
