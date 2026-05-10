import type { OutputOption } from "../../../shared/Types.js"
import { compactText, normalizeAssetUrl } from "../../../shared/Utils.js"
import {LeafBlock, type ParserBlockContext} from "../BaseBlock.js"

const getLinkDataUrl = (value?: string) => {
  if (!value) {
    return ""
  }

  try {
    const data = JSON.parse(value) as { link?: unknown }

    return typeof data.link === "string" ? data.link : ""
  } catch {
    return ""
  }
}

export class NaverSe3LinkCardBlock extends LeafBlock {
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

  override match({ $node }: ParserBlockContext) {
    return $node.hasClass("se_oglink")
  }

  override convert({ $node }: Parameters<LeafBlock["convert"]>[0]) {
    const linkNode = $node.find("a.se_og_box").first()
    const url = linkNode.attr("href") ?? getLinkDataUrl(linkNode.attr("data-linkdata"))

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
