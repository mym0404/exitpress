import path from "node:path"
import { writeFile } from "node:fs/promises"

import { cloneExportOptions } from "../../shared/ExportOptions.js"
import { isPostWithinScope } from "../../shared/ExportScope.js"
import type {
  ExportOptions,
  PostSummary,
  ScanResult,
  AstBlock,
} from "../../shared/Types.js"
import { ensureDir, extractBlogId, recreateDir, resolveRepoPath } from "../../shared/Utils.js"
import { NaverBlog } from "../blog/NaverBlog.js"
import { NaverBlogFetcher } from "../fetcher/NaverBlogFetcher.js"
import { renderMarkdownPost } from "../converter/MarkdownRenderer.js"
import { parsePostHtml } from "../parser/PostParser.js"
import { AssetStore } from "./AssetStore.js"
import { buildMarkdownFilePath, getCategoryForPost } from "./ExportPaths.js"
import { buildPostLinkTargets, createSameBlogPostLinkResolver } from "./PostLinkRewriter.js"

export type SinglePostFetcher = {
  scanBlog: () => Promise<ScanResult>
  getAllPosts: () => Promise<PostSummary[]>
  fetchPostHtml: (logNo: string) => Promise<string>
  downloadBinary: (input: {
    sourceUrl: string
    destinationPath: string
  }) => Promise<void>
  fetchBinary: (input: {
    sourceUrl: string
  }) => Promise<{
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
  createFetcher?: (input: {
    blogId: string
  }) => SinglePostFetcher | Promise<SinglePostFetcher>
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

  const category = getCategoryForPost({
    categories: categoryMap,
    categoryId: post.categoryId,
    categoryName: post.categoryName,
  })
  const markdownFilePath = buildMarkdownFilePath({
    outputDir: resolvedOutputDir,
    post,
    category,
    options: resolvedOptions,
  })
  const postLinkTargets = buildPostLinkTargets({
    outputDir: resolvedOutputDir,
    posts: [post],
    categories: scan.categories,
    options: resolvedOptions,
  })
  const resolveLinkUrl = createSameBlogPostLinkResolver({
    blogId: resolvedBlogId,
    markdownFilePath,
    options: resolvedOptions,
    targets: postLinkTargets,
  })
  const html = await fetcher.fetchPostHtml(post.logNo)
  const parsedPost = parsePostHtml({
    html,
    sourceUrl: post.source,
    options: {
      blockOutputs: resolvedOptions.blockOutputs,
      resolveLinkUrl,
    },
  })
  const rendered = await renderMarkdownPost({
    post,
    category,
    parsedPost,
    markdownFilePath,
    options: resolvedOptions,
    resolveAsset: async (input) => assetStore.saveAsset(input),
    resolveLinkUrl,
  })

  await ensureDir(path.dirname(markdownFilePath))
  await writeFile(markdownFilePath, rendered.markdown, "utf8")

  return {
    post,
    markdown: rendered.markdown,
    markdownFilePath,
    blockTypes: parsedPost.blocks.map((block) => block.type),
    assetPaths: rendered.assetRecords
      .map((asset) => asset.relativePath)
      .filter((assetPath): assetPath is string => Boolean(assetPath)),
  }
}
