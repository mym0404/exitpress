import type { AstBlock, BlockOutputSelection } from "../../../modules/blocks/Types.js"
import type { ExportOptions } from "../../../modules/exporter/Types.js"
import {
  createLinkFormatter,
  getHeadingLevelOffset,
  renderCodeBlock,
  renderFormula,
  renderGfmTable,
  renderImageBlockMarkdown,
  renderLinkCardBlock,
  renderParagraph,
  renderQuote,
} from "../../../modules/converter/BlockMarkdown.js"

const toPreviewAssetPath = (sourceUrl: string) => {
  const pathname = (() => {
    try {
      return new URL(sourceUrl).pathname
    } catch {
      return sourceUrl
    }
  })()
  const filename = pathname.split("/").filter(Boolean).at(-1) || "image.png"

  return `../../public/${filename}`
}

const getPreviewImageReference = ({
  sourceUrl,
  imageHandlingMode,
}: {
  sourceUrl: string
  imageHandlingMode: ExportOptions["assets"]["imageHandlingMode"]
}) => (imageHandlingMode === "remote" ? sourceUrl : toPreviewAssetPath(sourceUrl))

const getPreviewSelection = ({
  block,
  fallbackSelection,
}: {
  block: AstBlock
  fallbackSelection?: BlockOutputSelection
}) => {
  if ("outputSelection" in block && block.outputSelection) {
    return block.outputSelection
  }

  return fallbackSelection
}

const getImagePreviewSelection = ({
  block,
  fallbackSelection,
}: {
  block: Extract<AstBlock, { type: "image" }>
  fallbackSelection?: BlockOutputSelection
}) => {
  const selection = getPreviewSelection({
    block,
    fallbackSelection,
  })

  if (!selection) {
    throw new Error("image preview selection is missing")
  }

  return selection
}

export const renderBlockOutputPreview = ({
  block,
  selection,
  includeImageCaptions,
  imageHandlingMode,
}: {
  block: AstBlock
  selection: BlockOutputSelection
  includeImageCaptions: boolean
  imageHandlingMode: ExportOptions["assets"]["imageHandlingMode"]
}) => {
  const linkFormatter = createLinkFormatter({})

  if (block.type === "paragraph") {
    return renderParagraph(block.text)
  }

  if (block.type === "heading") {
    const adjustedLevel = Math.min(
      Math.max(block.level + getHeadingLevelOffset(selection), 1),
      6,
    )

    return `${"#".repeat(adjustedLevel)} ${block.text}`
  }

  if (block.type === "quote") {
    return renderQuote(block.text)
  }

  if (block.type === "divider") {
    return "---"
  }

  if (block.type === "code") {
    return renderCodeBlock({
      language: block.language,
      code: block.code,
    })
  }

  if (block.type === "formula") {
    return renderFormula({
      formula: block.formula,
      display: block.display,
      selection,
    })
  }

  if (block.type === "image") {
    return renderImageBlockMarkdown({
      image: block.image,
      assetPath: getPreviewImageReference({
        sourceUrl: block.image.sourceUrl,
        imageHandlingMode,
      }),
      selection: getImagePreviewSelection({
        block,
        fallbackSelection: selection,
      }),
      formatLink: linkFormatter.formatLink,
      includeImageCaptions,
    })
  }

  if (block.type === "imageGroup") {
    return block.images
      .map((image) =>
        renderImageBlockMarkdown({
          image,
          assetPath: getPreviewImageReference({
            sourceUrl: image.sourceUrl,
            imageHandlingMode,
          }),
          selection,
          formatLink: linkFormatter.formatLink,
          includeImageCaptions,
        }),
      )
      .join("\n\n")
  }

  if (block.type === "video") {
    return linkFormatter.formatLink({
      label: block.video.title || block.video.sourceUrl,
      url: block.video.sourceUrl,
    })
  }

  if (block.type === "linkCard") {
    return renderLinkCardBlock({
      block,
      formatLink: linkFormatter.formatLink,
    })
  }

  if (block.type === "table") {
    return selection.variant === "html-only" ? block.html : renderGfmTable(block)
  }

  return ""
}
