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
  | "tags"
  | "thumbnail"
  | "exportedAt"
  | "assetPaths"

export type FrontmatterFieldMeta = {
  label: string
  description: string
  defaultAlias: string
}

type ImageHandlingMode = "download" | "remote" | "download-and-upload"

type AssetDownloadFailureMode = "fail" | "use-source" | "omit"

type ThumbnailSource = "post-list-first" | "first-body-image" | "none"

type StickerAssetMode = "ignore" | "download-original"

type SameBlogPostLinkMode = "keep-source" | "custom-url" | "relative-filepath"

export type OptionDescriptionMap = Record<string, string>

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
    templates: Partial<Record<string, string>>
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
