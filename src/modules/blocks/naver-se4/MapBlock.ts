import type { OutputOption } from "../../../shared/Types.js"
import { compactText } from "../../../shared/Utils.js"
import {LeafBlock, type ParserBlockContext} from "../BaseBlock.js"
import { parseJsonAttribute } from "./JsonAttribute.js"

const buildNaverMapSearchUrl = (query: string) =>
  `https://map.naver.com/p/search/${encodeURIComponent(query)}`

export class NaverSe4MapBlock extends LeafBlock {
  override readonly id = "linkCard"
  override readonly label = "지도"
  override readonly outputOptions = [
    {
      id: "title-link",
      label: "title link",
      description: "카드 제목을 inline 링크로 출력합니다.",
      preview: {
        type: "linkCard",
        card: {
          title: "External article",
          description: "preview text",
          url: "https://example.com/article",
          imageUrl: "https://example.com/cover.png",
        },
      },
      isDefault: true,
    },
    {
      id: "reference-link",
      label: "reference link",
      description: "카드 제목 링크를 reference 형식으로 분리합니다.",
      preview: {
        type: "linkCard",
        card: {
          title: "External article",
          description: "preview text",
          url: "https://example.com/article",
          imageUrl: "https://example.com/cover.png",
        },
      },
    },
  ] satisfies OutputOption<"linkCard">[]

  override match({ $node, moduleType }: ParserBlockContext) {
    return moduleType === "v2_map" || $node.hasClass("se-placesMap")
  }

  override convert({ $node, moduleData }: Parameters<LeafBlock["convert"]>[0]) {
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

      return [
        {
          type: "linkCard" as const,
          card: {
            title,
            description,
            url:
              typeof place.bookingUrl === "string" && place.bookingUrl.trim()
                ? place.bookingUrl.trim()
                : buildNaverMapSearchUrl(title),
            imageUrl: null,
          },
        },
      ]
    })

    if (placesFromModule.length > 0) {
      return placesFromModule
    }

    const blocks = $node
      .find("a.se-map-info")
      .toArray()
      .flatMap((node) => {
        const $link = $node.find(node)
        const linkData = parseJsonAttribute($link.attr("data-linkdata"))
        const title = compactText($link.find(".se-map-title").text()) || compactText(String(linkData?.name ?? ""))
        /* v8 ignore next */
        const description =
          compactText($link.find(".se-map-address").text()) || compactText(String(linkData?.address ?? ""))

        /* v8 ignore next 3 */
        if (!title) {
          return []
        }

        return [
          {
            type: "linkCard" as const,
            card: {
              title,
              description,
              url:
                typeof linkData?.bookingUrl === "string" && linkData.bookingUrl.trim()
                  ? linkData.bookingUrl.trim()
                  : buildNaverMapSearchUrl(title),
              imageUrl: null,
            },
          },
        ]
      })

    return blocks
  }
}
