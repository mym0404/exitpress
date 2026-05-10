type ExportProfile = "gfm"

export type ThemePreference = "dark" | "light"

type CategorySelectionMode = "selected-and-descendants" | "exact-selected"

export type SlugStyle = "kebab" | "snake" | "keep-title"

export type SlugWhitespace = "dash" | "underscore" | "keep-space"

type PostFolderNameMode = "preset" | "custom-template"

export type FrontmatterFieldName =
  | "title"
  | "source"
  | "blogId"
  | "logNo"
  | "publishedAt"
  | "category"
  | "categoryPath"
  | "visibility"
  | "tags"
  | "thumbnail"
  | "video"
  | "exportedAt"
  | "assetPaths"

export type FrontmatterFieldMeta = {
  label: string
  description: string
  defaultAlias: string
}

export type MarkdownLinkStyle = "inlined" | "referenced"

export type BlockOutputParamValue = string | number | boolean

export type BlockOutputSelection = {
  variant: string
  params?: Record<string, BlockOutputParamValue>
}

type OutputOptionParam = {
  key: string
  label: string
  description: string
  input: "text" | "number"
  defaultValue?: BlockOutputParamValue
}

export type OutputOption<Block extends BlockType = BlockType> = {
  id: string
  label: string
  description: string
  preview: Extract<AstBlock, { type: Block }>
  isDefault?: boolean
  params?: OutputOptionParam[]
}

export type EditorBlockOutputDefinition = {
  key: string
  editorType: string
  editorLabel: string
  blockId: string
  blockLabel: string
  options: OutputOption[]
}

type AstBlockOutputSelection = {
  outputSelectionKey?: string
  outputSelection?: BlockOutputSelection
}

type ImageHandlingMode = "download" | "remote" | "download-and-upload"

type AssetDownloadFailureMode = "fail" | "use-source" | "omit"

type ThumbnailSource = "post-list-first" | "first-body-image" | "none"

type StickerAssetMode = "ignore" | "download-original"

type SameBlogPostLinkMode = "keep-source" | "custom-url" | "relative-filepath"

export type OptionDescriptionMap = Record<string, string>
export type UnknownRecord = Record<string, unknown>

export type UploadProviderValue = string | number | boolean
export type UploadProviderFields = Record<string, UploadProviderValue>

type UploadProviderInputType = "text" | "password" | "number" | "select" | "checkbox"

export type UploadProviderOptionValue = string | number

type UploadProviderFieldOption = {
  label: string
  value: UploadProviderOptionValue
}

export type UploadProviderFieldDefinition = {
  key: string
  label: string
  description: string
  inputType: UploadProviderInputType
  required: boolean
  defaultValue: UploadProviderValue | null
  placeholder: string
  options?: UploadProviderFieldOption[]
}

export type UploadProviderDefinition = {
  key: string
  label: string
  description: string
  fields: UploadProviderFieldDefinition[]
}

export type UploadProviderCatalogResponse = {
  defaultProviderKey: string | null
  providers: UploadProviderDefinition[]
}

export type ExportJobPollingConfig = {
  defaultPollMs: number
  fastPollMs: number
  uploadBurstPollMs: number
  uploadBurstAttempts: number
}

type UploadTerminalReason = "skipped-no-candidates"

type UploadRewriteStatus = "pending" | "completed" | "failed"

export type UploadStatus =
  | "not-requested"
  | "upload-ready"
  | "uploading"
  | "upload-completed"
  | "upload-failed"
  | "skipped"

type UploadSummary = {
  status: UploadStatus
  eligiblePostCount: number
  candidateCount: number
  uploadedCount: number
  failedCount: number
  terminalReason: UploadTerminalReason | null
}

export type UploadCandidate = {
  kind: "image" | "thumbnail"
  sourceUrl: string
  localPath: string
  markdownReference: string
}

type PostUploadSummary = {
  eligible: boolean
  candidateCount: number
  uploadedCount: number
  failedCount: number
  candidates: UploadCandidate[]
  uploadedUrls: string[]
  rewriteStatus: UploadRewriteStatus
  rewrittenAt: string | null
}

export type ExportOptions = {
  scope: {
    categoryIds: number[]
    categoryMode: CategorySelectionMode
    dateFrom: string | null
    dateTo: string | null
  }
  structure: {
    groupByCategory: boolean
    includeDateInPostFolderName: boolean
    includeLogNoInPostFolderName: boolean
    slugStyle: SlugStyle
    slugWhitespace: SlugWhitespace
    postFolderNameMode: PostFolderNameMode
    postFolderNameCustomTemplate: string
  }
  frontmatter: {
    enabled: boolean
    fields: Record<FrontmatterFieldName, boolean>
    aliases: Record<FrontmatterFieldName, string>
  }
  blockOutputs: {
    defaults: Partial<{
      [Key in string]: BlockOutputSelection
    }>
  }
  assets: {
    imageHandlingMode: ImageHandlingMode
    compressionEnabled: boolean
    downloadFailureMode: AssetDownloadFailureMode
    stickerAssetMode: StickerAssetMode
    downloadImages: boolean
    downloadThumbnails: boolean
    includeImageCaptions: boolean
    thumbnailSource: ThumbnailSource
  }
  links: {
    sameBlogPostMode: SameBlogPostLinkMode
    sameBlogPostCustomUrlTemplate: string
  }
}

export type ExportRequest = {
  blogIdOrUrl: string
  outputDir: string
  profile: ExportProfile
  options: ExportOptions
}

export type JobStatus =
  | "queued"
  | "running"
  | "upload-ready"
  | "uploading"
  | "upload-completed"
  | "upload-failed"
  | "completed"
  | "failed"

type JobLog = {
  timestamp: string
  message: string
}

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

type LinkCardData = {
  title: string
  description: string
  url: string
  imageUrl: string | null
}

type VideoData = {
  title: string
  thumbnailUrl: string | null
  sourceUrl: string
  vid: string | null
  inkey: string | null
  width: number | null
  height: number | null
}

type TableCell = {
  text: string
  html: string
  colspan: number
  rowspan: number
  isHeader: boolean
}

export type TableRow = TableCell[]

type MediaKind = "image" | "sticker"

export type ImageData = {
  sourceUrl: string
  originalSourceUrl: string | null
  alt: string
  caption: string | null
  mediaKind: MediaKind
}

export type AstBlock =
  | ({ type: "paragraph"; text: string } & AstBlockOutputSelection)
  | ({ type: "heading"; level: number; text: string } & AstBlockOutputSelection)
  | ({ type: "quote"; text: string } & AstBlockOutputSelection)
  | ({ type: "divider" } & AstBlockOutputSelection)
  | ({ type: "code"; language: string | null; code: string } & AstBlockOutputSelection)
  | ({ type: "formula"; formula: string; display: boolean } & AstBlockOutputSelection)
  | ({ type: "image"; image: ImageData } & AstBlockOutputSelection)
  | ({ type: "imageGroup"; images: ImageData[] } & AstBlockOutputSelection)
  | ({ type: "video"; video: VideoData } & AstBlockOutputSelection)
  | ({ type: "linkCard"; card: LinkCardData } & AstBlockOutputSelection)
  | ({ type: "table"; rows: TableRow[]; html: string; complex: boolean } & AstBlockOutputSelection)

export type BlockType = AstBlock["type"]

export type ParsedPost = {
  tags: string[]
  body: AstBlock[]
  blocks: AstBlock[]
  videos: VideoData[]
}

export type ParserBlockOptions = Pick<ExportOptions, "blockOutputs"> &
  {
    resolveLinkUrl?: (url: string) => string
  }

export type AssetRecord = {
  kind: "image" | "thumbnail"
  sourceUrl: string
  reference: string
  relativePath: string | null
  storageMode: "relative" | "remote"
  uploadCandidate: UploadCandidate | null
}

export type PostManifestEntry = {
  logNo: string
  title: string
  source: string
  category: {
    id: number
    name: string
    path: string[]
  }
  status: "success" | "failed"
  outputPath: string | null
  assetPaths: string[]
  upload: PostUploadSummary
  error: string | null
}

export type ExportJobItem = {
  id: string
  logNo: string
  title: string
  source: string
  category: {
    id: number
    name: string
    path: string[]
  }
  status: "success" | "failed"
  outputPath: string | null
  assetPaths: string[]
  upload: PostUploadSummary
  error: string | null
  updatedAt: string
}

export type ScanResult = {
  blogId: string
  totalPostCount: number
  categories: CategoryInfo[]
  posts?: PostSummary[]
}

export type ScanCacheMap = Record<string, ScanResult>

export type ExportJobState = {
  id: string
  request: ExportRequest
  status: JobStatus
  resumeAvailable?: boolean
  logs: JobLog[]
  createdAt: string
  startedAt: string | null
  finishedAt: string | null
  progress: {
    total: number
    completed: number
    failed: number
  }
  upload: UploadSummary
  items: ExportJobItem[]
  manifest: ExportManifest | null
  error: string | null
}

export type ExportResumePhase = "export" | "upload-ready" | "uploading" | "result"

export type ExportResumeSummary = {
  status: JobStatus
  outputDir: string
  totalPosts: number
  completedCount: number
  failedCount: number
  uploadCandidateCount: number
  uploadedCount: number
}

export type ExportManifestScanResult = Pick<ScanResult, "blogId" | "totalPostCount">

type ExportManifestJobState = {
  id: string
  phase: ExportResumePhase
  request: ExportRequest
  status: JobStatus
  createdAt: string
  startedAt: string | null
  finishedAt: string | null
  updatedAt: string
  progress: ExportJobState["progress"]
  upload: UploadSummary
  error: string | null
  scanResult: ExportManifestScanResult | null
  summary: ExportResumeSummary
}

export type ExportManifest = {
  blogId: string
  profile: ExportProfile
  options: ExportOptions
  selectedCategoryIds: number[]
  startedAt: string
  finishedAt: string | null
  totalPosts: number
  successCount: number
  failureCount: number
  upload: UploadSummary
  categories: CategoryInfo[]
  posts: PostManifestEntry[]
  job?: ExportManifestJobState
}
