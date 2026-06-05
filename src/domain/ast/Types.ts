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
  | { type: "paragraph"; text: string }
  | { type: "heading"; level: number; text: string }
  | { type: "quote"; text: string }
  | { type: "divider" }
  | { type: "code"; language: string | null; code: string }
  | { type: "formula"; formula: string; display: boolean }
  | { type: "image"; image: ImageData }
  | { type: "imageGroup"; images: ImageData[] }
  | { type: "video"; video: VideoData }
  | { type: "table"; rows: TableRow[]; html: string; complex: boolean }

export type BlockType = AstBlock["type"]

export type ParsedPost = {
  tags: string[]
  blocks: AstBlock[]
  videos: VideoData[]
}

export type ParserBlockOptions = {
  blockOutputs: {
    templates: Partial<Record<string, string>>
  }
  resolveLinkUrl?: (url: string) => string
}
