import type { CheerioAPI } from "cheerio"

import type { ImageData } from "../../../../domain/parser/Types.js"
import type { ParserBlockContext } from "../../core/BaseBlock.js"

import { normalizeAssetUrl } from "../../../../domain/blog/NaverUrl.js"
import { LeafBlock } from "../../core/BaseBlock.js"

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

export class NaverSe2InlineGifVideoBlock extends LeafBlock {
  override readonly id = "inlineGifVideo"
  override readonly label = "인라인 GIF 비디오"

  override match({ node, $node }: ParserBlockContext) {
    return node.type === "tag" && getInlineGifVideoImages({ $node }) !== null
  }

  override convert({ $node }: Parameters<LeafBlock["convert"]>[0]) {
    const images = getInlineGifVideoImages({ $node })

    if (!images) {
      throw new Error("SE2 inline GIF video block parsing failed.")
    }

    if (images.length === 1) {
      return [{ type: "image" as const, image: images[0]! }]
    }

    return [{ type: "imageGroup" as const, images }]
  }
}
