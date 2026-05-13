import type { ParserBlockContext } from "../../core/BaseBlock.js"
import { LeafBlock } from "../../core/BaseBlock.js"
import { convertSe3MapPlace } from "./util/ComponentBoundary.js"

export class NaverSe3MapBlock extends LeafBlock {
  override readonly id = "map"
  override readonly label = "지도"

  override match({ $node }: ParserBlockContext) {
    return $node.hasClass("se_map") && $node.hasClass("default")
  }

  override convert({ $, $node, options }: Parameters<LeafBlock["convert"]>[0]) {
    return convertSe3MapPlace({ $, $node, options })
  }
}
