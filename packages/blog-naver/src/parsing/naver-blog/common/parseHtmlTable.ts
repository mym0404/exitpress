import { convertHtmlWithImageAssets } from "@exitpress/engine/exporting/assets/convertHtmlWithImageAssets.js"

import type { ParsedBlockAsset } from "@exitpress/domain/parser/schema/Media.js"
import type { TableRow } from "@exitpress/domain/parser/schema/TableRow.js"
import type { CheerioAPI } from "cheerio"

export const parseHtmlTable = ({
  $,
  table,
  resolveLinkUrl,
}: {
  $: CheerioAPI
  table: ReturnType<CheerioAPI>
  resolveLinkUrl?: (url: string) => string
}) => {
  const normalizedTable = table.clone()

  if (resolveLinkUrl) {
    normalizedTable.find("a[href]").each((_, anchor) => {
      const link = normalizedTable.find(anchor)
      const href = link.attr("href")

      if (href) {
        link.attr("href", resolveLinkUrl(href))
      }
    })
  }

  const assets: Record<string, ParsedBlockAsset> = {}
  const rows = normalizedTable
    .children("thead, tbody, tfoot, tr")
    .toArray()
    .flatMap((node) => ($(node).is("tr") ? [node] : $(node).children("tr").toArray()))
    .map((row, rowIndex) =>
      $(row)
        .children("th, td")
        .toArray()
        .map((cell, cellIndex) => {
          const cellNode = $(cell)
          const content = convertHtmlWithImageAssets({
            html: cellNode.html() ?? "",
            propPath: `rows.${rowIndex}.${cellIndex}.text`,
          })
          Object.assign(assets, content.assets)

          return {
            text: content.text.trim(),
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

  const htmlContent = convertHtmlWithImageAssets({
    html: $.html(normalizedTable).trim(),
    propPath: "html",
    format: "html",
  })
  Object.assign(assets, htmlContent.assets)

  return {
    rows,
    html: htmlContent.text,
    ...(Object.keys(assets).length > 0 ? { assets } : {}),
    complex:
      hasMergedCells ||
      widthMismatch ||
      normalizedTable.find("table, pre, ul, ol, blockquote").length > 0,
  }
}
