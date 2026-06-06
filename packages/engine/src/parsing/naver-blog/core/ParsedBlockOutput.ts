import { renderParagraph } from "@exitpress/engine/markdown/utils/renderParagraph.js"

import type {
  ImageData,
  ParsedBlock,
  ParsedBlockAsset,
  ParserBlockOptions,
  TableRow,
  VideoData,
} from "@exitpress/domain/parser/Types.js"
import type { TemplateValue } from "@exitpress/domain/template/Types.js"

const escapeTableCell = (value: string) =>
  value.replace(/\|/g, "\\|").replace(/\n+/g, "<br>").trim() || " "

const normalizeTableRows = (rows: TableRow[]) => {
  const [headerRow] = rows

  if (!headerRow) {
    return []
  }

  const columnCount = headerRow.length
  const normalizeRow = (cells: TableRow) =>
    [
      ...cells.map((cell) => ({
        ...cell,
        text: escapeTableCell(cell.text),
      })),
      ...Array.from({ length: Math.max(0, columnCount - cells.length) }, () => ({
        text: " ",
        html: "",
        colspan: 1,
        rowspan: 1,
        isHeader: false,
      })),
    ].slice(0, columnCount)

  return rows.map(normalizeRow)
}

const createParsedBlock = ({
  blockId,
  props,
  assets,
}: {
  blockId: string
  props: Record<string, TemplateValue>
  assets?: Record<string, ParsedBlockAsset>
}): ParsedBlock => ({
  blockId,
  props,
  ...(assets ? { assets } : {}),
})

export const createParagraphBlock = ({ blockId, text }: { blockId: string; text: string }) =>
  createParsedBlock({
    blockId,
    props: {
      text: renderParagraph(text),
    },
  })

export const createHeadingBlock = ({
  blockId,
  level,
  text,
}: {
  blockId: string
  level: number
  text: string
}) =>
  createParsedBlock({
    blockId,
    props: {
      level,
      text,
    },
  })

export const createQuoteBlock = ({ blockId, text }: { blockId: string; text: string }) =>
  createParsedBlock({
    blockId,
    props: {
      text,
    },
  })

export const createDividerBlock = ({ blockId }: { blockId: string }) =>
  createParsedBlock({
    blockId,
    props: {},
  })

export const createCodeBlock = ({
  blockId,
  language,
  code,
}: {
  blockId: string
  language: string | null
  code: string
}) =>
  createParsedBlock({
    blockId,
    props: {
      language,
      code,
    },
  })

export const createFormulaBlock = ({
  blockId,
  formula,
  display,
}: {
  blockId: string
  formula: string
  display: boolean
}) =>
  createParsedBlock({
    blockId,
    props: {
      formula,
      display,
    },
  })

export const createImageBlock = ({
  blockId,
  image,
  options,
}: {
  blockId: string
  image: ImageData
  options: ParserBlockOptions
}) => {
  const sourceUrl =
    image.mediaKind === "sticker"
      ? options.assets?.stickerAssetMode === "download-original"
        ? (image.originalSourceUrl ?? image.sourceUrl)
        : undefined
      : image.sourceUrl

  if (!sourceUrl) {
    return undefined
  }

  return createParsedBlock({
    blockId,
    props: {
      url: sourceUrl,
      alt: image.alt,
      caption: image.caption,
    },
    assets: {
      url: {
        role: "image",
        sourceUrl,
        required: true,
      },
    },
  })
}

export const createImageBlocks = ({
  blockId,
  images,
  options,
}: {
  blockId: string
  images: ImageData[]
  options: ParserBlockOptions
}) =>
  images
    .map((image) => createImageBlock({ blockId, image, options }))
    .filter((block): block is ParsedBlock => Boolean(block))

export const createTableBlock = ({
  blockId,
  rows,
  html,
  complex,
}: {
  blockId: string
  rows: TableRow[]
  html: string
  complex: boolean
}) =>
  createParsedBlock({
    blockId,
    props: {
      rows: normalizeTableRows(rows),
      html,
      complex,
    },
  })

export const createVideoBlock = ({ blockId, video }: { blockId: string; video: VideoData }) =>
  createParsedBlock({
    blockId,
    props: {
      title: video.title,
      url: video.sourceUrl,
      thumbnailUrl: video.thumbnailUrl,
      width: video.width,
      height: video.height,
    },
  })
