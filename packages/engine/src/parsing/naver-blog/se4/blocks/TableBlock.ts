import type { ParserBlockContext, ParserBlockTemplateDefinition } from "../../core/ParserBlock.js"

import { parseHtmlTable } from "../../common/parseHtmlTable.js"
import { createTableBlock } from "../../core/ParsedBlockOutput.js"
import { LeafParserBlock } from "../../core/ParserBlock.js"

const tableTemplate =
  "${rows.length > 0 ? '| ' + rows[0].map((cell) => cell.text).join(' | ') + ' |\\n| ' + rows[0].map((cell) => '---').join(' | ') + ' |\\n' + rows.slice(1).map((row) => '| ' + row.map((cell) => cell.text).join(' | ') + ' |').join('\\n') : html}"

export class NaverSe4TableBlock extends LeafParserBlock {
  override readonly id = "table"
  override readonly label = "표"
  override readonly templateDefinition = {
    label: this.label,
    presets: [
      {
        id: "default",
        label: "마크다운 표",
        template: tableTemplate,
      },
    ],
    props: {
      rows: { label: "행", type: "array" },
      html: { label: "HTML", type: "string" },
      complex: { label: "복합 표", type: "boolean" },
    },
  } satisfies ParserBlockTemplateDefinition

  override match({ $node, moduleType }: ParserBlockContext) {
    return moduleType === "v2_table" || $node.hasClass("se-table")
  }

  override convert({ $, $node, blockId }: Parameters<LeafParserBlock["convert"]>[0]) {
    const table = $node.find("table").first()

    if (table.length === 0) {
      throw new Error("SE4 table block parsing failed.")
    }

    const parsedTable = parseHtmlTable({ $, table })

    return [
      createTableBlock({
        blockId,
        rows: parsedTable.rows,
        html: parsedTable.html,
        complex: parsedTable.complex,
      }),
    ]
  }
}
