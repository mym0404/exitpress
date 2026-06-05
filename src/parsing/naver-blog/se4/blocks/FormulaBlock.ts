import { load } from "cheerio"

import type { UnknownRecord } from "../../../../shared/object/UnknownRecord.js"
import type { ParserBlockContext, ParserBlockTemplateDefinition } from "../../core/ParserBlock.js"

import { compactText } from "../../../../shared/text/TextUtils.js"
import { createFormulaBlock } from "../../core/ParsedBlockOutput.js"
import { LeafParserBlock } from "../../core/ParserBlock.js"

export class NaverSe4FormulaBlock extends LeafParserBlock {
  override readonly id = "formula"
  override readonly label = "수식"
  override readonly templateDefinition = {
    label: this.label,
    presets: [
      {
        id: "default",
        label: "기본",
        template: "${display ? '$$\\n' + formula + '\\n$$' : '$' + formula + '$'}",
      },
    ],
    props: {
      formula: { label: "수식", type: "string" },
      display: { label: "블록 표시", type: "boolean" },
    },
  } satisfies ParserBlockTemplateDefinition

  override match({ moduleData, moduleType }: ParserBlockContext) {
    return moduleType === "v2_formula" && Boolean(moduleData)
  }

  override convert({ $node, moduleData, blockId }: Parameters<LeafParserBlock["convert"]>[0]) {
    /* v8 ignore next 3 */
    if (!moduleData) {
      throw new Error("SE4 formula block metadata is missing.")
    }

    /* v8 ignore next */
    const data = (moduleData.data ?? {}) as UnknownRecord & {
      html?: string
      latex?: string
      text?: string
      display?: boolean
      inline?: boolean
      isInline?: boolean
    }
    const candidates: string[] = []

    if (data.html) {
      const formulaDocument = load(data.html)

      candidates.push(
        ...formulaDocument(".mq-selectable")
          .toArray()
          .map((node) => compactText(formulaDocument(node).text()))
          .filter(Boolean),
      )
    }

    if (typeof data.latex === "string") {
      candidates.push(compactText(data.latex))
    }

    if (typeof data.text === "string") {
      candidates.push(compactText(data.text))
    }

    candidates.push(compactText($node.text()))

    const formula = candidates
      .map((candidate) =>
        candidate
          .replace(/^\${1,2}/, "")
          .replace(/\${1,2}$/, "")
          .trim(),
      )
      .filter(Boolean)
      .sort((left, right) => right.length - left.length)[0]

    if (!formula) {
      throw new Error("SE4 formula block parsing failed.")
    }

    return [
      createFormulaBlock({
        blockId,
        formula,
        display:
          !(data.display === false) &&
          data.inline !== true &&
          data.isInline !== true &&
          !$node.hasClass("se-inline-math") &&
          !$node.hasClass("se-math-inline"),
      }),
    ]
  }
}
