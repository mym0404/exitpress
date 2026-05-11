import type { ParserBlockContext } from "../../core/BaseBlock.js"
import { LeafBlock } from "../../core/BaseBlock.js"
import { isSpacerBlock } from "./ContainerBlock.js"

export class NaverSe2SpacerBlock extends LeafBlock {
  override readonly id = "spacer"
  override readonly label = "빈 줄"

  override match({ node, $node }: ParserBlockContext) {
    return (
      node.type === "tag" &&
      isSpacerBlock({
        element: $node,
        tagName: node.tagName.toLowerCase(),
      })
    )
  }

  override convert() {
    return []
  }
}
