import type { ParserBlockContext } from "../../core/BaseBlock.js"

import { LeafBlock } from "../../core/BaseBlock.js"

import { convertSe3MapPlace } from "./util/ComponentBoundary.js"

export class NaverSe3MapTextBlock extends LeafBlock {
  override readonly id = "mapText"
  override readonly label = "텍스트 지도"

  override match({ $node }: ParserBlockContext) {
    return $node.hasClass("se_map") && $node.hasClass("map_text")
  }

  override convert({ $, $node, blockId, options }: Parameters<LeafBlock["convert"]>[0]) {
    return convertSe3MapPlace({ $, $node, blockId, options })
  }
}
