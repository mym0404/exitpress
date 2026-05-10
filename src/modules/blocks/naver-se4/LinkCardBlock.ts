import type { OutputOption } from "../../../shared/Types.js"
import { compactText, normalizeAssetUrl } from "../../../shared/Utils.js"
import {LeafBlock, type ParserBlockContext} from "../BaseBlock.js"

export class NaverSe4LinkCardBlock extends LeafBlock {
  override readonly id = "linkCard"
  override readonly label = "링크 카드"
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
