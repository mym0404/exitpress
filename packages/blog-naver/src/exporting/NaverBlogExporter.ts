import { writeFile } from "node:fs/promises"
import path from "node:path"

import { NaverBlogFetcher } from "@exitpress/blog-naver/integrations/naver-blog/NaverBlogFetcher.js"
import { extractBlogId } from "@exitpress/blog-naver/NaverUrl.js"
import { cloneExportOptions } from "@exitpress/domain/export-options/ExportOptions.js"
import { filterPostsByScope } from "@exitpress/domain/export-scope/ExportScope.js"
import { AssetStore } from "@exitpress/engine/exporting/assets/AssetStore.js"
import {
  createExportProgressState,
  createInitialManifest,
} from "@exitpress/engine/exporting/manifest/ExportManifestProgress.js"
import { getCategoryForPost } from "@exitpress/engine/exporting/paths/ExportPaths.js"
import { buildPostLinkTargets } from "@exitpress/engine/exporting/paths/PostLinkRewriter.js"
import { createFailedPostResult } from "@exitpress/engine/exporting/post/PostExportResult.js"
import {
  completeManifestUploadSummary,
  flushCompletedPostResults,
} from "@exitpress/engine/exporting/workflow/ExportWorkflowProgress.js"
import { ensureDir, resolveRepoPath } from "@exitpress/engine/infra/node/FilePaths.js"
import {
  isAbortOperationError,
  throwIfAborted,
} from "@exitpress/engine/infra/runtime/AbortOperation.js"
import { log } from "@exitpress/engine/infra/runtime/Logger.js"
import { mapConcurrent } from "@exitpress/engine/shared/async/util/AsyncTasks.js"
import { toErrorMessage } from "@exitpress/engine/shared/error/util/toErrorMessage.js"

import type { NaverBlogFetcherCache } from "@exitpress/blog-naver/integrations/naver-blog/NaverBlogFetcher.js"
import type { ScanResult } from "@exitpress/domain/blog/schema/BlogScan.js"
import type { ExportJobItem } from "@exitpress/domain/export-job/schema/ExportJobState.js"
import type { ExportManifest } from "@exitpress/domain/export-job/schema/ExportManifest.js"
import type { ExportRequest } from "@exitpress/domain/export-job/schema/ExportRequest.js"
import type { ProcessedPostResult } from "@exitpress/engine/exporting/post/PostExportResult.js"

import { loadScanAndPosts } from "./ExportScanLoader.js"
import { exportPostUnit } from "./PostExportUnit.js"

const postExportConcurrency = 3

type ExportResumeState = {
  items: ExportJobItem[]
  manifest: ExportManifest | null
}

export class NaverBlogExporter {
  readonly request: ExportRequest
  readonly onProgress: (progress: { total: number; completed: number; failed: number }) => void
  readonly onItem: ((item: ExportJobItem) => void) | null
  readonly cachedScanResult: ScanResult | null
  readonly resumeState: ExportResumeState | null
  readonly writeManifestFile: boolean
  readonly abortSignal: AbortSignal | null
  readonly fetcherCache: NaverBlogFetcherCache | undefined

  constructor({
    request,
    onProgress,
    onItem,
    cachedScanResult,
    resumeState,
    writeManifestFile,
    abortSignal,
    fetcherCache,
  }: {
    request: ExportRequest
    onProgress: (progress: { total: number; completed: number; failed: number }) => void
    onItem?: (item: ExportJobItem) => void
    cachedScanResult?: ScanResult | null
    resumeState?: ExportResumeState | null
    writeManifestFile?: boolean
    abortSignal?: AbortSignal | null
    fetcherCache?: NaverBlogFetcherCache
  }) {
    this.request = request
    this.onProgress = onProgress
    this.onItem = onItem ?? null
    this.cachedScanResult = cachedScanResult ?? null
    this.resumeState = resumeState ?? null
    this.writeManifestFile = writeManifestFile ?? true
    this.abortSignal = abortSignal ?? null
    this.fetcherCache = fetcherCache
  }

  async run() {
    throwIfAborted(this.abortSignal)

    const blogId = extractBlogId(this.request.sourceInput)
    const outputDir = resolveRepoPath(this.request.outputDir)
    const options = cloneExportOptions(this.request.options)
    const fetcher = new NaverBlogFetcher({
      blogId,
      cache: this.fetcherCache,
    })
    const assetStore = new AssetStore({
      outputDir,
      downloader: fetcher,
      options,
    })
    const uploadEnabled = options.assets.imageHandlingMode === "download-and-upload"
    const { scan, posts, reused } = await loadScanAndPosts({
      fetcher,
      sourceId: blogId,
      cachedScanResult: this.cachedScanResult,
    })

    throwIfAborted(this.abortSignal)

    if (reused) {
      log(`이전 스캔 결과 재사용: categories=${scan.categories.length}, posts=${posts.length}`)
    }
    const categoryMap = new Map(scan.categories.map((category) => [category.id, category]))
    const filteredPosts = filterPostsByScope({
      posts,
      categories: scan.categories,
      options,
    })

    await ensureDir(outputDir)
    throwIfAborted(this.abortSignal)
    log(`출력 디렉터리 준비 완료: ${outputDir}`)

    const manifest = createInitialManifest({
      resumeManifest: this.resumeState?.manifest ?? null,
      sourceId: blogId,
      profile: this.request.profile,
      options,
      categories: scan.categories,
      totalPosts: filteredPosts.length,
      uploadEnabled,
    })
    const progressState = createExportProgressState(manifest)
    const completedPostIds = new Set(this.resumeState?.items.map((item) => item.postId) ?? [])
    const pendingPosts = filteredPosts.filter((post) => !completedPostIds.has(post.postId))
    const pendingResults = new Map<number, ProcessedPostResult>()
    let nextResultIndex = 0

    if (posts.length !== scan.totalPostCount) {
      log(
        `목록 수집 수와 API 총계가 다릅니다. collected=${posts.length}, expected=${scan.totalPostCount}`,
      )
    }

    log(`필터 적용 후 내보낼 글 수: ${filteredPosts.length}`)
    if (pendingPosts.length !== filteredPosts.length) {
      log(
        `이전 진행 상태 복구: 완료 ${filteredPosts.length - pendingPosts.length}개, 남음 ${pendingPosts.length}개`,
      )
    }
    const postLinkTargets = buildPostLinkTargets({
      outputDir,
      posts: filteredPosts,
      categories: scan.categories,
      options,
    })

    const flushCompletedResults = () => {
      nextResultIndex = flushCompletedPostResults({
        pendingResults,
        nextResultIndex,
        manifest,
        progressState,
        totalPosts: filteredPosts.length,
        onItem: this.onItem,
        onProgress: this.onProgress,
      })
    }

    await mapConcurrent({
      items: pendingPosts,
      concurrency: postExportConcurrency,
      mapper: async (post, index) => {
        throwIfAborted(this.abortSignal)

        const category = getCategoryForPost({
          categories: categoryMap,
          categoryId: post.categoryId,
          categoryName: post.categoryName,
        })

        try {
          log(`글 수집 시작: ${post.postId} ${post.title}`)
          pendingResults.set(
            index,
            await exportPostUnit({
              sourceId: blogId,
              outputDir,
              post,
              categories: categoryMap,
              options,
              postLinkTargets,
              fetcher,
              assetStore,
              uploadEnabled,
              abortSignal: this.abortSignal,
            }),
          )
        } catch (error) {
          if (isAbortOperationError(error)) {
            throw error
          }

          pendingResults.set(index, createFailedPostResult({ post, category, error }))
          log(`글 export 실패: ${post.postId} (${toErrorMessage(error)})`)
        }

        flushCompletedResults()
      },
    })

    flushCompletedResults()
    completeManifestUploadSummary({
      manifest,
      uploadEnabled,
      progressState,
      totalPosts: filteredPosts.length,
    })

    if (this.writeManifestFile) {
      throwIfAborted(this.abortSignal)
      await writeFile(
        path.join(outputDir, "manifest.json"),
        JSON.stringify(manifest, null, 2),
        "utf8",
      )
      log(`manifest 저장 완료: ${path.join(outputDir, "manifest.json")}`)
    }

    return manifest
  }
}
