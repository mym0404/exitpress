import type { ParserBlockContext, ParserBlockTemplateDefinition } from "../../core/ParserBlock.js"

import { compactText } from "../../../../shared/text/TextUtils.js"
import { createLinkParagraphBlocks } from "../../common/LinkParagraph.js"
import { LeafParserBlock } from "../../core/ParserBlock.js"

import { findInComponentRoot } from "./util/ComponentBoundary.js"

export class NaverSe3FileBlock extends LeafParserBlock {
  override readonly id = "file"
  override readonly label = "첨부파일"
  override readonly templateDefinition = {
    label: this.label,
    presets: [{ id: "default", label: "기본", template: "${text}" }],
    props: {
      text: { label: "본문", type: "string" },
    },
  } satisfies ParserBlockTemplateDefinition

  override match({ $node }: ParserBlockContext) {
    return $node.hasClass("se_file") && $node.hasClass("default")
  }

  override convert({ $, $node, blockId, options }: Parameters<LeafParserBlock["convert"]>[0]) {
    const link = findInComponentRoot({
      $,
      $component: $node,
      selector: "a.se_name_area[href]",
    }).first()
    const url = link.attr("href") ?? ""

    if (!url) {
      throw new Error("SE3 file block parsing failed.")
    }

    return createLinkParagraphBlocks({
      blockId,
      title: compactText(link.find(".se_name").text()) || url,
      description: "",
      url,
      hasThumbnail: false,
      resolveLinkUrl: options.resolveLinkUrl,
    })
  }
}
