import type { ParserBlockContext, ParserBlockTemplateDefinition } from "../../core/ParserBlock.js"

import { createCodeBlock } from "../../core/ParsedBlockOutput.js"
import { LeafParserBlock } from "../../core/ParserBlock.js"

import { findInComponentRoot } from "./util/ComponentBoundary.js"

export class NaverSe3CodeBlock extends LeafParserBlock {
  override readonly id = "code"
  override readonly label = "코드"
  override readonly templateDefinition = {
    label: this.label,
    presets: [
      {
        id: "default",
        label: "코드 펜스",
        template: "{{ `\\`\\`\\`${language ?? ''}\n${code}\n\\`\\`\\`` }}",
      },
    ],
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

  override convert({ $, $node, blockId }: Parameters<LeafParserBlock["convert"]>[0]) {
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
