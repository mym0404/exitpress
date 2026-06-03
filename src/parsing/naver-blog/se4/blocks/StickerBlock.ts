import type { ParserBlockContext } from "../../core/BaseBlock.js"

import { normalizeAssetUrl } from "../../../../domain/blog/NaverUrl.js"
import { LeafBlock } from "../../core/BaseBlock.js"
import { parseJsonAttribute } from "../../core/JsonAttribute.js"

export class NaverSe4StickerBlock extends LeafBlock {
  override readonly id = "sticker"
  override readonly label = "스티커"

  override match({ $node }: ParserBlockContext) {
    return $node.hasClass("se-sticker")
  }

  override convert({ $node }: Parameters<LeafBlock["convert"]>[0]) {
    const stickerLink = $node.find("a.__se_sticker_link").first()
    const linkData = parseJsonAttribute(stickerLink.attr("data-linkdata"))
    const previewSourceUrl = $node.find("img.se-sticker-image").attr("src")?.trim() ?? null
    const originalSourceUrl = typeof linkData?.src === "string" ? linkData.src.trim() : null
    const sourceUrl = [previewSourceUrl, originalSourceUrl]
      .find((candidate): candidate is string => Boolean(candidate?.trim()))
      ?.trim()

    if (!sourceUrl) {
      throw new Error("SE4 sticker block parsing failed.")
    }

    return [
      {
        type: "image" as const,
        image: {
          sourceUrl: normalizeAssetUrl(sourceUrl),
          originalSourceUrl: originalSourceUrl ? normalizeAssetUrl(originalSourceUrl) : null,
          alt: "",
          caption: null,
          mediaKind: "sticker" as const,
        },
      },
    ]
  }
}
