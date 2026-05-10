import {LeafBlock, type ParserBlockContext} from "../BaseBlock.js"

export class NaverSe4DividerBlock extends LeafBlock {
  override readonly id = "divider"
  override readonly label = "구분선"

  override match({ $node }: ParserBlockContext) {
    return $node.hasClass("se-horizontalLine")
  }

  override convert() {
    return [{ type: "divider" as const }]
  }
}
