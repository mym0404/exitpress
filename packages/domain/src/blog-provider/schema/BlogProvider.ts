import type { ParsedBlock } from "../../parser/schema/ParsedPost.js"

export const allBlogContentKinds = ["html", "markdown", "blocks"] as const
export type BlogContentKind = (typeof allBlogContentKinds)[number]

export type BlogSource = {
  providerKey: string
  sourceId: string
  displayName: string
  input: string
}

export type BlogCategoryRef = {
  id: number
  name: string
  parentId: number | undefined
  postCount: number
  path: string[]
  depth: number
}

export type BlogPostRef = {
  providerKey: string
  sourceId: string
  postId: string
  title: string
  sourceUrl: string
  publishedAt: string
  categoryId: number
  categoryName: string
  thumbnailUrl: string | undefined
}

export type BlogScanResult = {
  source: BlogSource
  totalPostCount: number
  categories: BlogCategoryRef[]
  posts: BlogPostRef[]
}

export type BlogPostIdentity = {
  providerKey: string
  sourceId: string
  postId: string
}

export type BlogHtmlContentDocument = {
  kind: "html"
  html: string
  sourceUrl: string
  tags: string[]
}

export type BlogMarkdownContentDocument = {
  kind: "markdown"
  markdown: string
  sourceUrl: string
  tags: string[]
}

export type BlogBlocksContentDocument = {
  kind: "blocks"
  blocks: ParsedBlock[]
  sourceUrl: string
  tags: string[]
}

export type BlogContentDocument =
  | BlogHtmlContentDocument
  | BlogMarkdownContentDocument
  | BlogBlocksContentDocument
