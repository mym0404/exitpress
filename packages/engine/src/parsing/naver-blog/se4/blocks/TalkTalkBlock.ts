import { compactText } from "@exitpress/engine/shared/text/util/TextCompaction.js"

import type { ParserBlockContext, ParserBlockTemplateDefinition } from "../../core/ParserBlock.js"

import { createLinkParagraphBlocks } from "../../common/LinkParagraph.js"
import { LeafParserBlock } from "../../core/ParserBlock.js"

export class NaverSe4TalkTalkBlock extends LeafParserBlock {
  override readonly id = "talkTalk"
  override readonly label = "톡톡 링크"
  override readonly templateDefinition = {
    label: this.label,
    presets: [{ id: "default", label: "기본", template: "${text}" }],
    props: {
      text: { label: "본문", type: "string" },
    },
  } satisfies ParserBlockTemplateDefinition

  override match({ $node }: ParserBlockContext) {
    return $node.hasClass("se-talktalk")
  }

  override convert({ $node, blockId, options }: Parameters<LeafParserBlock["convert"]>[0]) {
    const talkTalkLink = $node.find("a.se-module-talktalk").first()
    const url = talkTalkLink.attr("href") ?? ""

    if (!url) {
      throw new Error("SE4 TalkTalk block parsing failed.")
    }

    return createLinkParagraphBlocks({
      blockId,
      title: compactText($node.find(".se-talktalk-banner-text").text()) || url,
      description: "",
      url,
      hasThumbnail: false,
      resolveLinkUrl: options.resolveLinkUrl,
    })
  }
}
