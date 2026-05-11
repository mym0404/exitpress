import type { ParserBlockContext } from "../../core/BaseBlock.js"
import { normalizeAssetUrl } from "../../../../domain/blog/NaverUrl.js"
import { compactText } from "../../../../shared/text/TextUtils.js"
import { LeafBlock } from "../../core/BaseBlock.js"

export class NaverSe4LinkCardBlock extends LeafBlock {
  override readonly id = "linkCard"
  override readonly label = "링크 카드"

  override match({ $node, moduleType }: ParserBlockContext) {
    return moduleType === "v2_oglink" || $node.hasClass("se-oglink")
  }

  override convert({ $node }: Parameters<LeafBlock["convert"]>[0]) {
    const infoNode = $node.find(".se-oglink-info")
    const url = infoNode.attr("href") ?? $node.find(".se-oglink-thumbnail").attr("href") ?? ""

    if (!url) {
      throw new Error("SE4 link card block parsing failed.")
    }

    return [
      {
        type: "linkCard" as const,
        card: {
          title: compactText($node.find(".se-oglink-title").text()) || url,
          description: compactText($node.find(".se-oglink-summary").text()),
          url,
          imageUrl: (() => {
            const thumbnailSource = $node.find(".se-oglink-thumbnail-resource").attr("src")

            return thumbnailSource ? normalizeAssetUrl(thumbnailSource) : null
          })(),
        },
      },
    ]
  }
}
