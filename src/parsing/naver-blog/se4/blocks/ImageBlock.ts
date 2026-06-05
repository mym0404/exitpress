import type { ParserBlockContext, ParserBlockTemplateDefinition } from "../../core/BaseBlock.js"

import { normalizeAssetUrl } from "../../../../domain/blog/NaverUrl.js"
import { compactText } from "../../../../shared/text/TextUtils.js"
import { LeafBlock } from "../../core/BaseBlock.js"
import { createImageBlock } from "../../core/ParsedBlockOutput.js"

import { parseImageLink, se4ImageLinkSelector } from "./util/ImageLink.js"

const getBackgroundImageUrl = (style: string | undefined) => {
  const match = style?.match(/background-image\s*:\s*url\((['"]?)(.*?)\1\)/i)
  const sourceUrl = match?.[2]?.trim()

  return sourceUrl || null
}

export class NaverSe4ImageBlock extends LeafBlock {
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

  override match({ $node }: ParserBlockContext) {
    return $node.hasClass("se-image")
  }

  override convert({ $node, options, blockId }: Parameters<LeafBlock["convert"]>[0]) {
    const image =
      parseImageLink($node.find(se4ImageLinkSelector).first()) ??
      (() => {
        const sourceUrl = getBackgroundImageUrl(
          $node.find(".se-360vr-preview").first().attr("style"),
        )

        if (!sourceUrl) {
          return null
        }

        return {
          sourceUrl: normalizeAssetUrl(sourceUrl),
          originalSourceUrl: null,
          alt: "",
          caption: compactText($node.find(".se-image-caption").text()) || null,
          mediaKind: "image" as const,
        }
      })()

    if (!image) {
      throw new Error("SE4 image block parsing failed.")
    }

    const block = createImageBlock({ blockId, image, options })

    return block ? [block] : []
  }
}
