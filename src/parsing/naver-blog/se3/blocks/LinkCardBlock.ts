import type { ParserBlockContext } from "../../core/BaseBlock.js"

import { compactText } from "../../../../shared/text/TextUtils.js"
import { createLinkParagraphBlocks } from "../../common/LinkParagraph.js"
import { LeafBlock } from "../../core/BaseBlock.js"
import { parseJsonAttribute } from "../../core/JsonAttribute.js"

import { findInComponentRoot } from "./util/ComponentBoundary.js"

export class NaverSe3LinkCardBlock extends LeafBlock {
  override readonly id = "linkCard"
  override readonly label = "링크 카드"

  override match({ $node }: ParserBlockContext) {
    return $node.hasClass("se_oglink")
  }

  override convert({ $, $node, options }: Parameters<LeafBlock["convert"]>[0]) {
    const linkNode = findInComponentRoot({ $, $component: $node, selector: "a.se_og_box" }).first()
    const linkData = parseJsonAttribute(linkNode.attr("data-linkdata"))
    const url = linkNode.attr("href") ?? (typeof linkData?.link === "string" ? linkData.link : "")

    if (!url) {
      throw new Error("SE3 link card block parsing failed.")
    }

    const thumbnail = findInComponentRoot({
      $,
      $component: $node,
      selector: ".se_og_thumb img",
    }).first()
    const title = compactText(
      findInComponentRoot({ $, $component: $node, selector: ".se_og_tit" }).first().text(),
    )
    const description = findInComponentRoot({ $, $component: $node, selector: ".se_og_desc" })
      .first()
      .text()

    return createLinkParagraphBlocks({
      title: title || url,
      description,
      url,
      hasThumbnail: Boolean(thumbnail.attr("data-lazy-src") ?? thumbnail.attr("src")),
      resolveLinkUrl: options.resolveLinkUrl,
    })
  }
}
