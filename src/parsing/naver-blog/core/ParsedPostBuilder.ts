import type { ParserBlockOptions, ParsedPost, ImageData } from "../../../domain/parser/Types.js"
import type {
  AssetCandidate,
  BlockRenderInput,
  TemplateValue,
} from "../../../domain/template/Types.js"

import type { ParserBlockNode } from "./ParserBlockNode.js"

import { tableTemplate } from "../../../domain/template/DefaultTemplates.js"
import { renderParagraph } from "../../../markdown/BlockMarkdown.js"

const headingTemplate =
  "${level === 1 ? '# ' + text : level === 2 ? '## ' + text : level === 3 ? '### ' + text : level === 4 ? '#### ' + text : level === 5 ? '##### ' + text : '###### ' + text}"
const formulaTemplate = "${display ? '$$\\n' + formula + '\\n$$' : '$' + formula + '$'}"
const codeTemplate = "```${language ?? ''}\n${code}\n```"

const escapeTableCell = (value: string) =>
  value.replace(/\|/g, "\\|").replace(/\n+/g, "<br>").trim() || " "

const toTemplateTableRows = (block: Extract<ParserBlockNode, { type: "table" }>) => {
  const [headerRow] = block.rows

  if (!headerRow) {
    return []
  }

  const columnCount = headerRow.length
  const normalizeRow = (cells: typeof headerRow) =>
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

  return block.rows.map(normalizeRow)
}

const findTemplateForBlock = ({
  blockType,
  options,
}: {
  blockType: ParserBlockNode["type"]
  options: ParserBlockOptions
}) =>
  Object.entries(options.blockOutputs.templates).find(
    ([key, template]) => key.endsWith(`:${blockType}`) && typeof template === "string",
  )?.[1]

const toRenderInput = ({
  blockType,
  options,
  fallbackTemplate,
  props,
}: {
  blockType: ParserBlockNode["type"]
  options: ParserBlockOptions
  fallbackTemplate: string
  props: Record<string, TemplateValue>
}): BlockRenderInput => ({
  template:
    findTemplateForBlock({
      blockType,
      options,
    }) ?? fallbackTemplate,
  props,
})

const createImageRenderInput = ({
  image,
  blockType,
  options,
  inputIndex,
}: {
  image: ImageData
  blockType: Extract<ParserBlockNode["type"], "image" | "imageGroup">
  options: ParserBlockOptions
  inputIndex: number
}) => {
  const sourceUrl =
    image.mediaKind === "sticker"
      ? options.assets?.stickerAssetMode === "download-original"
        ? (image.originalSourceUrl ?? image.sourceUrl)
        : null
      : image.sourceUrl

  if (!sourceUrl) {
    return null
  }

  const renderInput = toRenderInput({
    blockType,
    options,
    fallbackTemplate: "![${alt}](${url})",
    props: {
      url: sourceUrl,
      alt: image.alt,
      caption: image.caption,
    },
  })
  const assetCandidate: AssetCandidate = {
    assetRole: "image",
    sourceUrl,
    targetPropPath: [String(inputIndex), "url"],
    dedupKey: sourceUrl,
    required: true,
  }

  return {
    renderInput,
    assetCandidate,
  }
}

export const buildParsedPost = ({
  tags,
  nodes,
  options,
}: {
  tags: string[]
  nodes: ParserBlockNode[]
  options: ParserBlockOptions
}): ParsedPost => {
  const renderInputs: BlockRenderInput[] = []
  const assetCandidates: AssetCandidate[] = []
  const videos = nodes
    .filter((node): node is Extract<ParserBlockNode, { type: "video" }> => node.type === "video")
    .map((node) => node.video)

  const pushImage = ({
    image,
    blockType,
  }: {
    image: ImageData
    blockType: Extract<ParserBlockNode["type"], "image" | "imageGroup">
  }) => {
    const { renderInput, assetCandidate } = createImageRenderInput({
      image,
      blockType,
      options,
      inputIndex: renderInputs.length,
    }) ?? {
      renderInput: null,
      assetCandidate: null,
    }

    if (!renderInput || !assetCandidate) {
      return
    }

    renderInputs.push(renderInput)
    assetCandidates.push(assetCandidate)
  }

  for (const node of nodes) {
    if (node.type === "paragraph") {
      renderInputs.push(
        toRenderInput({
          blockType: node.type,
          options,
          fallbackTemplate: "${text}",
          props: {
            text: renderParagraph(node.text),
          },
        }),
      )
      continue
    }

    if (node.type === "heading") {
      renderInputs.push(
        toRenderInput({
          blockType: node.type,
          options,
          fallbackTemplate: headingTemplate,
          props: {
            level: node.level,
            text: node.text,
          },
        }),
      )
      continue
    }

    if (node.type === "quote") {
      renderInputs.push(
        toRenderInput({
          blockType: node.type,
          options,
          fallbackTemplate: "> ${text}",
          props: {
            text: node.text,
          },
        }),
      )
      continue
    }

    if (node.type === "divider") {
      renderInputs.push(
        toRenderInput({
          blockType: node.type,
          options,
          fallbackTemplate: "---",
          props: {},
        }),
      )
      continue
    }

    if (node.type === "code") {
      renderInputs.push(
        toRenderInput({
          blockType: node.type,
          options,
          fallbackTemplate: codeTemplate,
          props: {
            language: node.language,
            code: node.code,
          },
        }),
      )
      continue
    }

    if (node.type === "formula") {
      renderInputs.push(
        toRenderInput({
          blockType: node.type,
          options,
          fallbackTemplate: formulaTemplate,
          props: {
            formula: node.formula,
            display: node.display,
          },
        }),
      )
      continue
    }

    if (node.type === "image") {
      pushImage({ image: node.image, blockType: node.type })
      continue
    }

    if (node.type === "imageGroup") {
      node.images.forEach((image) => {
        pushImage({ image, blockType: node.type })
      })
      continue
    }

    if (node.type === "video") {
      renderInputs.push(
        toRenderInput({
          blockType: node.type,
          options,
          fallbackTemplate: "[${title || url}](${url})",
          props: {
            title: node.video.title,
            url: node.video.sourceUrl,
            thumbnailUrl: node.video.thumbnailUrl,
            width: node.video.width,
            height: node.video.height,
          },
        }),
      )
      continue
    }

    renderInputs.push(
      toRenderInput({
        blockType: node.type,
        options,
        fallbackTemplate: tableTemplate,
        props: {
          html: node.html,
          rows: toTemplateTableRows(node),
          complex: node.complex,
        },
      }),
    )
  }

  return {
    tags,
    blocks: nodes,
    renderInputs,
    assetCandidates,
    videos,
    blockTypes: nodes.map((node) => node.type),
  }
}
