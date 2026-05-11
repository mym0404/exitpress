import type { UnknownRecord } from "../../../../shared/object/UnknownRecord.js"
import type { ParserBlockContext } from "../../core/BaseBlock.js"
import { compactText } from "../../../../shared/text/TextUtils.js"
import { createLinkParagraphBlocks } from "../../common/LinkParagraph.js"
import { LeafBlock } from "../../core/BaseBlock.js"

export class NaverSe4FileBlock extends LeafBlock {
  override readonly id = "linkCard"
  override readonly label = "첨부파일"

  override match({ $node, moduleType }: ParserBlockContext) {
    return moduleType === "v2_file" || $node.hasClass("se-file")
  }

  override convert({ $node, moduleData, options }: Parameters<LeafBlock["convert"]>[0]) {
    const data = (moduleData?.data ?? {}) as UnknownRecord & {
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

    return createLinkParagraphBlocks({
      title: title || url,
      description: "",
      url,
      hasThumbnail: false,
      resolveLinkUrl: options.resolveLinkUrl,
    })
  }
}
