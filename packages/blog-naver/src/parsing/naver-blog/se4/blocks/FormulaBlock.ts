import { compactText } from "@exitpress/engine/shared/text/util/TextCompaction.js"
import { load } from "cheerio"

import type { UnknownRecord } from "@exitpress/engine/shared/object/UnknownRecord.js"

import type { ParserBlockContext, ParserBlockTemplateDefinition } from "../../core/ParserBlock.js"

import { createFormulaBlock } from "../../core/ParsedBlockOutput.js"
import { LeafParserBlock } from "../../core/ParserBlock.js"

const normalizeGrid = (formula: string) =>
  formula.replace(/\\begin\{grid\}([\s\S]*?)\\end\{grid\}/g, (source, body: string) => {
    const rows = body.split(/\\\\(?=\\cell\{)/).map((row) => row.split(/&(?=\\cell\{)/))
    const width = rows[0]?.length ?? 0

    if (!width || rows.some((row) => row.length !== width)) {
      return source
    }

    const cells = rows.map((row) => row.map((cell) => /^\\cell\{([01]{4})\}([\s\S]*)$/.exec(cell)))

    if (cells.some((row) => row.some((cell) => !cell))) {
      return source
    }

    const renderedRows = cells.map((row) =>
      row
        .map((cell) => {
          const [, borders, value] = cell!
          let rendered = value!

          if (borders![0] === "1") rendered = `\\overline{${rendered}}`
          if (borders![2] === "1") rendered = `\\underline{${rendered}}`
          if (borders![3] === "1") rendered = `\\vert ${rendered}`
          if (borders![1] === "1") rendered = `${rendered}\\vert`

          return rendered
        })
        .join("&"),
    )

    return `\\begin{array}{${"c".repeat(width)}}${renderedRows.join("\\\\")}\\end{array}`
  })

export class NaverSe4FormulaBlock extends LeafParserBlock {
  override readonly id = "formula"
  override readonly label = "수식"
  override readonly templateDefinition = {
    label: this.label,
    presets: [
      {
        id: "source-display",
        label: "원문 표시 방식",
        template: "{{ display ? `$$\\n${formula}\\n$$` : `$${formula}$` }}",
      },
      {
        id: "display-math",
        label: "표시 수식",
        template: "{{ `$$\\n${formula}\\n$$` }}",
      },
      {
        id: "inline-math",
        label: "인라인 수식",
        template: "{{ `$${formula}$` }}",
      },
      {
        id: "math-fence",
        label: "Math 코드 펜스",
        template: "{{ `\\`\\`\\`math\\n${formula}\\n\\`\\`\\`` }}",
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
    const formulaDocument = load(data.html ?? "")
    const htmlFormulas = data.html
      ? formulaDocument(".mq-selectable")
          .toArray()
          .map((node) => compactText(formulaDocument(node).text()))
      : []
    const candidates = htmlFormulas.length
      ? htmlFormulas
      : [data.latex ?? data.text ?? $node.text()]
    const formulas = candidates
      .map(normalizeGrid)
      .map((candidate) =>
        compactText(candidate)
          .replace(/^\${1,2}/, "")
          .replace(/\${1,2}$/, "")
          .replace(/\\combi(?=\s*\{)/g, "")
          .replace(/\\overrightharpoonup\b/g, "\\overrightharpoon")
          .replace(/\\nequiv\b/g, "\\not\\equiv")
          .replace(/\\lcup\b/g, "\\cup")
          .replace(/\\nin\b/g, "\\notin")
          .replace(/\\normal\{1\}(?=\s*\{)/g, "\\mathrm")
          .replaceAll("\u0008", "")
          .trim()
          .replace(/(\\+)$/, (slashes) => (slashes.length % 2 === 1 ? `${slashes} ` : slashes)),
      )
      .filter(Boolean)

    if (formulas.length === 0) {
      throw new Error("SE4 formula block parsing failed.")
    }

    return formulas.map((formula) =>
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
    )
  }
}
