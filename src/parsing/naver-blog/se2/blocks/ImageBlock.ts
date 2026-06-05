import type { CheerioAPI } from "cheerio"

import type { ImageData } from "../../../../domain/ast/Types.js"
import type { ParserBlockContext, ParserBlockTemplateDefinition } from "../../core/BaseBlock.js"

import { normalizeAssetUrl } from "../../../../domain/blog/NaverUrl.js"
import { compactText } from "../../../../shared/text/TextUtils.js"
import { LeafBlock } from "../../core/BaseBlock.js"

const standaloneImageSelector = "img, [thumburl]"
const standaloneRootImageSelector = "img.fx, img._postImage, [thumburl]"

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

      if (!sourceUrl) {
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

export class NaverSe2ImageBlock extends LeafBlock {
  override readonly id = "image"
  override readonly label = "이미지"
  override readonly templateDefinition = {
    label: this.label,
    presets: [
      {
        id: "default",
        label: "기본",
        template: "![${alt}](${url})",
      },
    ],
    props: {
      alt: { label: "대체 텍스트", type: "string" },
      url: { label: "URL", type: "string" },
      caption: { label: "캡션", type: "string?" },
    },
  } satisfies ParserBlockTemplateDefinition

  override match({ node, $, $node }: ParserBlockContext) {
    return node.type === "tag" && getStandaloneImages({ $, element: $node }).length > 0
  }

  override convert({ $, $node }: Parameters<LeafBlock["convert"]>[0]) {
    const standaloneImages = getStandaloneImages({ $, element: $node })

    if (standaloneImages.length === 1) {
      return [{ type: "image" as const, image: standaloneImages[0]! }]
    }

    return [{ type: "imageGroup" as const, images: standaloneImages }]
  }
}
