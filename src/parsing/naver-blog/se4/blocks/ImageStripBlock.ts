import type { ParserBlockContext } from "../../core/BaseBlock.js"

import { LeafBlock } from "../../core/BaseBlock.js"

import { imageGroupOutputOptions, parseSe4ImageGroup } from "./util/ImageCollection.js"

export class NaverSe4ImageStripBlock extends LeafBlock {
  override readonly id = "imageGroup"
  override readonly label = "이미지 스트립"
  override readonly outputOptions = imageGroupOutputOptions

  override match({ $node }: ParserBlockContext) {
    return $node.hasClass("se-imageStrip")
  }

  override convert({ $node }: Parameters<LeafBlock["convert"]>[0]) {
    return parseSe4ImageGroup({ $node, blockName: "image strip" })
  }
}
