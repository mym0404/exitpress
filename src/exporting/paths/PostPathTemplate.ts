import type { PostSummary } from "../../domain/blog/Types.js"
import type { ExportOptions } from "../../domain/export-options/Types.js"
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
  "logNo",
  "blogId",
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

const postTemplatePattern =
  /\{(slug|category|title|logNo|blogId|date|year|YYYY|YY|month|MM|M|day|DD|D)\}/g

export const buildPostTemplateValues = ({
  post,
  options,
}: {
  post: Pick<PostSummary, "blogId" | "logNo" | "title" | "publishedAt"> & {
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
    logNo: post.logNo,
    blogId: post.blogId,
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
}) => template.replace(postTemplatePattern, (_, key: PostTemplateKey) => values[key])

export const buildPostFolderName = ({
  post,
  options,
}: {
  post: Pick<PostSummary, "blogId" | "logNo" | "title" | "publishedAt"> & {
    categoryName?: string
  }
  options: Pick<ExportOptions, "structure">
}) => {
  if (options.structure.postFolderNameMode === "custom-template") {
    const template = options.structure.postFolderNameCustomTemplate.trim()

    if (template) {
      return (
        sanitizePathSegment(
          applyPostTemplate({
            template,
            values: buildPostTemplateValues({
              post,
              options,
            }),
          }),
        ) || post.logNo
      )
    }
  }

  const nameParts: string[] = []

  if (options.structure.includeDateInPostFolderName) {
    nameParts.push(getDateSlug(post.publishedAt))
  }

  if (options.structure.includeLogNoInPostFolderName) {
    nameParts.push(post.logNo)
  }

  nameParts.push(
    formatTitleSegment({
      value: post.title,
      slugStyle: options.structure.slugStyle,
      slugWhitespace: options.structure.slugWhitespace,
    }),
  )

  return nameParts.filter(Boolean).join("-") || post.logNo
}
