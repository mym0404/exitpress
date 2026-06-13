import type { ParserBlockContext, ParserBlockTemplateDefinition } from "../../core/ParserBlock.js"

import { LeafParserBlock } from "../../core/ParserBlock.js"

import { isSpacerBlock } from "./ContainerBlock.js"

export class NaverSe2SpacerBlock extends LeafParserBlock {
  override readonly id = "spacer"
  override readonly label = "빈 줄"
  override readonly templateDefinition = {
    label: this.label,
    presets: [{ id: "ignore", label: "무시", template: "" }],
    props: {},
  } satisfies ParserBlockTemplateDefinition

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
