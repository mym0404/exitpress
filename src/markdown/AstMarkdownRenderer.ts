import type { AstBlock, BlockOutputSelection, ImageData } from "../domain/ast/Types.js"
import type { ExportOptions } from "../domain/export-options/Types.js"

import { resolveBlockOutputSelection } from "../domain/export-options/BlockOutputSelection.js"

import {
  createLinkFormatter,
  getHeadingLevelOffset,
  renderCodeBlock,
  renderFormula,
  renderGfmTable,
  renderImageBlockMarkdown,
  renderParagraph,
  renderQuote,
} from "./BlockMarkdown.js"
import { convertHtmlToMarkdown } from "./TurndownMarkdownConverter.js"

const renderVideoBlock = ({
  block,
  formatLink,
}: {
  block: Extract<AstBlock, { type: "video" }>
  formatLink: (input: { label: string; url: string }) => string
}) =>
  formatLink({
    label: block.video.title || block.video.sourceUrl,
    url: block.video.sourceUrl,
  })

const getRenderableImageSource = ({
  image,
  options,
}: {
  image: ImageData
  options: ExportOptions
}) => {
  if (image.mediaKind === "sticker") {
    if (options.assets.stickerAssetMode === "ignore") {
      return null
    }

    return image.originalSourceUrl || image.sourceUrl
  }

  return image.sourceUrl
}

export const renderAstMarkdown = async ({
  blocks,
  options,
  resolveAssetPath,
  resolveLinkUrl,
  recordBodyThumbnail,
}: {
  blocks: AstBlock[]
  options: ExportOptions
  resolveAssetPath: (input: { kind: "image"; sourceUrl: string }) => Promise<string | null>
  resolveLinkUrl?: (url: string) => string
  recordBodyThumbnail: (pathValue: string | null) => void
}) => {
  const sections: string[] = []
  const inlineLinkFormatter = createLinkFormatter({
    resolveLinkUrl,
  })

  const renderImageWithSelection = async ({
    image,
    selection,
  }: {
    image: ImageData
    selection: BlockOutputSelection
  }) => {
    const renderableSourceUrl = getRenderableImageSource({
      image,
      options,
    })

    if (!renderableSourceUrl) {
      return ""
    }

    const assetPath = await resolveAssetPath({
      kind: "image",
      sourceUrl: renderableSourceUrl,
    })

    if (!assetPath) {
      return ""
    }

    recordBodyThumbnail(assetPath)
    return renderImageBlockMarkdown({
      image: {
        ...image,
        originalSourceUrl: image.originalSourceUrl ?? renderableSourceUrl,
      },
      assetPath,
      selection,
      formatLink: inlineLinkFormatter.formatLink,
    })
  }

  const renderTableBlock = (block: Extract<AstBlock, { type: "table" }>) => {
    const selection =
      block.outputSelection ??
      resolveBlockOutputSelection({
        blockType: "table",
        blockOutputs: options.blockOutputs,
      })

    if (selection.variant === "html-only") {
      return block.html
    }

    if (block.rows.length > 0) {
      return renderGfmTable(block)
    }

    return convertHtmlToMarkdown({
      html: block.html,
      resolveLinkUrl,
    })
  }

  for (const block of blocks) {
    if (block.type === "paragraph") {
      sections.push(renderParagraph(block.text))
      continue
    }

    if (block.type === "heading") {
      const selection = resolveBlockOutputSelection({
        blockType: "heading",
        blockOutputs: options.blockOutputs,
      })
      const adjustedLevel = Math.min(Math.max(block.level + getHeadingLevelOffset(selection), 1), 6)

      sections.push(`${"#".repeat(adjustedLevel)} ${block.text}`)
      continue
    }

    if (block.type === "quote") {
      sections.push(renderQuote(block.text))
      continue
    }

    if (block.type === "divider") {
      sections.push("---")
      continue
    }

    if (block.type === "code") {
      sections.push(
        renderCodeBlock({
          language: block.language,
          code: block.code,
        }),
      )
      continue
    }

    if (block.type === "formula") {
      const selection =
        block.outputSelection ??
        resolveBlockOutputSelection({
          blockType: "formula",
          blockOutputs: options.blockOutputs,
        })
      sections.push(
        renderFormula({
          formula: block.formula,
          display: block.display,
          selection,
        }),
      )
      continue
    }

    if (block.type === "image") {
      const selection = resolveBlockOutputSelection({
        blockType: "image",
        blockOutputs: options.blockOutputs,
      })
      sections.push(
        await renderImageWithSelection({
          image: block.image,
          selection: block.outputSelection ?? selection,
        }),
      )
      continue
    }

    if (block.type === "imageGroup") {
      const groupSections: string[] = []
      const imageSelection = resolveBlockOutputSelection({
        blockType: "image",
        blockOutputs: options.blockOutputs,
      })

      for (const image of block.images) {
        groupSections.push(
          await renderImageWithSelection({
            image,
            selection: imageSelection,
          }),
        )
      }

      sections.push(groupSections.join("\n\n"))
      continue
    }

    if (block.type === "video") {
      sections.push(
        renderVideoBlock({
          block,
          formatLink: inlineLinkFormatter.formatLink,
        }),
      )
      continue
    }

    if (block.type === "table") {
      sections.push(renderTableBlock(block))
    }
  }

  return sections.filter(Boolean).join("\n\n").trim()
}
