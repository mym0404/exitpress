import { load } from "cheerio"

import type { OutputOption, UnknownRecord } from "../../../shared/Types.js"
import { compactText, normalizeAssetUrl } from "../../../shared/Utils.js"
import {LeafBlock, type ParserBlockContext} from "../BaseBlock.js"

export class NaverSe4OembedBlock extends LeafBlock {
  override readonly id = "linkCard"
  override readonly label = "임베드"
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
    return moduleType === "v2_oembed" || $node.hasClass("se-oembed")
  }

  override convert({ moduleData }: Parameters<LeafBlock["convert"]>[0]) {
    const data = ((moduleData ?? {}).data ?? {}) as UnknownRecord & {
      html?: string
      inputUrl?: string
      thumbnailUrl?: string
      description?: string
      title?: string
      providerUrl?: string
    }
    const iframeUrl =
      typeof data.html === "string" && data.html
        ? load(data.html)("iframe").attr("src") ?? null
        : null
    const url = data.inputUrl ?? iframeUrl ?? data.providerUrl ?? ""

    if (!url) {
      throw new Error("SE4 oEmbed block parsing failed.")
    }

    return [
      {
        type: "linkCard" as const,
        card: {
          title: compactText(data.title ?? "") || url,
          description: compactText(data.description ?? ""),
          url,
          imageUrl:
            typeof data.thumbnailUrl === "string" ? normalizeAssetUrl(data.thumbnailUrl) : null,
        },
      },
    ]
  }
}
