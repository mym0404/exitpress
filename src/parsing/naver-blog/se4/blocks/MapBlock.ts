import type { ParserBlockContext } from "../../core/BaseBlock.js"

import { compactText } from "../../../../shared/text/TextUtils.js"
import { createLinkParagraphBlocks } from "../../common/LinkParagraph.js"
import { LeafBlock } from "../../core/BaseBlock.js"
import { parseJsonAttribute } from "../../core/JsonAttribute.js"

const buildNaverMapSearchUrl = (query: string) =>
  `https://map.naver.com/p/search/${encodeURIComponent(query)}`

export class NaverSe4MapBlock extends LeafBlock {
  override readonly id = "map"
  override readonly label = "지도"

  override match({ $node, moduleType }: ParserBlockContext) {
    return moduleType === "v2_map" || $node.hasClass("se-placesMap")
  }

  override convert({ $node, moduleData, blockId, options }: Parameters<LeafBlock["convert"]>[0]) {
    const data = (moduleData?.data ?? {}) as {
      places?: Array<{
        placeId?: string
        name?: string
        address?: string
        bookingUrl?: string | null
      }>
    }

    const placesFromModule = (data.places ?? []).flatMap((place) => {
      /* v8 ignore next */
      const title = compactText(place.name ?? "")
      /* v8 ignore next */
      const description = compactText(place.address ?? "")

      if (!title) {
        return []
      }

      return createLinkParagraphBlocks({
        blockId,
        title,
        description,
        url:
          typeof place.bookingUrl === "string" && place.bookingUrl.trim()
            ? place.bookingUrl.trim()
            : buildNaverMapSearchUrl(title),
        hasThumbnail: false,
        resolveLinkUrl: options.resolveLinkUrl,
      })
    })

    if (placesFromModule.length > 0) {
      return placesFromModule
    }

    const mapLinks = $node.find("a.se-map-info")
    const blocks = mapLinks.toArray().flatMap((node) => {
      const $link = $node.find(node)
      const linkData = parseJsonAttribute($link.attr("data-linkdata"))
      const title =
        compactText($link.find(".se-map-title").text()) || compactText(String(linkData?.name ?? ""))
      /* v8 ignore next */
      const description =
        compactText($link.find(".se-map-address").text()) ||
        compactText(String(linkData?.address ?? ""))

      if (!title) {
        return []
      }

      return createLinkParagraphBlocks({
        blockId,
        title,
        description,
        url:
          typeof linkData?.bookingUrl === "string" && linkData.bookingUrl.trim()
            ? linkData.bookingUrl.trim()
            : buildNaverMapSearchUrl(title),
        hasThumbnail: false,
        resolveLinkUrl: options.resolveLinkUrl,
      })
    })

    if (blocks.length === 0 && (data.places?.length || mapLinks.length > 0)) {
      throw new Error("SE4 map block parsing failed.")
    }

    return blocks
  }
}
