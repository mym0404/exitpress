import type { OutputOption, UnknownRecord } from "../../../shared/Types.js"
import { compactText } from "../../../shared/Utils.js"
import {LeafBlock, type ParserBlockContext} from "../BaseBlock.js"

export class NaverSe4FileBlock extends LeafBlock {
  override readonly id = "linkCard"
  override readonly label = "첨부파일"
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
    return moduleType === "v2_file" || $node.hasClass("se-file")
  }

  override convert({ $node, moduleData }: Parameters<LeafBlock["convert"]>[0]) {
    const data = ((moduleData ?? {}).data ?? {}) as UnknownRecord & {
      link?: string
    }
    const url = $node.find("a.se-file-save-button").attr("href") ?? data.link ?? ""

    if (!url) {
      throw new Error("SE4 file block parsing failed.")
    }

    const title = [
      compactText($node.find(".se-file-name").text()),
      compactText($node.find(".se-file-extension").text()),
    ].join("")

    return [
      {
        type: "linkCard" as const,
        card: {
          title: title || url,
          description: "",
          url,
          imageUrl: null,
        },
      },
    ]
  }
}
