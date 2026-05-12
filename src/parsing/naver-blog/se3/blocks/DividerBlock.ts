import type { ParserBlockContext } from "../../core/BaseBlock.js"
import { LeafBlock } from "../../core/BaseBlock.js"

const dividerClassNames = ["default", "line2"]

export class NaverSe3DividerBlock extends LeafBlock {
  override readonly id = "divider"
  override readonly label = "구분선"

  override match({ $node }: ParserBlockContext) {
    return (
      $node.hasClass("se_horizontalLine") &&
      dividerClassNames.some((className) => $node.hasClass(className))
    )
  }

  override convert() {
    return [{ type: "divider" as const }]
  }
}
