import type { ParserBlockContext, ParserBlockTemplateDefinition } from "../../core/BaseBlock.js"

import { LeafBlock } from "../../core/BaseBlock.js"
import { createCodeBlock } from "../../core/ParsedBlockOutput.js"

import { findInComponentRoot } from "./util/ComponentBoundary.js"

export class NaverSe3CodeBlock extends LeafBlock {
  override readonly id = "code"
  override readonly label = "코드"
  override readonly templateDefinition = {
    label: this.label,
    presets: [{ id: "default", label: "기본", template: "```${language ?? ''}\n${code}\n```" }],
    props: {
      language: { label: "언어", type: "string?" },
      code: { label: "코드", type: "string" },
    },
  } satisfies ParserBlockTemplateDefinition

  override match({ $, $node }: ParserBlockContext) {
    return (
      $node.hasClass("se_code") &&
      findInComponentRoot({ $, $component: $node, selector: "pre, .__se_code_view" }).first()
        .length > 0
    )
  }

  override convert({ $, $node, blockId }: Parameters<LeafBlock["convert"]>[0]) {
    const code = findInComponentRoot({ $, $component: $node, selector: "pre, .__se_code_view" })
      .first()
      .text()
      .trimEnd()

    if (!code) {
      return []
    }

    return [createCodeBlock({ blockId, language: null, code })]
  }
}
