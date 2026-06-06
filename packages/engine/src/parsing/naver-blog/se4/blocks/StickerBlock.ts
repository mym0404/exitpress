import { normalizeAssetUrl } from "@exitpress/domain/blog/NaverUrl.js"

import type { ParserBlockContext, ParserBlockTemplateDefinition } from "../../core/ParserBlock.js"

import { parseJsonAttribute } from "../../core/JsonAttribute.js"
import { createImageBlock } from "../../core/ParsedBlockOutput.js"
import { LeafParserBlock } from "../../core/ParserBlock.js"

export class NaverSe4StickerBlock extends LeafParserBlock {
  override readonly id = "sticker"
  override readonly label = "스티커"
  override readonly templateDefinition = {
    label: this.label,
    presets: [{ id: "default", label: "이미지 마크다운", template: "{{ `![${alt}](${url})` }}" }],
    props: {
      alt: { label: "대체 텍스트", type: "string" },
      url: { label: "URL", type: "string" },
      caption: { label: "캡션", type: "string?" },
    },
  } satisfies ParserBlockTemplateDefinition

  override match({ $node }: ParserBlockContext) {
    return $node.hasClass("se-sticker")
  }

  override convert({ $node, options, blockId }: Parameters<LeafParserBlock["convert"]>[0]) {
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

    const block = createImageBlock({
      blockId,
      options,
      image: {
        sourceUrl: normalizeAssetUrl(sourceUrl),
        originalSourceUrl: originalSourceUrl ? normalizeAssetUrl(originalSourceUrl) : null,
        alt: "",
        caption: null,
        mediaKind: "sticker" as const,
      },
    })

    return block ? [block] : []
  }
}
