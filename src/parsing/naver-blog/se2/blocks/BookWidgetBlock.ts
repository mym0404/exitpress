import type { ParserBlockContext } from "../../core/BaseBlock.js"
import { LeafBlock } from "../../core/BaseBlock.js"
import { parseBookWidgetBlocks } from "./BookWidget.js"

export class NaverSe2BookWidgetBlock extends LeafBlock {
  override readonly id = "bookWidget"
  override readonly label = "책 위젯"

  override match({ node, $node }: ParserBlockContext) {
    return node.type === "tag" && $node.is('[s_type="db"][s_subtype="book"]')
  }

  override convert({ $node, options }: Parameters<LeafBlock["convert"]>[0]) {
    const blocks = parseBookWidgetBlocks({
      element: $node,
      resolveLinkUrl: options.resolveLinkUrl,
    })

    if (!blocks) {
      throw new Error("SE2 book widget block parsing failed.")
    }

    return blocks
  }
}
