import type { ParserBlockContext, ParserBlockTemplateDefinition } from "../../core/BaseBlock.js"

import { LeafBlock } from "../../core/BaseBlock.js"
import { createDividerBlock } from "../../core/ParsedBlockOutput.js"

export class NaverSe4DividerBlock extends LeafBlock {
  override readonly id = "divider"
  override readonly label = "구분선"
  override readonly templateDefinition = {
    label: this.label,
    presets: [{ id: "default", label: "기본", template: "---" }],
    props: {},
  } satisfies ParserBlockTemplateDefinition

  override match({ $node }: ParserBlockContext) {
    return $node.hasClass("se-horizontalLine")
  }

  override convert({ blockId }: Parameters<LeafBlock["convert"]>[0]) {
    return [createDividerBlock({ blockId })]
  }
}
