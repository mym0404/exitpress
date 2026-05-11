import type { ParserBlockContext } from "../../core/BaseBlock.js"
import { normalizeAssetUrl } from "../../../../domain/blog/NaverUrl.js"
import { compactText } from "../../../../shared/text/TextUtils.js"
import { LeafBlock } from "../../core/BaseBlock.js"
import { parseJsonAttribute } from "../../core/JsonAttribute.js"

export class NaverSe3LinkCardBlock extends LeafBlock {
  override readonly id = "linkCard"
  override readonly label = "링크 카드"

  override match({ $node }: ParserBlockContext) {
    return $node.hasClass("se_oglink")
  }

  override convert({ $node }: Parameters<LeafBlock["convert"]>[0]) {
    const linkNode = $node.find("a.se_og_box").first()
    const linkData = parseJsonAttribute(linkNode.attr("data-linkdata"))
    const url = linkNode.attr("href") ?? (typeof linkData?.link === "string" ? linkData.link : "")

    if (!url) {
      throw new Error("SE3 link card block parsing failed.")
    }

    const thumbnailSource =
      $node.find(".se_og_thumb img").first().attr("data-lazy-src") ??
      $node.find(".se_og_thumb img").first().attr("src")

    return [
      {
        type: "linkCard" as const,
        card: {
          title: compactText($node.find(".se_og_tit").first().text()) || url,
          description: compactText($node.find(".se_og_desc").first().text()),
          url,
          imageUrl: thumbnailSource ? normalizeAssetUrl(thumbnailSource) : null,
        },
      },
    ]
  }
}
