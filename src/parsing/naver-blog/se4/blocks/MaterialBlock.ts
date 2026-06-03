import type { ParserBlockContext } from "../../core/BaseBlock.js"

import { compactText } from "../../../../shared/text/TextUtils.js"
import { createLinkParagraphBlocks } from "../../common/LinkParagraph.js"
import { LeafBlock } from "../../core/BaseBlock.js"
import { parseJsonAttribute } from "../../core/JsonAttribute.js"

const parseCssUrl = (value: string | undefined) => value?.match(/url\((['"]?)(.*?)\1\)/)?.[2]

export class NaverSe4MaterialBlock extends LeafBlock {
  override readonly id = "linkCard"
  override readonly label = "자료 링크"

  override match({ $node }: ParserBlockContext) {
    return $node.hasClass("se-material") || $node.find(".not_sponsored_component").length > 0
  }

  override convert({ $node, options }: Parameters<LeafBlock["convert"]>[0]) {
    const customCard = $node.find(".not_sponsored_component").first()

    if (customCard.length > 0) {
      const link = customCard.find("a.link").first()
      const url = link.attr("href") ?? ""

      if (!url) {
        throw new Error("SE4 material block parsing failed.")
      }

      const thumbnailSource = parseCssUrl(customCard.find(".thumbnail").attr("style"))
      const description = [customCard.find(".label").text(), customCard.find(".date").text()]
        .map(compactText)
        .filter(Boolean)
        .join(" / ")

      return createLinkParagraphBlocks({
        title: compactText(customCard.find(".title").text()) || url,
        description,
        url,
        hasThumbnail: Boolean(thumbnailSource),
        resolveLinkUrl: options.resolveLinkUrl,
      })
    }

    const materialLink = $node.find("a.se-module-material").first()
    const linkData = parseJsonAttribute(materialLink.attr("data-linkdata"))
    const url =
      materialLink.attr("href") ?? (typeof linkData?.link === "string" ? linkData.link : "")

    if (!url) {
      throw new Error("SE4 material block parsing failed.")
    }

    const description = materialLink
      .find(".se-material-detail")
      .children()
      .toArray()
      .reduce(
        (state, node) => {
          const $detailNode = materialLink.find(node)

          if ($detailNode.hasClass("se-material-detail-title")) {
            return {
              currentTitle: compactText($detailNode.text()),
              entries: state.entries,
            }
          }

          if (!$detailNode.hasClass("se-material-detail-description")) {
            return state
          }

          const detail = compactText($detailNode.text())

          if (!detail) {
            return state
          }

          return {
            currentTitle: "",
            entries: [
              ...state.entries,
              state.currentTitle ? `${state.currentTitle}: ${detail}` : detail,
            ],
          }
        },
        {
          currentTitle: "",
          entries: [] as string[],
        },
      )
      .entries.join(" / ")

    const thumbnailSource =
      materialLink.find(".se-material-thumbnail-resource").attr("src") ??
      (typeof linkData?.thumbnail === "string" ? linkData.thumbnail : null)

    return createLinkParagraphBlocks({
      title:
        compactText(materialLink.find(".se-material-title").text()) ||
        (typeof linkData?.title === "string" ? compactText(linkData.title) : "") ||
        url,
      description,
      url,
      hasThumbnail: Boolean(thumbnailSource),
      resolveLinkUrl: options.resolveLinkUrl,
    })
  }
}
