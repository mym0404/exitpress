import type { ParserBlockContext } from "../../core/BaseBlock.js"

import { LeafBlock } from "../../core/BaseBlock.js"

import { imageGroupOutputOptions, parseSe4ImageGroup } from "./util/ImageCollection.js"

export class NaverSe4ImageGroupBlock extends LeafBlock {
  override readonly id = "imageGroup"
  override readonly label = "이미지 그룹"
  override readonly outputOptions = imageGroupOutputOptions

  override match({ moduleType }: ParserBlockContext) {
    return moduleType === "v2_imageGroup"
  }

  override convert({ $node }: Parameters<LeafBlock["convert"]>[0]) {
    return parseSe4ImageGroup({ $node, blockName: "image group" })
  }
}
