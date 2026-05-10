import { linkCardOutputOptions } from "../../../shared/BlockOutputOptions.js"
import type { UnknownRecord } from "../../../shared/Types.js"
import { compactText } from "../../../shared/Utils.js"
import { LeafBlock } from "../BaseBlock.js"
import type { ParserBlockContext } from "../ParserNode.js"

export class NaverSe4FileBlock extends LeafBlock {
  override readonly id = "linkCard"
  override readonly label = "첨부파일"
  override readonly outputOptions = linkCardOutputOptions

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
