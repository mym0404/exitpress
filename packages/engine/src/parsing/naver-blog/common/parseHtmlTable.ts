import { compactText } from "@exitpress/engine/shared/text/TextUtils.js"

import type { TableRow } from "@exitpress/domain/parser/Types.js"
import type { CheerioAPI } from "cheerio"

export const parseHtmlTable = ({ $, table }: { $: CheerioAPI; table: ReturnType<CheerioAPI> }) => {
  const rows = table
    .find("tr")
    .toArray()
    .map((row) =>
      $(row)
        .children("th, td")
        .toArray()
        .map((cell) => {
          const cellNode = $(cell)

          return {
            text: compactText(cellNode.text()),
            /* v8 ignore next -- Cheerio types allow null for empty selections, but cells come from an existing table child. */
            html: (cellNode.html() ?? "").trim(),
            colspan: Number(cellNode.attr("colspan") ?? "1"),
            rowspan: Number(cellNode.attr("rowspan") ?? "1"),
            isHeader: cell.tagName === "th",
          }
        }),
    )
    .filter((row): row is TableRow => row.length > 0)

  const widths = rows.map((row) => row.reduce((sum, cell) => sum + cell.colspan, 0))
  const hasMergedCells = rows.some((row) =>
    row.some((cell) => cell.colspan > 1 || cell.rowspan > 1),
  )
  const widthMismatch = widths.some((width) => width !== widths[0])

  return {
    rows,
    html: $.html(table).trim(),
    complex: hasMergedCells || widthMismatch,
  }
}
