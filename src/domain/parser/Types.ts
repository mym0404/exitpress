import type { ExportOptions } from "../export-options/Types.js"
import type { TemplateValue } from "../template/Types.js"

export type VideoData = {
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

export type ParsedBlockAsset = {
  role: "image" | "thumbnail"
  sourceUrl: string
  required: boolean
}

export type ParsedBlock = {
  blockId: string
  props: Record<string, TemplateValue>
  assets?: Record<string, ParsedBlockAsset>
}

export type ParsedPost = {
  tags: string[]
  blocks: ParsedBlock[]
}

export type ParserBlockOptions = {
  blockOutputs: {
    templates: Partial<Record<string, string>>
  }
  assets?: ExportOptions["assets"]
  resolveLinkUrl?: (url: string) => string
}
