import type { OutputOption } from "../Types.js"
import {LeafBlock, type ParserBlockContext} from "../BaseBlock.js"

import {parseHtmlTable} from "../../parser/util/parseHtmlTable.js";

export class NaverSe4TableBlock extends LeafBlock {
  override readonly id = "table"
  override readonly label = "표"
  override readonly outputOptions = [
    {
      id: "gfm-or-html",
      label: "GFM 우선",
      description: "단순 표는 GFM, 복잡한 표는 HTML fragment로 처리합니다.",
      preview: {
        type: "table",
        complex: false,
        html: "<table><tr><th>col</th></tr><tr><td>value</td></tr></table>",
        rows: [
          [{ text: "col", html: "col", colspan: 1, rowspan: 1, isHeader: true }],
          [{ text: "value", html: "value", colspan: 1, rowspan: 1, isHeader: false }],
        ],
      },
      isDefault: true,
    },
    {
      id: "html-only",
      label: "원본 HTML 유지",
      description: "표를 HTML fragment로 유지합니다.",
      preview: {
        type: "table",
        complex: false,
        html: "<table><tr><th>col</th></tr><tr><td>value</td></tr></table>",
        rows: [
          [{ text: "col", html: "col", colspan: 1, rowspan: 1, isHeader: true }],
          [{ text: "value", html: "value", colspan: 1, rowspan: 1, isHeader: false }],
        ],
      },
    },
  ] satisfies OutputOption<"table">[]

  override match({ $node, moduleType }: ParserBlockContext) {
    return moduleType === "v2_table" || $node.hasClass("se-table")
  }

  override convert({ $, $node }: Parameters<LeafBlock["convert"]>[0]) {
    const table = $node.find("table").first()

    if (table.length === 0) {
      throw new Error("SE4 table block parsing failed.")
    }

    const parsedTable = parseHtmlTable({ $, table })

    return [
      {
        type: "table" as const,
        rows: parsedTable.rows,
        html: parsedTable.html,
        complex: parsedTable.complex,
      },
    ]
  }
}
