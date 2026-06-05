import type { ParserBlockTemplateDefinition } from "../../core/BaseBlock.js"

import { LeafBlock } from "../../core/BaseBlock.js"
import { createDividerBlock } from "../../core/ParsedBlockOutput.js"

export class NaverSe3DividerBlock extends LeafBlock {
  override readonly id = "divider"
  override readonly label = "구분선"
  override readonly templateDefinition = {
    label: this.label,
    presets: [{ id: "default", label: "기본", template: "---" }],
    props: {},
  } satisfies ParserBlockTemplateDefinition

  override match({ $node }: Parameters<LeafBlock["match"]>[0]) {
    return $node.hasClass("se_horizontalLine")
  }

  override convert({ blockId }: Parameters<LeafBlock["convert"]>[0]) {
    return [createDividerBlock({ blockId })]
  }
}
