import type { ParserBlockContext } from "../../core/BaseBlock.js"

import { LeafBlock } from "../../core/BaseBlock.js"

import { findInComponentRoot } from "./util/ComponentBoundary.js"

export class NaverSe3CodeBlock extends LeafBlock {
  override readonly id = "code"
  override readonly label = "코드"

  override match({ $, $node }: ParserBlockContext) {
    return (
      $node.hasClass("se_code") &&
      findInComponentRoot({ $, $component: $node, selector: "pre" }).first().length > 0
    )
  }

  override convert({ $, $node }: Parameters<LeafBlock["convert"]>[0]) {
    const code = findInComponentRoot({ $, $component: $node, selector: "pre" })
      .first()
      .text()
      .trimEnd()

    if (!code) {
      return []
    }

    return [{ type: "code" as const, language: null, code }]
  }
}
