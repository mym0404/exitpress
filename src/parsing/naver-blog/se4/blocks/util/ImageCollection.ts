import type { ImageData } from "../../../../../domain/parser/Types.js"
import type { LeafParserBlock } from "../../../core/ParserBlock.js"

import { createImageBlocks } from "../../../core/ParsedBlockOutput.js"

import { parseImageLink, se4ImageLinkSelector } from "./ImageLink.js"

export const parseSe4ImageGroup = ({
  $node,
  options,
  blockId,
  blockName,
}: {
  $node: Parameters<LeafParserBlock["convert"]>[0]["$node"]
  options: Parameters<LeafParserBlock["convert"]>[0]["options"]
  blockId: string
  blockName: string
}) => {
  const images = $node
    .find(se4ImageLinkSelector)
    .toArray()
    .map((node): ImageData | null => parseImageLink($node.find(node)))
    .filter((image): image is ImageData => image !== null)

  if (images.length === 0) {
    throw new Error(`SE4 ${blockName} block parsing failed.`)
  }

  return createImageBlocks({ blockId, images, options })
}
