import type { PostSummary } from "../blog/schema/BlogScan.js"
import type { ExportOptions } from "../export-options/schema/ExportOptions.js"

import { renderTemplateExpressions } from "../template/util/renderTemplateExpressions.js"

import {
  formatCategorySegment,
  formatTitleSegment,
  getDateSlug,
  sanitizePathSegment,
} from "./PathFormat.js"

export const postTemplateKeys = [
  "slug",
  "category",
  "title",
  "blogKey",
  "postId",
  "sourceId",
  "date",
  "year",
  "YYYY",
  "YY",
  "month",
  "MM",
  "M",
  "day",
  "DD",
  "D",
] as const

type PostTemplateKey = (typeof postTemplateKeys)[number]

type PostTemplateValues = Record<PostTemplateKey, string>

export const buildPostTemplateValues = ({
  post,
  options,
}: {
  post: Pick<PostSummary, "blogKey" | "sourceId" | "postId" | "title" | "publishedAt"> & {
    categoryName?: string
  }
  options: Pick<ExportOptions, "structure">
}) => {
  const date = getDateSlug(post.publishedAt)
  const [year = "", month = "", day = ""] = date.split("-")
  const numericMonth = month ? String(Number(month)) : ""
  const numericDay = day ? String(Number(day)) : ""

  return {
    slug: formatTitleSegment({
      value: post.title,
      slugStyle: options.structure.slugStyle,
      slugWhitespace: options.structure.slugWhitespace,
    }),
    category: formatCategorySegment({
      value: post.categoryName?.trim() || "uncategorized",
      slugStyle: options.structure.slugStyle,
      slugWhitespace: options.structure.slugWhitespace,
    }),
    title: sanitizePathSegment(post.title).replace(/\s+/g, "-"),
    blogKey: post.blogKey,
    postId: post.postId,
    sourceId: post.sourceId,
    date,
    year,
    YYYY: year,
    YY: year.slice(-2),
    month,
    MM: month,
    M: numericMonth,
    day,
    DD: day,
    D: numericDay,
  } satisfies PostTemplateValues
}

export const applyPostTemplate = ({
  template,
  values,
}: {
  template: string
  values: PostTemplateValues
}) => renderTemplateExpressions({ template, props: values })

export const buildPostFolderName = ({
  post,
  options,
}: {
  post: Pick<PostSummary, "blogKey" | "sourceId" | "postId" | "title" | "publishedAt"> & {
    categoryName?: string
  }
  options: Pick<ExportOptions, "structure">
}) => {
  const template = options.structure.postFolderNameTemplate.trim()

  if (!template) {
    return post.postId
  }

  return (
    sanitizePathSegment(
      applyPostTemplate({
        template,
        values: buildPostTemplateValues({
          post,
          options,
        }),
      }),
    ) || post.postId
  )
}
