import type { AstBlock } from "../../domain/ast/Types.js"
import type { PostSummary } from "../../domain/blog/Types.js"
import type { ExportOptions } from "../../domain/export-options/Types.js"
import type { NaverBlogFetcher } from "../../integrations/naver-blog/NaverBlogFetcher.js"
import type { AssetStore } from "../assets/AssetStore.js"
import type { buildPostLinkTargets } from "../paths/PostLinkRewriter.js"
import { ensureDir } from "../../infra/node/FilePathUtils.js"
import { throwIfAborted } from "../../infra/runtime/AbortOperation.js"
import { renderMarkdownPost } from "../../markdown/MarkdownRenderer.js"
import { parsePostHtml } from "../../parsing/naver-blog/core/PostParser.js"
import { createPostUploadSummary } from "../manifest/ExportManifestProgress.js"
import { buildMarkdownFilePath, getCategoryForPost } from "../paths/ExportPaths.js"
import { createSameBlogPostLinkResolver } from "../paths/PostLinkRewriter.js"
import { dedupeUploadCandidatesByLocalPath } from "../upload/UploadCandidateUtils.js"
import { createSuccessPostResult } from "./PostExportResult.js"
import { writeFile } from "node:fs/promises"
import path from "node:path"

export const exportPostUnit = async ({
  blogId,
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
  blogId: string
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
  const resolveLinkUrl = createSameBlogPostLinkResolver({
    blogId,
    markdownFilePath,
    options,
    targets: postLinkTargets,
  })
  const html = await fetcher.fetchPostHtml(post.logNo)

  throwIfAborted(abortSignal)

  const parsedPost = parsePostHtml({
    html,
    sourceUrl: post.source,
    options: {
      blockOutputs: options.blockOutputs,
      resolveLinkUrl,
    },
  })
  const rendered = await renderMarkdownPost({
    post,
    category,
    parsedPost,
    markdownFilePath,
    options,
    resolveAsset: async (input) => assetStore.saveAsset(input),
    resolveLinkUrl,
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
    blockTypes: parsedPost.blocks.map((block): AstBlock["type"] => block.type),
    assetPaths,
  }
}
