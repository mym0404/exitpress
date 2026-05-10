import type { CheerioAPI } from "cheerio"

import { compactText } from "../../common/TextUtils.js"
import { normalizeAssetUrl } from "../../common/NaverUrlUtils.js"
import type { ImageData } from "../Types.js"
import {LeafBlock, type ParserBlockContext} from "../BaseBlock.js"

const getInlineGifVideoImage = ({ $node }: { $node: ReturnType<CheerioAPI> }): ImageData | null => {
  if (!$node.is("p, div, span")) {
    return null
  }

  const videos = $node.find("video.fx._postImage._gifmp4[data-gif-url]")

  if (videos.length !== 1) {
    return null
  }

  const video = videos.first()
  const cloneWithoutVideo = $node.clone()

  cloneWithoutVideo.find("video.fx._postImage._gifmp4").remove()

  if (cloneWithoutVideo.find("img, iframe, video, table").length > 0) {
    return null
  }

  const textWithoutVideo = compactText(
    cloneWithoutVideo.text(),
  )

  if (textWithoutVideo) {
    return null
  }

  /* v8 ignore next */
  const sourceUrl = normalizeAssetUrl(video.attr("data-gif-url") ?? video.attr("src") ?? "")
  const originalSourceUrl = normalizeAssetUrl(video.attr("src") ?? "")

  if (!sourceUrl) {
    return null
  }

  return {
    sourceUrl,
    /* v8 ignore next */
    originalSourceUrl: originalSourceUrl && originalSourceUrl !== sourceUrl ? originalSourceUrl : null,
    alt: video.attr("alt") ?? "",
    caption: null,
    mediaKind: "image",
  }
}

export class NaverSe2InlineGifVideoBlock extends LeafBlock {
  override readonly id = "inlineGifVideo"
  override readonly label = "인라인 GIF 비디오"

  override match({ node, $node }: ParserBlockContext) {
    return node.type === "tag" && getInlineGifVideoImage({ $node }) !== null
  }

  override convert({ $node }: Parameters<LeafBlock["convert"]>[0]) {
    const image = getInlineGifVideoImage({ $node })

    /* v8 ignore next 3 */
    if (!image) {
      return []
    }

    return [{ type: "image" as const, image }]
  }
}
