import type { ParserBlockContext } from "../../core/BaseBlock.js"
import { compactText } from "../../../../shared/text/TextUtils.js"
import { createLinkParagraphBlocks } from "../../common/LinkParagraph.js"
import { LeafBlock } from "../../core/BaseBlock.js"

const buildNaverMapSearchUrl = (query: string) =>
  `https://map.naver.com/p/search/${encodeURIComponent(query)}`

export class NaverSe3MapTextBlock extends LeafBlock {
  override readonly id = "mapText"
  override readonly label = "텍스트 지도"

  override match({ $node }: ParserBlockContext) {
    return $node.hasClass("se_map") && $node.hasClass("map_text")
  }

  override convert({ $node, options }: Parameters<LeafBlock["convert"]>[0]) {
    const title = compactText($node.find(".se_title").first().contents().first().text())
    const description = compactText($node.find(".se_address").first().text())

    if (!title) {
      return []
    }

    return createLinkParagraphBlocks({
      title,
      description,
      url: buildNaverMapSearchUrl(title),
      hasThumbnail: false,
      resolveLinkUrl: options.resolveLinkUrl,
    })
  }
}
