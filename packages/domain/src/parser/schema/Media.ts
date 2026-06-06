export const allMediaKinds = ["image", "sticker"] as const
// Media family used by parsed image-like blocks.
export type MediaKind = (typeof allMediaKinds)[number]

export const allParsedBlockAssetRoles = ["image", "thumbnail"] as const
// Asset role advertised by a parser block to the exporter.
export type ParsedBlockAssetRole = (typeof allParsedBlockAssetRoles)[number]

// Video embed metadata normalized by parser blocks.
export type VideoData = {
  title: string
  thumbnailUrl: string | null
  sourceUrl: string
  vid: string | null
  inkey: string | null
  width: number | null
  height: number | null
}

// Image metadata normalized by parser blocks.
export type ImageData = {
  sourceUrl: string
  originalSourceUrl: string | null
  alt: string
  caption: string | null
  mediaKind: MediaKind
}

// Asset dependency advertised by a parsed block.
export type ParsedBlockAsset = {
  role: ParsedBlockAssetRole
  sourceUrl: string
  required: boolean
}
