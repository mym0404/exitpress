import type { OutputOption } from "../../../../domain/ast/Types.js"
import type { ParserBlockContext } from "../../core/BaseBlock.js"

import { parseHtmlTable } from "../../common/parseHtmlTable.js"
import { LeafBlock } from "../../core/BaseBlock.js"

import { findInComponentRoot } from "./util/ComponentBoundary.js"

export class NaverSe3TableBlock extends LeafBlock {
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

  override match({ $, $node }: ParserBlockContext) {
    return (
      $node.hasClass("se_table") &&
      findInComponentRoot({ $, $component: $node, selector: "table" }).first().length > 0
    )
  }

  override convert({ $, $node }: Parameters<LeafBlock["convert"]>[0]) {
    const table = findInComponentRoot({ $, $component: $node, selector: "table" }).first()
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
