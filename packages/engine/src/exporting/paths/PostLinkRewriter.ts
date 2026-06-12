import {
  applyPostTemplate as applySameBlogPostCustomUrlTemplate,
  buildPostTemplateValues as buildSameBlogPostTemplateValues,
} from "@exitpress/domain/export-paths/PostPathTemplate.js"

import type { CategoryInfo, PostSummary } from "@exitpress/domain/blog/schema/BlogScan.js"
import type { ExportOptions } from "@exitpress/domain/export-options/schema/ExportOptions.js"

import { relativePathFrom } from "../../infra/node/FilePaths.js"

import { buildMarkdownFilePath, getCategoryForPost } from "./ExportPaths.js"

type PostLinkTarget = {
  markdownFilePath: string
  templateValues: ReturnType<typeof buildSameBlogPostTemplateValues>
}

type SameBlogPostIdentity = {
  sourceId: string
  postId: string
}

const getPostLinkTargetKey = ({ sourceId, postId }: { sourceId: string; postId: string }) =>
  `${sourceId}:${postId}`

export const buildPostLinkTargets = ({
  outputDir,
  posts,
  categories,
  options,
}: {
  outputDir: string
  posts: PostSummary[]
  categories: CategoryInfo[]
  options: Pick<ExportOptions, "structure">
}) => {
  const categoryMap = new Map(categories.map((category) => [category.id, category]))

  return new Map(
    posts.map((post) => {
      const category = getCategoryForPost({
        categories: categoryMap,
        categoryId: post.categoryId,
        categoryName: post.categoryName,
      })

      return [
        getPostLinkTargetKey({
          sourceId: post.sourceId,
          postId: post.postId,
        }),
        {
          markdownFilePath: buildMarkdownFilePath({
            outputDir,
            post,
            category,
            options,
          }),
          templateValues: buildSameBlogPostTemplateValues({
            post: {
              sourceId: post.sourceId,
              postId: post.postId,
              title: post.title,
              publishedAt: post.publishedAt,
              categoryName: category.name,
            },
            options,
          }),
        } satisfies PostLinkTarget,
      ] as const
    }),
  )
}

export const createPostLinkResolver = ({
  sourceId,
  markdownFilePath,
  options,
  targets,
  resolveIdentity,
}: {
  sourceId: string
  markdownFilePath: string
  options: Pick<ExportOptions, "links">
  targets: Map<string, PostLinkTarget>
  resolveIdentity: (url: string) => SameBlogPostIdentity | null | undefined
}) => {
  if (options.links.sameBlogPostMode === "keep-source") {
    return (url: string) => url
  }

  return (url: string) => {
    const identity = resolveIdentity(url)

    if (!identity || identity.sourceId !== sourceId) {
      return url
    }

    const target = targets.get(
      getPostLinkTargetKey({
        sourceId: identity.sourceId,
        postId: identity.postId,
      }),
    )

    if (!target) {
      return url
    }

    if (options.links.sameBlogPostMode === "relative-filepath") {
      return relativePathFrom({
        from: markdownFilePath,
        to: target.markdownFilePath,
      })
    }

    const template = options.links.sameBlogPostCustomUrlTemplate.trim()

    if (!template) {
      return url
    }

    return applySameBlogPostCustomUrlTemplate({
      template,
      values: target.templateValues,
    })
  }
}
