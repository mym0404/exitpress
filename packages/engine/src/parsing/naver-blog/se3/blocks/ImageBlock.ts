import { normalizeAssetUrl } from "@exitpress/domain/blog/NaverUrl.js"

import type { ImageData } from "@exitpress/domain/parser/schema/Media.js"
import type { CheerioAPI } from "cheerio"

import type { ParserBlockContext, ParserBlockTemplateDefinition } from "../../core/ParserBlock.js"

import { createImageBlocks, createParagraphBlock } from "../../core/ParsedBlockOutput.js"
import { LeafParserBlock } from "../../core/ParserBlock.js"

import { findInComponentRoot, textOutsideNestedComponents } from "./util/ComponentBoundary.js"

const image360PreviewSelector = ".__se_360vr_preview"
const standaloneImageSelector = `img, video._gifmp4.se_mediaImage[data-gif-url], ${image360PreviewSelector}`

const toParagraphBlockId = (blockId: string) =>
  blockId.replace(/:image$/, ":paragraph").replace(/^image$/, "paragraph")

const getBackgroundImageUrl = (style: string | undefined) => {
  const match = style?.match(/background-image\s*:\s*url\((['"]?)(.*?)\1\)/i)
  const sourceUrl = match?.[2]?.trim()

  return sourceUrl || null
}

const getStandaloneImageContent = ({
  $,
  $component,
}: {
  $: CheerioAPI
  $component: ReturnType<CheerioAPI>
}) => {
  const images = findInComponentRoot({ $, $component, selector: standaloneImageSelector })
    .toArray()
    .map((node): ImageData | null => {
      const $image = $(node)
      const isGifVideoImage = $image.is("video")
      const sourceUrl = $image.is(image360PreviewSelector)
        ? getBackgroundImageUrl($image.attr("style"))
        : isGifVideoImage
          ? $image.attr("data-gif-url")!
          : ($image.attr("data-lazy-src") ?? $image.attr("src") ?? "")
      const originalSourceUrl = isGifVideoImage ? normalizeAssetUrl($image.attr("src") ?? "") : null
      const normalizedSourceUrl = normalizeAssetUrl(sourceUrl ?? "")

      if (!sourceUrl?.trim()) {
        return null
      }

      return {
        sourceUrl: normalizedSourceUrl,
        originalSourceUrl:
          originalSourceUrl && originalSourceUrl !== normalizedSourceUrl ? originalSourceUrl : null,
        /* v8 ignore next */
        alt: $image.attr("alt") ?? "",
        caption: null,
        mediaKind: "image",
      } satisfies ImageData
    })
    .filter((image): image is ImageData => image !== null)

  const text = textOutsideNestedComponents({
    $component,
    selector: standaloneImageSelector,
  })

  return { images, text }
}

export class NaverSe3ImageBlock extends LeafParserBlock {
  override readonly id = "image"
  override readonly label = "이미지"
  override readonly templateDefinition = {
    label: this.label,
    presets: [
      {
        id: "default",
        label: "이미지 마크다운",
        template: "{{ `![${alt}](${url})` }}",
      },
    ],
    props: {
      alt: { label: "대체 텍스트", type: "string" },
      url: { label: "URL", type: "string" },
      caption: { label: "캡션", type: "string?" },
    },
  } satisfies ParserBlockTemplateDefinition

  override match({ $, $node }: ParserBlockContext) {
    return (
      ($node.hasClass("se_image") || $node.hasClass("se_sticker")) &&
      getStandaloneImageContent({ $, $component: $node }).images.length > 0
    )
  }

  override convert({ $, $node, options, blockId }: Parameters<LeafParserBlock["convert"]>[0]) {
    const { images, text } = getStandaloneImageContent({ $, $component: $node })
    const blocks = createImageBlocks({ blockId, images, options })

    if (text) {
      blocks.push(createParagraphBlock({ blockId: toParagraphBlockId(blockId), text }))
    }

    return blocks
  }
}
