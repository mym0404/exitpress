import type { ParserBlockContext, ParserBlockTemplateDefinition } from "../../core/ParserBlock.js"

import { createCodeBlock } from "../../core/ParsedBlockOutput.js"
import { LeafParserBlock } from "../../core/ParserBlock.js"

export class NaverSe4CodeBlock extends LeafParserBlock {
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

  override match({ $node, moduleType }: ParserBlockContext) {
    return moduleType === "v2_code" || $node.hasClass("se-code")
  }

  override convert({ $node, blockId }: Parameters<LeafParserBlock["convert"]>[0]) {
    const sourceNode = $node.find(".__se_code_view").first()
    /* v8 ignore next */
    const classNames = sourceNode.attr("class") ?? ""
    const languageMatch = classNames.match(/language-([\w-]+)/)
    const code = sourceNode.text().trimEnd()

    if (!code) {
      return []
    }

    return [createCodeBlock({ blockId, language: languageMatch?.[1] ?? null, code })]
  }
}
