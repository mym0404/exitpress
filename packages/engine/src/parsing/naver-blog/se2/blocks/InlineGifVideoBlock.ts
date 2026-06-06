import { normalizeAssetUrl } from "@exitpress/domain/blog/NaverUrl.js"

import type { ImageData } from "@exitpress/domain/parser/Types.js"
import type { CheerioAPI } from "cheerio"

import type { ParserBlockContext, ParserBlockTemplateDefinition } from "../../core/ParserBlock.js"

import { createImageBlocks } from "../../core/ParsedBlockOutput.js"
import { LeafParserBlock } from "../../core/ParserBlock.js"

import { hasOnlyTargetContent } from "./util/WrapperContent.js"

const getInlineGifVideoImages = ({
  $node,
}: {
  $node: ReturnType<CheerioAPI>
}): ImageData[] | null => {
  if (!$node.is("p, div, span, strong, a, video")) {
    return null
  }

  const videos = $node.is("video.fx._postImage._gifmp4[data-gif-url]")
    ? $node
    : $node.find("video.fx._postImage._gifmp4[data-gif-url]")

  if (videos.length === 0) {
    return null
  }

  if (!$node.is("video")) {
    if (
      !hasOnlyTargetContent({
        element: $node,
        targetSelector: "video.fx._postImage._gifmp4",
      })
    ) {
      return null
    }
  }

  const images = videos.toArray().map((_, index): ImageData | null => {
    const video = videos.eq(index)
    /* v8 ignore next */
    const sourceUrl = normalizeAssetUrl(video.attr("data-gif-url") ?? video.attr("src") ?? "")
    const originalSourceUrl = normalizeAssetUrl(video.attr("src") ?? "")

    if (!sourceUrl) {
      return null
    }

    return {
      sourceUrl,
      /* v8 ignore next */
      originalSourceUrl:
        originalSourceUrl && originalSourceUrl !== sourceUrl ? originalSourceUrl : null,
      alt: video.attr("alt") ?? "",
      caption: null,
      mediaKind: "image",
    } satisfies ImageData
  })

  if (images.some((image) => image === null)) {
    return null
  }

  return images.filter((image): image is ImageData => image !== null)
}

export class NaverSe2InlineGifVideoBlock extends LeafParserBlock {
  override readonly id = "inlineGifVideo"
  override readonly label = "인라인 GIF 비디오"
  override readonly templateDefinition = {
    label: this.label,
    presets: [{ id: "default", label: "기본", template: "![${alt}](${url})" }],
    props: {
      alt: { label: "대체 텍스트", type: "string" },
      url: { label: "URL", type: "string" },
      caption: { label: "캡션", type: "string?" },
    },
  } satisfies ParserBlockTemplateDefinition

  override match({ node, $node }: ParserBlockContext) {
    return node.type === "tag" && getInlineGifVideoImages({ $node }) !== null
  }

  override convert({ $node, options, blockId }: Parameters<LeafParserBlock["convert"]>[0]) {
    const images = getInlineGifVideoImages({ $node })

    if (!images) {
      throw new Error("SE2 inline GIF video block parsing failed.")
    }

    return createImageBlocks({ blockId, images, options })
  }
}
