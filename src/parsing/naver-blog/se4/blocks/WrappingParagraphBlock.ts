import type { ParserBlockContext } from "../../core/BaseBlock.js"
import { LeafBlock } from "../../core/BaseBlock.js"
import { parseImageLink, se4ImageLinkSelector } from "./ImageLink.js"
import { parseTextBlocks } from "./TextBlock.js"

const wrappingParagraphLayoutClasses = [
  "se-l-inner-big-left",
  "se-l-inner-big-right",
  "se-l-inner-right",
]

export class NaverSe4WrappingParagraphBlock extends LeafBlock {
  override readonly id = "wrappingParagraph"
  override readonly label = "감싸는 문단"

  override match({ $node }: ParserBlockContext) {
    return (
      $node.hasClass("se-wrappingParagraph") &&
      wrappingParagraphLayoutClasses.some((className) => $node.hasClass(className))
    )
  }

  override convert({ $node, options }: Parameters<LeafBlock["convert"]>[0]) {
    const $imageSlot = $node.find(".se-component-slot-float").first()
    const imageBlocks = []

    if ($imageSlot.length > 0) {
      const image = parseImageLink($imageSlot.find(se4ImageLinkSelector).first())

      if (!image) {
        throw new Error("SE4 wrapping paragraph image parsing failed.")
      }

      imageBlocks.push({ type: "image" as const, image })
    }

    const $textSlot = $node.find(".se-component-slot").not(".se-component-slot-float").first()
    const textBlocks =
      $textSlot.length > 0
        ? parseTextBlocks({
            $node: $textSlot,
            options,
          })
        : []

    return [...imageBlocks, ...textBlocks]
  }
}
