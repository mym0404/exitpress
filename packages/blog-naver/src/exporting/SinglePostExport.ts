import { NaverBlogFetcher } from "@exitpress/blog-naver/integrations/naver-blog/NaverBlogFetcher.js"
import { extractBlogId } from "@exitpress/blog-naver/NaverUrl.js"
import { cloneExportOptions } from "@exitpress/domain/export-options/ExportOptions.js"
import { isPostWithinScope } from "@exitpress/domain/export-scope/ExportScope.js"
import { AssetStore } from "@exitpress/engine/exporting/assets/AssetStore.js"
import { buildPostLinkTargets } from "@exitpress/engine/exporting/paths/PostLinkRewriter.js"
import { recreateDir, resolveRepoPath } from "@exitpress/engine/infra/node/FilePaths.js"

import type { PostSummary, ScanResult } from "@exitpress/domain/blog/schema/BlogScan.js"
import type { ExportOptions } from "@exitpress/domain/export-options/schema/ExportOptions.js"

import { exportPostUnit } from "./PostExportUnit.js"

export type SinglePostFetcher = {
  scanBlog: () => Promise<ScanResult>
  getAllPosts: () => Promise<PostSummary[]>
  fetchPostHtml: (postId: string) => Promise<string>
  downloadBinary: (input: { sourceUrl: string; destinationPath: string }) => Promise<void>
  fetchBinary: (input: { sourceUrl: string }) => Promise<{
    bytes: Buffer
    contentType: string | null
  }>
}

type ExportSinglePostDiagnostics = {
  post: PostSummary
  markdown: string
  markdownFilePath: string
  blockIds: string[]
  assetPaths: string[]
}

export const exportSinglePost = async ({
  sourceId,
  postId,
  outputDir,
  options,
  createFetcher,
}: {
  sourceId: string
  postId: string
  outputDir: string
  options: ExportOptions
  createFetcher?: (input: { sourceId: string }) => SinglePostFetcher | Promise<SinglePostFetcher>
}): Promise<ExportSinglePostDiagnostics> => {
  const resolvedOutputDir = resolveRepoPath(outputDir)
  const resolvedOptions = cloneExportOptions(options)
  const resolvedSourceId = extractBlogId(sourceId)
  const fetcher = createFetcher
    ? await createFetcher({
        sourceId: resolvedSourceId,
      })
    : new NaverBlogFetcher({
        blogId: resolvedSourceId,
      })
  const assetStore = new AssetStore({
    outputDir: resolvedOutputDir,
    downloader: fetcher,
    options: resolvedOptions,
  })

  const scan = await fetcher.scanBlog()
  const posts = await fetcher.getAllPosts()
  const categoryMap = new Map(scan.categories.map((category) => [category.id, category]))
  const post = posts.find((entry) => entry.postId === postId)

  if (!post) {
    throw new Error(`공개 글 메타데이터를 찾을 수 없습니다: ${resolvedSourceId}/${postId}`)
  }

  if (!isPostWithinScope({ post, categories: scan.categories, options: resolvedOptions })) {
    throw new Error(`요청한 글이 scope 범위 밖입니다: ${resolvedSourceId}/${postId}`)
  }

  await recreateDir(resolvedOutputDir)

  const postLinkTargets = buildPostLinkTargets({
    outputDir: resolvedOutputDir,
    posts: [post],
    categories: scan.categories,
    options: resolvedOptions,
  })
  const result = await exportPostUnit({
    sourceId: resolvedSourceId,
    outputDir: resolvedOutputDir,
    post,
    categories: categoryMap,
    options: resolvedOptions,
    postLinkTargets,
    fetcher,
    assetStore,
    uploadEnabled: resolvedOptions.assets.imageHandlingMode === "download-and-upload",
    abortSignal: null,
  })

  return {
    post,
    markdown: result.markdown,
    markdownFilePath: result.markdownFilePath,
    blockIds: result.blockIds,
    assetPaths: result.assetPaths,
  }
}
