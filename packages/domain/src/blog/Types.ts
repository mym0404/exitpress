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

export type PostSummary = {
  blogId: string
  logNo: string
  title: string
  publishedAt: string
  categoryId: number
  categoryName: string
  source: string
  thumbnailUrl: string | null
}

export type ScanResult = {
  blogId: string
  totalPostCount: number
  categories: CategoryInfo[]
  posts?: PostSummary[]
  detectedBlockTemplateKeys?: string[]
  detectedBlockTemplateScopeSignature?: string
}

export type ScanCacheMap = Record<string, ScanResult>
