import type { ParserBlockContext, ParserBlockTemplateDefinition } from "../../core/ParserBlock.js"

import { compactText } from "../../../../shared/text/TextUtils.js"
import { createLinkParagraphBlocks } from "../../common/LinkParagraph.js"
import { LeafParserBlock } from "../../core/ParserBlock.js"

export class NaverSe4LinkCardBlock extends LeafParserBlock {
  override readonly id = "linkCard"
  override readonly label = "링크 카드"
  override readonly templateDefinition = {
    label: this.label,
    presets: [{ id: "default", label: "기본", template: "${text}" }],
    props: {
      text: { label: "본문", type: "string" },
    },
  } satisfies ParserBlockTemplateDefinition

  override match({ $node, moduleType }: ParserBlockContext) {
    return moduleType === "v2_oglink" || $node.hasClass("se-oglink")
  }

  override convert({ $node, blockId, options }: Parameters<LeafParserBlock["convert"]>[0]) {
    const infoNode = $node.find(".se-oglink-info")
    const url = infoNode.attr("href") ?? $node.find(".se-oglink-thumbnail").attr("href") ?? ""

    if (!url) {
      throw new Error("SE4 link card block parsing failed.")
    }

    return createLinkParagraphBlocks({
      blockId,
      title: compactText($node.find(".se-oglink-title").text()) || url,
      description: $node.find(".se-oglink-summary").text(),
      url,
      hasThumbnail: Boolean($node.find(".se-oglink-thumbnail-resource").attr("src")),
      resolveLinkUrl: options.resolveLinkUrl,
    })
  }
}
