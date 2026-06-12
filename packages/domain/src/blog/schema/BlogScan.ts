// Category metadata comes from provider's blog category tree.
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
  sourceId: string
  totalPostCount: number
  categories: CategoryInfo[]
  posts?: PostSummary[]
  detectedBlockTemplateKeys?: string[]
  detectedBlockTemplateScopeSignature?: string
}

// Server-side cache keyed by normalized blog id.
export type ScanCacheMap = Record<string, ScanResult>
