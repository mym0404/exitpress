import { NaverBlog } from "../../src/parsing/naver-blog/NaverBlog.js"

export const allowedTopLevelOptionKeys = [
  "scope",
  "structure",
  "frontmatter",
  "blockOutputs",
  "unsupportedBlockCases",
  "assets",
  "links",
] as const
export const allowedScopeKeys = ["categoryIds", "categoryMode", "dateFrom", "dateTo"] as const
export const allowedStructureKeys = [
  "groupByCategory",
  "includeDateInPostFolderName",
  "includeLogNoInPostFolderName",
  "postDirectoryName",
  "assetDirectoryName",
  "slugStyle",
  "slugWhitespace",
  "postFolderNameMode",
  "postFolderNameCustomTemplate",
] as const
export const allowedFrontmatterKeys = ["enabled", "fields", "aliases"] as const
export const allowedFrontmatterFieldKeys = [
  "title",
  "source",
  "blogId",
  "logNo",
  "publishedAt",
  "category",
  "categoryPath",
  "tags",
  "thumbnail",
  "exportedAt",
  "assetPaths",
] as const
export const allowedBlockOutputsKeys = ["defaults"] as const
export const allowedAssetsKeys = [
  "imageHandlingMode",
  "compressionEnabled",
  "stickerAssetMode",
  "downloadImages",
  "downloadThumbnails",
  "includeImageCaptions",
  "thumbnailSource",
] as const
export const allowedLinksKeys = ["sameBlogPostMode", "sameBlogPostCustomUrlTemplate"] as const

export const categoryModes = ["selected-and-descendants", "exact-selected"] as const
export const slugStyles = ["kebab", "snake", "keep-title"] as const
export const slugWhitespaces = ["dash", "underscore", "keep-space"] as const
export const postFolderNameModes = ["preset", "custom-template"] as const
export const imageHandlingModes = ["download", "remote", "download-and-upload"] as const
export const stickerAssetModes = ["ignore", "download-original"] as const
export const thumbnailSources = ["post-list-first", "first-body-image", "none"] as const
export const sameBlogPostModes = ["keep-source", "custom-url", "relative-filepath"] as const

const editorBlockOutputDefinitions = new NaverBlog().getBlockOutputDefinitions()
export const editorBlockOutputDefinitionMap = new Map(
  editorBlockOutputDefinitions.map((definition) => [definition.key, definition]),
)
export const editorBlockOutputSelectionKeys = editorBlockOutputDefinitions.map(
  (definition) => definition.key,
)
