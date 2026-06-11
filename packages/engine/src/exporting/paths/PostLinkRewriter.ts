import {
  applyPostTemplate as applySameBlogPostCustomUrlTemplate,
  buildPostTemplateValues as buildSameBlogPostTemplateValues,
} from "@exitpress/domain/export-paths/PostPathTemplate.js"

import type { CategoryInfo, PostSummary } from "@exitpress/domain/blog/schema/BlogScan.js"
import type { ExportOptions } from "@exitpress/domain/export-options/schema/ExportOptions.js"

import { relativePathFrom } from "../../infra/node/FilePaths.js"

import { buildMarkdownFilePath, getCategoryForPost } from "./ExportPaths.js"

const naverBlogHosts = new Set(["blog.naver.com", "m.blog.naver.com"])
const postViewPathPattern = /\/PostView\.naver$/i
const postPathPattern = /^\/([^/]+)\/(\d+)(?:\/)?$/i

type PostLinkTarget = {
  markdownFilePath: string
  templateValues: ReturnType<typeof buildSameBlogPostTemplateValues>
}

type SameBlogPostIdentity = {
  blogId: string
  logNo: string
}

const isNonPostNaverPath = (pathname: string) =>
  /\/PostList\.naver$/i.test(pathname) || /\/PostSearchList\.naver$/i.test(pathname)

export const extractNaverBlogPostIdentity = (value: string) => {
  const trimmed = value.trim()

  if (!trimmed || trimmed.startsWith("#")) {
    return null
  }

  let url: URL

  try {
    url = new URL(trimmed, "https://m.blog.naver.com")
  } catch {
    return null
  }

  if (!naverBlogHosts.has(url.hostname.toLowerCase()) || isNonPostNaverPath(url.pathname)) {
    return null
  }

  const directPathMatch = url.pathname.match(postPathPattern)

  if (directPathMatch) {
    return {
      blogId: directPathMatch[1] ?? "",
      logNo: directPathMatch[2] ?? "",
    }
  }

  if (!postViewPathPattern.test(url.pathname)) {
    return null
  }

  const blogId = url.searchParams.get("blogId")?.trim() ?? ""
  const logNo = url.searchParams.get("logNo")?.trim() ?? ""

  if (!blogId || !/^\d+$/.test(logNo)) {
    return null
  }

  return {
    blogId,
    logNo,
  }
}

const getPostLinkTargetKey = ({ blogId, logNo }: { blogId: string; logNo: string }) =>
  `${blogId}:${logNo}`

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
          blogId: post.blogId,
          logNo: post.logNo,
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
              blogId: post.blogId,
              logNo: post.logNo,
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

export const createSameBlogPostLinkResolver = ({
  blogId,
  markdownFilePath,
  options,
  targets,
}: {
  blogId: string
  markdownFilePath: string
  options: Pick<ExportOptions, "links">
  targets: Map<string, PostLinkTarget>
}) => {
  return createPostLinkResolver({
    blogId,
    markdownFilePath,
    options,
    targets,
    resolveIdentity: extractNaverBlogPostIdentity,
  })
}

export const createPostLinkResolver = ({
  blogId,
  markdownFilePath,
  options,
  targets,
  resolveIdentity,
}: {
  blogId: string
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

    if (!identity || identity.blogId !== blogId) {
      return url
    }

    const target = targets.get(
      getPostLinkTargetKey({
        blogId: identity.blogId,
        logNo: identity.logNo,
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
