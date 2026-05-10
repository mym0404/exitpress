import type { CheerioAPI } from "cheerio"

import { LeafBlock } from "../BaseBlock.js"
import type { ParserBlockContext } from "../ParserNode.js"
import { parseSingleColumnTableAsParagraphs } from "../common/Table.js"
import type { AstBlock, OutputOption } from "../../../shared/Types.js"
import { compactText } from "../../../shared/Utils.js"
import { parseHtmlTable } from "../../parser/TableParser.js"

const parseColorScripterCodeBlock = ({
  $,
  element,
}: {
  $: CheerioAPI
  element: ReturnType<CheerioAPI>
}) => {
  if (!element.hasClass("colorscripter-code-table")) {
    return null
  }

  const lineNodes = element
    .find('div[style*="white-space:pre"], div[_foo*="white-space:pre"], pre')
    .toArray()
  const code = lineNodes
    .map((node) => $(node).text().replaceAll("\u00a0", " ").replaceAll("\u200b", ""))
    .map((line) => (line.trim() === "" ? "" : line))
    .join("\n")
    .trimEnd()

  if (!code) {
    return null
  }

  return {
    type: "code",
    language: null,
    code,
  } satisfies AstBlock
}

export class NaverSe2TableBlock extends LeafBlock {
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

  override match({ node, $node }: ParserBlockContext) {
    return (
      node.type === "tag" &&
      (node.tagName.toLowerCase() === "table" || $node.hasClass("colorscripter-code-table"))
    )
  }

  override convert({ $, $node, options }: Parameters<LeafBlock["convert"]>[0]) {
    const colorScripterCodeBlock = parseColorScripterCodeBlock({
      $,
      element: $node,
    })

    if (colorScripterCodeBlock) {
      return [colorScripterCodeBlock]
    }

    if ($node.hasClass("colorscripter-code-table") && compactText($node.text()) === "") {
      return []
    }

    if (!$node.is("table")) {
      return []
    }

    const parsedTable = parseHtmlTable({ $, table: $node })
    const flattenedTable = parseSingleColumnTableAsParagraphs({
      parsedTable,
      options,
    })

    if (flattenedTable) {
      return flattenedTable
    }

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
