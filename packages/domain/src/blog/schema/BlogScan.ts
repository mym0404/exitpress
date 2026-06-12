// Category metadata comes from the concrete blog's category tree.
export type CategoryInfo = {
  id: number
  name: string
  parentId: number | null
  postCount: number
  isDivider: boolean
  isOpen: boolean
  path: string[]
  depth: number
}

// A lightweight post row used before full post HTML is fetched.
export type PostSummary = {
  blogKey: string
  sourceId: string
  postId: string
  title: string
  publishedAt: string
  categoryId: number
  categoryName: string
  source: string
  thumbnailUrl: string | null
}

// Scan output shared by the server, web wizard, and exporter.
export type ScanResult = {
  blogKey: string
  sourceId: string
  totalPostCount: number
  categories: CategoryInfo[]
  posts?: PostSummary[]
  detectedBlockTemplateKeys?: string[]
  detectedBlockTemplateScopeSignature?: string
}

// Server-side cache keyed by blog-qualified source id.
export type ScanCacheMap = Record<string, ScanResult>

export const getScanCacheKey = ({ blogKey, sourceId }: { blogKey: string; sourceId: string }) =>
  `${blogKey}:${sourceId}`
