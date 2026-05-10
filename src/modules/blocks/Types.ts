import type { ExportOptions } from "../exporter/Types.js"

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
  blocks: AstBlock[]
  videos: VideoData[]
}

export type ParserBlockOptions = Pick<ExportOptions, "blockOutputs"> & {
  resolveLinkUrl?: (url: string) => string
}
