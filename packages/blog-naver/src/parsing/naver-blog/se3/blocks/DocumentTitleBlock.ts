import type { ParserBlockContext, ParserBlockTemplateDefinition } from "../../core/ParserBlock.js"

import { LeafParserBlock } from "../../core/ParserBlock.js"

export class NaverSe3DocumentTitleBlock extends LeafParserBlock {
  override readonly id = "documentTitle"
  override readonly label = "문서 제목"
  override readonly templateDefinition = {
    label: this.label,
    presets: [{ id: "ignore", label: "무시", template: "" }],
    props: {},
  } satisfies ParserBlockTemplateDefinition

  override match({ $node }: ParserBlockContext) {
    return $node.hasClass("se_documentTitle")
  }

  override convert() {
    return []
  }
}
