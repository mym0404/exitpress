import type { ParserBlockContext, ParserBlockTemplateDefinition } from "../../core/ParserBlock.js"

import { createDividerBlock } from "../../core/ParsedBlockOutput.js"
import { LeafParserBlock } from "../../core/ParserBlock.js"

export class NaverSe4DividerBlock extends LeafParserBlock {
  override readonly id = "divider"
  override readonly label = "구분선"
  override readonly templateDefinition = {
    label: this.label,
    presets: [{ id: "default", label: "가로선", template: "---" }],
    props: {},
  } satisfies ParserBlockTemplateDefinition

  override match({ $node }: ParserBlockContext) {
    return $node.hasClass("se-horizontalLine")
  }

  override convert({ blockId }: Parameters<LeafParserBlock["convert"]>[0]) {
    return [createDividerBlock({ blockId })]
  }
}
