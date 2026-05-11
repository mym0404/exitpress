import YAML from "yaml"
import type { ParsedPost } from "../domain/ast/Types.js"
import type { CategoryInfo, PostSummary } from "../domain/blog/Types.js"
import type { AssetRecord } from "../domain/export-job/Types.js"
import type { ExportOptions, FrontmatterFieldName } from "../domain/export-options/Types.js"
import type { UnknownRecord } from "../shared/object/UnknownRecord.js"
import { getFrontmatterExportKey } from "../domain/export-options/ExportOptions.js"
import { renderAstMarkdown } from "./AstMarkdownRenderer.js"

const buildFrontmatter = ({
  fields,
  aliases,
  values,
}: {
  fields: Record<FrontmatterFieldName, boolean>
  aliases: Record<FrontmatterFieldName, string>
  values: Record<FrontmatterFieldName, unknown>
}) => {
  const frontmatter: UnknownRecord = {}

  for (const [key, enabled] of Object.entries(fields) as Array<[FrontmatterFieldName, boolean]>) {
    if (!enabled) {
      continue
    }

    const value = values[key]

    if (value === undefined || value === null) {
      continue
    }

    if (Array.isArray(value) && value.length === 0) {
      continue
    }

    const alias = getFrontmatterExportKey({
      fieldName: key,
      alias: aliases[key],
    })

    frontmatter[alias] = value
  }

  return frontmatter
}

export const renderMarkdownPost = async ({
  post,
  category,
  parsedPost,
  markdownFilePath,
  options,
  resolveAsset,
  resolveLinkUrl,
}: {
  post: PostSummary
  category: CategoryInfo
  parsedPost: ParsedPost
  markdownFilePath: string
  options: ExportOptions
  resolveAsset: (input: {
    kind: "image" | "thumbnail"
    sourceUrl: string
    markdownFilePath: string
  }) => Promise<AssetRecord>
  resolveLinkUrl?: (url: string) => string
}) => {
  const assetRecords: AssetRecord[] = []
  let postListThumbnailPath: string | null = null
  let firstBodyThumbnailPath: string | null = null

  const resolveAssetPath = async ({
    kind,
    sourceUrl,
  }: {
    kind: "image" | "thumbnail"
    sourceUrl: string
  }): Promise<string | null> => {
    try {
      const assetRecord = await resolveAsset({
        kind,
        sourceUrl,
        markdownFilePath,
      })

      if (
        !assetRecords.some(
          (existing) =>
            existing.reference === assetRecord.reference &&
            existing.storageMode === assetRecord.storageMode,
        )
      ) {
        assetRecords.push(assetRecord)
      }

      return assetRecord.reference
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      if (options.assets.downloadFailureMode === "fail") {
        throw new Error(`자산 다운로드 실패: ${sourceUrl} (${message})`)
      }

      return options.assets.downloadFailureMode === "omit" ? null : sourceUrl
    }
  }

  if (options.assets.thumbnailSource === "post-list-first" && post.thumbnailUrl) {
    postListThumbnailPath = await resolveAssetPath({
      kind: "thumbnail",
      sourceUrl: post.thumbnailUrl,
    })
  }

  const maybeRecordBodyThumbnail = (pathValue: string | null) => {
    if (!firstBodyThumbnailPath && pathValue) {
      firstBodyThumbnailPath = pathValue
    }
  }

  const body = await renderAstMarkdown({
    blocks: parsedPost.blocks,
    options,
    resolveAssetPath,
    resolveLinkUrl,
    recordBodyThumbnail: maybeRecordBodyThumbnail,
  })

  const thumbnailPath =
    options.assets.thumbnailSource === "none"
      ? null
      : options.assets.thumbnailSource === "first-body-image"
        ? firstBodyThumbnailPath
        : (postListThumbnailPath ?? firstBodyThumbnailPath)

  const frontmatterValues: Record<FrontmatterFieldName, unknown> = {
    title: post.title,
    source: post.source,
    blogId: post.blogId,
    logNo: Number(post.logNo),
    publishedAt: post.publishedAt,
    category: category.name,
    categoryPath: category.path,
    tags: parsedPost.tags,
    thumbnail: thumbnailPath,
    exportedAt: new Date().toISOString(),
    assetPaths: assetRecords
      .map((asset) => asset.relativePath)
      .filter((assetPath): assetPath is string => Boolean(assetPath)),
  }

  const frontmatter = options.frontmatter.enabled
    ? buildFrontmatter({
        fields: options.frontmatter.fields,
        aliases: options.frontmatter.aliases,
        values: frontmatterValues,
      })
    : null

  const markdown = frontmatter ? `---\n${YAML.stringify(frontmatter)}---\n\n${body}\n` : `${body}\n`

  return {
    markdown,
    assetRecords,
  }
}
