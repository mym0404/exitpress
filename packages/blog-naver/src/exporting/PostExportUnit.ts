import { writeFile } from "node:fs/promises"
import path from "node:path"

import { parsePostHtml } from "@exitpress/blog-naver/parsing/naver-blog/core/PostParser.js"
import { createNaverBlogDefaultBlockTemplateMap } from "@exitpress/blog-naver/parsing/naver-blog/NaverBlog.js"
import { createPostUploadSummary } from "@exitpress/engine/exporting/manifest/ExportManifestProgress.js"
import {
  buildMarkdownFilePath,
  getCategoryForPost,
} from "@exitpress/engine/exporting/paths/ExportPaths.js"
import { createPostLinkResolver } from "@exitpress/engine/exporting/paths/PostLinkRewriter.js"
import { createSuccessPostResult } from "@exitpress/engine/exporting/post/PostExportResult.js"
import { dedupeUploadCandidatesByLocalPath } from "@exitpress/engine/exporting/upload/util/dedupeUploadCandidatesByLocalPath.js"
import { ensureDir } from "@exitpress/engine/infra/node/FilePaths.js"
import { throwIfAborted } from "@exitpress/engine/infra/runtime/AbortOperation.js"
import { renderMarkdownPost } from "@exitpress/engine/markdown/util/renderMarkdownPost.js"

import type { NaverBlogFetcher } from "@exitpress/blog-naver/integrations/naver-blog/NaverBlogFetcher.js"
import type { PostSummary } from "@exitpress/domain/blog/schema/BlogScan.js"
import type { ExportOptions } from "@exitpress/domain/export-options/schema/ExportOptions.js"
import type { AssetStore } from "@exitpress/engine/exporting/assets/AssetStore.js"
import type { buildPostLinkTargets } from "@exitpress/engine/exporting/paths/PostLinkRewriter.js"

import { extractNaverBlogPostIdentity } from "../NaverUrl.js"

export const exportPostUnit = async ({
  sourceId,
  outputDir,
  post,
  categories,
  options,
  postLinkTargets,
  fetcher,
  assetStore,
  uploadEnabled,
  abortSignal,
}: {
  sourceId: string
  outputDir: string
  post: PostSummary
  categories: Parameters<typeof getCategoryForPost>[0]["categories"]
  options: ExportOptions
  postLinkTargets: ReturnType<typeof buildPostLinkTargets>
  fetcher: Pick<NaverBlogFetcher, "fetchPostHtml">
  assetStore: AssetStore
  uploadEnabled: boolean
  abortSignal: AbortSignal | null
}) => {
  const category = getCategoryForPost({
    categories,
    categoryId: post.categoryId,
    categoryName: post.categoryName,
  })
  const markdownFilePath = buildMarkdownFilePath({
    outputDir,
    post,
    category,
    options,
  })
  const resolveLinkUrl = createPostLinkResolver({
    blogKey: "naver",
    sourceId,
    markdownFilePath,
    options,
    targets: postLinkTargets,
    resolveIdentity: (url) => {
      const identity = extractNaverBlogPostIdentity(url)

      return identity ? { blogKey: "naver", ...identity } : null
    },
  })
  const html = await fetcher.fetchPostHtml(post.postId)

  throwIfAborted(abortSignal)

  const parsedPost = parsePostHtml({
    html,
    sourceUrl: post.source,
    options: {
      blockOutputs: options.blockOutputs,
      assets: options.assets,
      resolveLinkUrl,
    },
  })
  const rendered = await renderMarkdownPost({
    post,
    category,
    parsedPost,
    defaultBlockTemplates: createNaverBlogDefaultBlockTemplateMap(),
    markdownFilePath,
    options,
    resolveAsset: async (input) => assetStore.saveAsset(input),
  })

  throwIfAborted(abortSignal)
  await ensureDir(path.dirname(markdownFilePath))
  throwIfAborted(abortSignal)
  await writeFile(markdownFilePath, rendered.markdown, "utf8")

  const assetPaths = rendered.assetRecords
    .map((asset) => asset.relativePath)
    .filter((assetPath): assetPath is string => Boolean(assetPath))
  const uploadCandidates = uploadEnabled
    ? dedupeUploadCandidatesByLocalPath(
        rendered.assetRecords
          .map((asset) => asset.uploadCandidate)
          .filter((candidate): candidate is NonNullable<typeof candidate> => Boolean(candidate)),
      )
    : []

  return {
    ...createSuccessPostResult({
      post,
      category,
      outputDir,
      markdownFilePath,
      assetPaths,
      upload: createPostUploadSummary(uploadCandidates),
    }),
    markdown: rendered.markdown,
    markdownFilePath,
    blockIds: [...new Set(parsedPost.blocks.map((block) => block.blockId))],
    assetPaths,
  }
}
