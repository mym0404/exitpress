import { linkCardOutputOptions } from "../../../shared/BlockOutputOptions.js"
import { compactText, normalizeAssetUrl } from "../../../shared/Utils.js"
import { LeafBlock } from "../BaseBlock.js"
import type { ParserBlockContext } from "../ParserNode.js"

export class NaverSe4LinkCardBlock extends LeafBlock {
  override readonly id = "linkCard"
  override readonly label = "링크 카드"
  override readonly outputOptions = linkCardOutputOptions

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
