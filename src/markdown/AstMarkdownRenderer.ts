import type { AstBlock, ImageData } from "../domain/ast/Types.js"
import type { ExportOptions } from "../domain/export-options/Types.js"
import type { TemplateValue } from "../domain/template/Types.js"

import {
  createLinkFormatter,
  renderCodeBlock,
  renderFormula,
  renderGfmTable,
  renderImageBlockMarkdown,
  renderParagraph,
  renderQuote,
} from "./BlockMarkdown.js"
import { renderBlockTemplates } from "./BlockTemplateRenderer.js"
import { convertHtmlToMarkdown } from "./TurndownMarkdownConverter.js"

const findTemplateForBlock = ({
  blockType,
  options,
}: {
  blockType: AstBlock["type"]
  options: ExportOptions
}) =>
  Object.entries(options.blockOutputs.templates).find(
    ([key, template]) => key.endsWith(`:${blockType}`) && typeof template === "string",
  )?.[1]

const renderTemplateIfConfigured = ({
  blockType,
  options,
  props,
}: {
  blockType: AstBlock["type"]
  options: ExportOptions
  props: Record<string, TemplateValue>
}) => {
  const template = findTemplateForBlock({
    blockType,
    options,
  })

  return template
    ? renderBlockTemplates([
        {
          template,
          props,
        },
      ])
    : null
}

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

  const renderImageWithSelection = async ({ image }: { image: ImageData }) => {
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

    const templateMarkdown = renderTemplateIfConfigured({
      blockType: "image",
      options,
      props: {
        url: assetPath,
        alt: image.alt,
        caption: image.caption,
      },
    })

    if (templateMarkdown !== null) {
      return templateMarkdown
    }

    return renderImageBlockMarkdown({
      image: {
        ...image,
        originalSourceUrl: image.originalSourceUrl ?? renderableSourceUrl,
      },
      assetPath,
    })
  }

  const renderTableBlock = (block: Extract<AstBlock, { type: "table" }>) => {
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
      sections.push(
        renderTemplateIfConfigured({
          blockType: block.type,
          options,
          props: {
            text: block.text,
          },
        }) ?? renderParagraph(block.text),
      )
      continue
    }

    if (block.type === "heading") {
      sections.push(
        renderTemplateIfConfigured({
          blockType: block.type,
          options,
          props: {
            level: block.level,
            text: block.text,
          },
        }) ?? `${"#".repeat(block.level)} ${block.text}`,
      )
      continue
    }

    if (block.type === "quote") {
      sections.push(
        renderTemplateIfConfigured({
          blockType: block.type,
          options,
          props: {
            text: block.text,
          },
        }) ?? renderQuote(block.text),
      )
      continue
    }

    if (block.type === "divider") {
      sections.push(
        renderTemplateIfConfigured({
          blockType: block.type,
          options,
          props: {},
        }) ?? "---",
      )
      continue
    }

    if (block.type === "code") {
      sections.push(
        renderTemplateIfConfigured({
          blockType: block.type,
          options,
          props: {
            language: block.language,
            code: block.code,
          },
        }) ??
          renderCodeBlock({
            language: block.language,
            code: block.code,
          }),
      )
      continue
    }

    if (block.type === "formula") {
      sections.push(
        renderTemplateIfConfigured({
          blockType: block.type,
          options,
          props: {
            formula: block.formula,
            display: block.display,
          },
        }) ??
          renderFormula({
            formula: block.formula,
            display: block.display,
          }),
      )
      continue
    }

    if (block.type === "image") {
      sections.push(
        await renderImageWithSelection({
          image: block.image,
        }),
      )
      continue
    }

    if (block.type === "imageGroup") {
      const groupSections: string[] = []

      for (const image of block.images) {
        groupSections.push(
          await renderImageWithSelection({
            image,
          }),
        )
      }

      sections.push(groupSections.join("\n\n"))
      continue
    }

    if (block.type === "video") {
      sections.push(
        renderTemplateIfConfigured({
          blockType: block.type,
          options,
          props: {
            title: block.video.title,
            url: block.video.sourceUrl,
            thumbnailUrl: block.video.thumbnailUrl,
            width: block.video.width,
            height: block.video.height,
          },
        }) ??
          renderVideoBlock({
            block,
            formatLink: inlineLinkFormatter.formatLink,
          }),
      )
      continue
    }

    if (block.type === "table") {
      const markdown = renderTableBlock(block)
      sections.push(
        renderTemplateIfConfigured({
          blockType: block.type,
          options,
          props: {
            markdown,
            html: block.html,
          },
        }) ?? markdown,
      )
    }
  }

  return sections.filter(Boolean).join("\n\n").trim()
}
