import type { ParserBlockContext } from "../../core/BaseBlock.js"
import { LeafBlock } from "../../core/BaseBlock.js"

export class NaverSe3DividerBlock extends LeafBlock {
  override readonly id = "divider"
  override readonly label = "구분선"

  override match({ $node }: ParserBlockContext) {
    return $node.hasClass("se_horizontalLine") && $node.hasClass("line5")
  }

  override convert() {
    return [{ type: "divider" as const }]
  }
}
