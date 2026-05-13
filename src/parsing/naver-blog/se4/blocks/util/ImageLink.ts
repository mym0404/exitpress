import type { CheerioAPI } from "cheerio"
import type { ImageData } from "../../../../../domain/ast/Types.js"
import { normalizeAssetUrl } from "../../../../../domain/blog/NaverUrl.js"
import { compactText } from "../../../../../shared/text/TextUtils.js"
import { parseJsonAttribute } from "../../../core/JsonAttribute.js"

export const se4ImageLinkSelector = "a.se-module-image-link, a.__se_image_link"

export const parseImageLink = ($link: ReturnType<CheerioAPI>) => {
  const linkData = parseJsonAttribute($link.attr("data-linkdata"))
  const imageNode = $link.find("img").first()
  const sourceUrl = [
    typeof linkData?.src === "string" ? linkData.src : null,
    imageNode.attr("data-lazy-src"),
    imageNode.attr("src"),
  ]
    .find((candidate): candidate is string => Boolean(candidate?.trim()))
    ?.trim()

  const caption =
    compactText($link.closest(".se-component").find(".se-image-caption").text()) || null

  if (!sourceUrl) {
    return null
  }

  return {
    sourceUrl: normalizeAssetUrl(sourceUrl),
    originalSourceUrl: typeof linkData?.src === "string" ? normalizeAssetUrl(linkData.src) : null,
    alt: imageNode.attr("alt") ?? "",
    caption,
    mediaKind: "image",
  } satisfies ImageData
}
