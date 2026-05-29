import type { ParserBlockContext } from "../../core/BaseBlock.js"
import { compactText } from "../../../../shared/text/TextUtils.js"
import { createLinkParagraphBlocks } from "../../common/LinkParagraph.js"
import { LeafBlock } from "../../core/BaseBlock.js"
import { findInComponentRoot } from "./util/ComponentBoundary.js"

export class NaverSe3FileBlock extends LeafBlock {
  override readonly id = "linkCard"
  override readonly label = "첨부파일"

  override match({ $node }: ParserBlockContext) {
    return $node.hasClass("se_file") && $node.hasClass("default")
  }

  override convert({ $, $node, options }: Parameters<LeafBlock["convert"]>[0]) {
    const fileArea = findInComponentRoot({
      $,
      $component: $node,
      selector: ".se_name_area",
    }).first()
    const link = fileArea.is("a[href]") ? fileArea : fileArea.find("a[href]").first()
    const url = link.attr("href") ?? ""

    if (!url) {
      throw new Error("SE3 file block parsing failed.")
    }

    return createLinkParagraphBlocks({
      title: compactText(fileArea.find(".se_name").text()) || compactText(link.text()) || url,
      description: "",
      url,
      hasThumbnail: false,
      resolveLinkUrl: options.resolveLinkUrl,
    })
  }
}
