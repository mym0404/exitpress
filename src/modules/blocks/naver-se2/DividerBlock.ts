import {LeafBlock, type ParserBlockContext} from "../BaseBlock.js"

export class NaverSe2DividerBlock extends LeafBlock {
  override readonly id = "divider"
  override readonly label = "구분선"

  override match({ node }: ParserBlockContext) {
    return node.type === "tag" && node.tagName.toLowerCase() === "hr"
  }

  override convert() {
    return [{ type: "divider" as const }]
  }
}
