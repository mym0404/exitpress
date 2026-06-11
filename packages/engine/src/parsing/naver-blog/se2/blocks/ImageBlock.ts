import { normalizeAssetUrl } from "@exitpress/domain/blog/NaverUrl.js"
import { compactText } from "@exitpress/engine/shared/text/util/TextCompaction.js"

import type { ImageData } from "@exitpress/domain/parser/schema/Media.js"
import type { CheerioAPI } from "cheerio"

import type { ParserBlockContext, ParserBlockTemplateDefinition } from "../../core/ParserBlock.js"

import { createImageBlocks } from "../../core/ParsedBlockOutput.js"
import { LeafParserBlock } from "../../core/ParserBlock.js"

const standaloneImageSelector = "img, [thumburl]"
const standaloneRootImageSelector = "img.fx, img._postImage, [thumburl]"
const naverBlankImageUrl = "https://ssl.pstatic.net/static/blog/blank.gif"

const isNaverBlankImageUrl = (sourceUrl: string) => sourceUrl === naverBlankImageUrl

const getStandaloneImages = ({
  $,
  element,
}: {
  $: CheerioAPI
  element: ReturnType<CheerioAPI>
}) => {
  const images = $(element)
    .filter(standaloneRootImageSelector)
    .add($(element).find(standaloneImageSelector))
    .toArray()
    .map((imageNode): ImageData | null => {
      const $image = $(imageNode)
      const sourceUrl = normalizeAssetUrl($image.attr("src") ?? $image.attr("thumburl") ?? "")

      if (!sourceUrl || isNaverBlankImageUrl(sourceUrl)) {
        return null
      }

      return {
        sourceUrl,
        originalSourceUrl: null,
        alt: $image.attr("alt") ?? "",
        caption: null,
        mediaKind: "image",
      } satisfies ImageData
    })
    .filter((image): image is ImageData => image !== null)

  const textWithoutImages = compactText(
    $(element).clone().find(standaloneImageSelector).remove().end().text(),
  )

  return textWithoutImages ? [] : images
}

const hasOnlyStandaloneBlankImages = ({
  $,
  element,
}: {
  $: CheerioAPI
  element: ReturnType<CheerioAPI>
}) => {
  const imageNodes = $(element)
    .filter(standaloneImageSelector)
    .add($(element).find(standaloneImageSelector))
    .toArray()

  if (imageNodes.length === 0) {
    return false
  }

  const textWithoutImages = compactText(
    $(element).clone().find(standaloneImageSelector).remove().end().text(),
  )

  return (
    !textWithoutImages &&
    imageNodes.every((imageNode) =>
      isNaverBlankImageUrl(
        normalizeAssetUrl($(imageNode).attr("src") ?? $(imageNode).attr("thumburl") ?? ""),
      ),
    )
  )
}

export class NaverSe2ImageBlock extends LeafParserBlock {
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

  override match({ node, $, $node }: ParserBlockContext) {
    return (
      node.type === "tag" &&
      (getStandaloneImages({ $, element: $node }).length > 0 ||
        hasOnlyStandaloneBlankImages({ $, element: $node }))
    )
  }

  override convert({ $, $node, options, blockId }: Parameters<LeafParserBlock["convert"]>[0]) {
    const standaloneImages = getStandaloneImages({ $, element: $node })

    return createImageBlocks({ blockId, images: standaloneImages, options })
  }
}
