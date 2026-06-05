import type { AstBlock, ImageData, ParsedPost as AstParsedPost } from "../domain/ast/Types.js"
import type { ExportOptions } from "../domain/export-options/Types.js"
import type {
  AssetCandidate,
  BlockRenderInput,
  ParsedPost,
  TemplateValue,
} from "../domain/template/Types.js"

import {
  createLinkFormatter,
  renderCodeBlock,
  renderFormula,
  renderGfmTable,
  renderParagraph,
  renderQuote,
} from "./BlockMarkdown.js"
import { convertHtmlToMarkdown } from "./TurndownMarkdownConverter.js"

const findTemplateForBlock = ({
  blockType,
  blockOutputs,
}: {
  blockType: AstBlock["type"]
  blockOutputs: ExportOptions["blockOutputs"]
}) =>
  Object.entries(blockOutputs.templates).find(
    ([key, template]) => key.endsWith(`:${blockType}`) && typeof template === "string",
  )?.[1]

const toRenderInput = ({
  blockType,
  blockOutputs,
  fallbackTemplate,
  props,
}: {
  blockType: AstBlock["type"]
  blockOutputs: ExportOptions["blockOutputs"]
  fallbackTemplate: string
  props: Record<string, TemplateValue>
}): BlockRenderInput => ({
  template:
    findTemplateForBlock({
      blockType,
      blockOutputs,
    }) ?? fallbackTemplate,
  props,
})

const createImageRenderInput = ({
  image,
  blockType,
  blockOutputs,
  assets,
  inputIndex,
}: {
  image: ImageData
  blockType: Extract<AstBlock["type"], "image" | "imageGroup">
  blockOutputs: ExportOptions["blockOutputs"]
  assets?: ExportOptions["assets"]
  inputIndex: number
}) => {
  const sourceUrl =
    image.mediaKind === "sticker"
      ? assets?.stickerAssetMode === "download-original"
        ? (image.originalSourceUrl ?? image.sourceUrl)
        : null
      : image.sourceUrl

  if (!sourceUrl) {
    return null
  }

  const renderInput = toRenderInput({
    blockType,
    blockOutputs,
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

export const convertAstParsedPostToTemplatePost = ({
  parsedPost,
  blockOutputs,
  assets,
  resolveLinkUrl,
}: {
  parsedPost: AstParsedPost
  blockOutputs: ExportOptions["blockOutputs"]
  assets?: ExportOptions["assets"]
  resolveLinkUrl?: (url: string) => string
}): ParsedPost => {
  const renderInputs: BlockRenderInput[] = []
  const assetCandidates: AssetCandidate[] = []
  const linkFormatter = createLinkFormatter({ resolveLinkUrl })

  const pushImage = ({
    image,
    blockType,
  }: {
    image: ImageData
    blockType: Extract<AstBlock["type"], "image" | "imageGroup">
  }) => {
    const { renderInput, assetCandidate } = createImageRenderInput({
      image,
      blockType,
      blockOutputs,
      assets,
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

  for (const block of parsedPost.blocks) {
    if (block.type === "paragraph") {
      renderInputs.push(
        toRenderInput({
          blockType: block.type,
          blockOutputs,
          fallbackTemplate: "${markdown}",
          props: {
            text: block.text,
            markdown: renderParagraph(block.text),
          },
        }),
      )
      continue
    }

    if (block.type === "heading") {
      const markdown = `${"#".repeat(block.level)} ${block.text}`

      renderInputs.push(
        toRenderInput({
          blockType: block.type,
          blockOutputs,
          fallbackTemplate: "${markdown}",
          props: {
            level: block.level,
            text: block.text,
            markdown,
          },
        }),
      )
      continue
    }

    if (block.type === "quote") {
      renderInputs.push(
        toRenderInput({
          blockType: block.type,
          blockOutputs,
          fallbackTemplate: "${markdown}",
          props: {
            text: block.text,
            markdown: renderQuote(block.text),
          },
        }),
      )
      continue
    }

    if (block.type === "divider") {
      renderInputs.push(
        toRenderInput({
          blockType: block.type,
          blockOutputs,
          fallbackTemplate: "---",
          props: {},
        }),
      )
      continue
    }

    if (block.type === "code") {
      renderInputs.push(
        toRenderInput({
          blockType: block.type,
          blockOutputs,
          fallbackTemplate: "${markdown}",
          props: {
            language: block.language,
            code: block.code,
            markdown: renderCodeBlock({
              language: block.language,
              code: block.code,
            }),
          },
        }),
      )
      continue
    }

    if (block.type === "formula") {
      renderInputs.push(
        toRenderInput({
          blockType: block.type,
          blockOutputs,
          fallbackTemplate: "${markdown}",
          props: {
            formula: block.formula,
            display: block.display,
            markdown: renderFormula({
              formula: block.formula,
              display: block.display,
            }),
          },
        }),
      )
      continue
    }

    if (block.type === "image") {
      pushImage({ image: block.image, blockType: block.type })
      continue
    }

    if (block.type === "imageGroup") {
      block.images.forEach((image) => {
        pushImage({ image, blockType: block.type })
      })
      continue
    }

    if (block.type === "video") {
      renderInputs.push(
        toRenderInput({
          blockType: block.type,
          blockOutputs,
          fallbackTemplate: "${markdown}",
          props: {
            title: block.video.title,
            url: block.video.sourceUrl,
            thumbnailUrl: block.video.thumbnailUrl,
            width: block.video.width,
            height: block.video.height,
            markdown: linkFormatter.formatLink({
              label: block.video.title || block.video.sourceUrl,
              url: block.video.sourceUrl,
            }),
          },
        }),
      )
      continue
    }

    const markdown =
      block.rows.length > 0
        ? renderGfmTable(block)
        : convertHtmlToMarkdown({
            html: block.html,
            resolveLinkUrl,
          })

    renderInputs.push(
      toRenderInput({
        blockType: block.type,
        blockOutputs,
        fallbackTemplate: "${markdown}",
        props: {
          markdown,
          html: block.html,
        },
      }),
    )
  }

  return {
    tags: parsedPost.tags,
    renderInputs,
    assetCandidates,
    videos: parsedPost.videos,
  }
}
