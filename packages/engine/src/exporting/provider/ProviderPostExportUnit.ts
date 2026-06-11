import { writeFile } from "node:fs/promises"
import path from "node:path"

import { ensureDir } from "@exitpress/engine/infra/node/util/FilePaths.js"
import { throwIfAborted } from "@exitpress/engine/infra/runtime/AbortOperation.js"
import { renderMarkdownPost } from "@exitpress/engine/markdown/util/renderMarkdownPost.js"

import type {
  BlogCategoryRef,
  BlogPostRef,
  BlogSource,
} from "@exitpress/domain/blog-provider/schema/BlogProvider.js"
import type { CategoryInfo, PostSummary } from "@exitpress/domain/blog/schema/BlogScan.js"
import type { ExportOptions } from "@exitpress/domain/export-options/schema/ExportOptions.js"
import type { BlogProvider } from "@exitpress/engine/blog-provider/BlogProvider.js"

import { AssetStore } from "../assets/AssetStore.js"
import { createPostUploadSummary } from "../manifest/ExportManifestProgress.js"
import { buildMarkdownFilePath, getCategoryForPost } from "../paths/ExportPaths.js"
import { buildPostLinkTargets, createPostLinkResolver } from "../paths/PostLinkRewriter.js"
import { createSuccessPostResult } from "../post/PostExportResult.js"
import { dedupeUploadCandidatesByLocalPath } from "../upload/util/dedupeUploadCandidatesByLocalPath.js"

const mapProviderCategory = (category: BlogCategoryRef): CategoryInfo => ({
  id: category.id,
  name: category.name,
  parentId: category.parentId ?? null,
  postCount: category.postCount,
  isDivider: false,
  isOpen: true,
  path: category.path,
  depth: category.depth,
})

const mapProviderPost = (post: BlogPostRef): PostSummary => ({
  blogId: post.sourceId,
  logNo: post.postId,
  title: post.title,
  publishedAt: post.publishedAt,
  categoryId: post.categoryId,
  categoryName: post.categoryName,
  source: post.sourceUrl,
  thumbnailUrl: post.thumbnailUrl ?? null,
})

const createDefaultBlockTemplateMap = (provider: BlogProvider) =>
  Object.fromEntries(
    provider
      .getBlockTemplateDefinitions()
      .map((definition) => [definition.key, definition.presets[0].template]),
  )

const createProviderAssetDownloader = (
  provider: BlogProvider,
): ConstructorParameters<typeof AssetStore>[0]["downloader"] => {
  const downloadBinary = provider.downloadBinary ?? (async () => {})

  return {
    downloadBinary,
    ...(provider.fetchBinary ? { fetchBinary: provider.fetchBinary } : {}),
  }
}

const mapProviderLinkIdentity = ({ provider, url }: { provider: BlogProvider; url: string }) => {
  const identity = provider.resolvePostLinkIdentity?.(url)

  if (!identity || identity.providerKey !== provider.key) {
    return null
  }

  return {
    blogId: identity.sourceId,
    logNo: identity.postId,
  }
}

export const exportProviderPostUnit = async ({
  provider,
  source,
  outputDir,
  post,
  posts,
  categories,
  options,
  uploadEnabled,
  abortSignal,
}: {
  provider: BlogProvider
  source: BlogSource
  outputDir: string
  post: BlogPostRef
  posts?: BlogPostRef[]
  categories: BlogCategoryRef[]
  options: ExportOptions
  uploadEnabled: boolean
  abortSignal: AbortSignal | null
}) => {
  const mappedPost = mapProviderPost(post)
  const categoryMap = new Map(
    categories.map((category) => [category.id, mapProviderCategory(category)]),
  )
  const category = getCategoryForPost({
    categories: categoryMap,
    categoryId: mappedPost.categoryId,
    categoryName: mappedPost.categoryName,
  })
  const markdownFilePath = buildMarkdownFilePath({
    outputDir,
    post: mappedPost,
    category,
    options,
  })
  const resolveLinkUrl = createPostLinkResolver({
    blogId: source.sourceId,
    markdownFilePath,
    options,
    targets: buildPostLinkTargets({
      outputDir,
      posts: (posts ?? [post]).map(mapProviderPost),
      categories: categories.map(mapProviderCategory),
      options,
    }),
    resolveIdentity: (url) => mapProviderLinkIdentity({ provider, url }),
  })
  const assetStore = new AssetStore({
    outputDir,
    downloader: createProviderAssetDownloader(provider),
    options,
  })
  const content = await provider.loadPostContent({
    source,
    post,
    signal: abortSignal ?? undefined,
  })

  throwIfAborted(abortSignal)

  const parsedPost = provider.parseContent({
    source,
    post,
    content,
    options: {
      blockOutputs: options.blockOutputs,
      assets: options.assets,
      resolveLinkUrl,
    },
  })
  const rendered = await renderMarkdownPost({
    post: mappedPost,
    category,
    parsedPost,
    defaultBlockTemplates: createDefaultBlockTemplateMap(provider),
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
      post: mappedPost,
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
