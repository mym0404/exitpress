import type { ParserBlockContext, ParserBlockTemplateDefinition } from "../../core/ParserBlock.js"

import { LeafParserBlock } from "../../core/ParserBlock.js"

import { convertSe3MapPlace } from "./util/ComponentBoundary.js"

export class NaverSe3MapBlock extends LeafParserBlock {
  override readonly id = "map"
  override readonly label = "지도"
  override readonly templateDefinition = {
    label: this.label,
    presets: [{ id: "default", label: "기본", template: "${text}" }],
    props: {
      text: { label: "본문", type: "string" },
    },
  } satisfies ParserBlockTemplateDefinition

  override match({ $node }: ParserBlockContext) {
    return $node.hasClass("se_map") && $node.hasClass("default")
  }

  override convert({ $, $node, blockId, options }: Parameters<LeafParserBlock["convert"]>[0]) {
    return convertSe3MapPlace({ $, $node, blockId, options })
  }
}
