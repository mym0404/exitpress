import { linkCardOutputOptions } from "../../../shared/BlockOutputOptions.js"
import { compactText } from "../../../shared/Utils.js"
import {LeafBlock, type ParserBlockContext} from "../BaseBlock.js"

export class NaverSe4TalkTalkBlock extends LeafBlock {
  override readonly id = "linkCard"
  override readonly label = "톡톡 링크"
  override readonly outputOptions = linkCardOutputOptions

  override match({ $node }: ParserBlockContext) {
    return $node.hasClass("se-talktalk")
  }

  override convert({ $node }: Parameters<LeafBlock["convert"]>[0]) {
    const talkTalkLink = $node.find("a.se-module-talktalk").first()
    const url = talkTalkLink.attr("href") ?? ""

    if (!url) {
      throw new Error("SE4 TalkTalk block parsing failed.")
    }

    return [
      {
        type: "linkCard" as const,
        card: {
          title: compactText($node.find(".se-talktalk-banner-text").text()) || url,
          description: "",
          url,
          imageUrl: null,
        },
      },
    ]
  }
}
