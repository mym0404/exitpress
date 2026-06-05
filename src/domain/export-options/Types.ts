export type SlugStyle = "kebab" | "snake" | "keep-title"

export type SlugWhitespace = "dash" | "underscore" | "keep-space"

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

export type ExportOptions = {
  scope: {
    categoryIds: number[]
    categoryMode: "selected-and-descendants" | "exact-selected"
    dateFrom: string | null
    dateTo: string | null
  }
  structure: {
    groupByCategory: boolean
    includeDateInPostFolderName: boolean
    includeLogNoInPostFolderName: boolean
    slugStyle: SlugStyle
    slugWhitespace: SlugWhitespace
    postFolderNameMode: "preset" | "custom-template"
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
    imageHandlingMode: "download" | "remote" | "download-and-upload"
    compressionEnabled: boolean
    downloadFailureMode: "fail" | "use-source" | "omit"
    stickerAssetMode: "ignore" | "download-original"
    downloadImages: boolean
    downloadThumbnails: boolean
    includeImageCaptions: boolean
    thumbnailSource: "post-list-first" | "first-body-image" | "none"
  }
  links: {
    sameBlogPostMode: "keep-source" | "custom-url" | "relative-filepath"
    sameBlogPostCustomUrlTemplate: string
  }
}
