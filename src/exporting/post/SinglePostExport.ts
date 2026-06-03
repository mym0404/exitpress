import type { AstBlock } from "../../domain/ast/Types.js"
import type { PostSummary, ScanResult } from "../../domain/blog/Types.js"
import type { ExportOptions } from "../../domain/export-options/Types.js"

import { extractBlogId } from "../../domain/blog/NaverUrl.js"
import { cloneExportOptions } from "../../domain/export-options/ExportOptions.js"
import { recreateDir, resolveRepoPath } from "../../infra/node/FilePathUtils.js"
import { NaverBlogFetcher } from "../../integrations/naver-blog/NaverBlogFetcher.js"
import { NaverBlog } from "../../parsing/naver-blog/NaverBlog.js"
import { AssetStore } from "../assets/AssetStore.js"
import { buildPostLinkTargets } from "../paths/PostLinkRewriter.js"
import { isPostWithinScope } from "../workflow/ExportScope.js"

import { exportPostUnit } from "./PostExportUnit.js"

export type SinglePostFetcher = {
  scanBlog: () => Promise<ScanResult>
  getAllPosts: () => Promise<PostSummary[]>
  fetchPostHtml: (logNo: string) => Promise<string>
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
  blockTypes: AstBlock["type"][]
  assetPaths: string[]
}

export const exportSinglePost = async ({
  blogId,
  logNo,
  outputDir,
  options,
  createFetcher,
}: {
  blogId: string
  logNo: string
  outputDir: string
  options: ExportOptions
  createFetcher?: (input: { blogId: string }) => SinglePostFetcher | Promise<SinglePostFetcher>
}): Promise<ExportSinglePostDiagnostics> => {
  const resolvedOutputDir = resolveRepoPath(outputDir)
  const resolvedOptions = cloneExportOptions(options, {
    blockOutputDefinitions: new NaverBlog().getBlockOutputDefinitions(),
  })
  const resolvedBlogId = extractBlogId(blogId)
  const fetcher = createFetcher
    ? await createFetcher({
        blogId: resolvedBlogId,
      })
    : new NaverBlogFetcher({
        blogId: resolvedBlogId,
      })
  const assetStore = new AssetStore({
    outputDir: resolvedOutputDir,
    downloader: fetcher,
    options: resolvedOptions,
  })

  const scan = await fetcher.scanBlog()
  const posts = await fetcher.getAllPosts()
  const categoryMap = new Map(scan.categories.map((category) => [category.id, category]))
  const post = posts.find((entry) => entry.logNo === logNo)

  if (!post) {
    throw new Error(`공개 글 메타데이터를 찾을 수 없습니다: ${resolvedBlogId}/${logNo}`)
  }

  if (!isPostWithinScope({ post, categories: scan.categories, options: resolvedOptions })) {
    throw new Error(`요청한 글이 scope 범위 밖입니다: ${resolvedBlogId}/${logNo}`)
  }

  await recreateDir(resolvedOutputDir)

  const postLinkTargets = buildPostLinkTargets({
    outputDir: resolvedOutputDir,
    posts: [post],
    categories: scan.categories,
    options: resolvedOptions,
  })
  const result = await exportPostUnit({
    blogId: resolvedBlogId,
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
    blockTypes: result.blockTypes,
    assetPaths: result.assetPaths,
  }
}
