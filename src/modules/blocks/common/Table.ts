import { convertHtmlToMarkdown } from "../../converter/HtmlFragmentConverter.js"
import type { AstBlock } from "../Types.js"
import { parseHtmlTable } from "../../parser/TableParser.js"

export const parseSingleColumnTableAsParagraphs = ({
  parsedTable,
  options,
}: {
  parsedTable: ReturnType<typeof parseHtmlTable>
  options: {
    resolveLinkUrl?: (url: string) => string
  }
}) => {
  const isSingleColumn =
    !parsedTable.complex &&
    parsedTable.rows.length > 0 &&
    parsedTable.rows.every(
      (row) => row.length === 1 && row[0]?.colspan === 1 && row[0]?.rowspan === 1,
    )

  if (!isSingleColumn) {
    return null
  }

  const paragraphs = parsedTable.rows
    .map((row) =>
      convertHtmlToMarkdown({
        /* v8 ignore next */
        html: row[0]?.html ?? "",
        options: {},
        resolveLinkUrl: options.resolveLinkUrl,
      }),
    )
    .map((text) => text.trim())
    .filter(Boolean)
    .map(
      (text) =>
        ({
          type: "paragraph",
          text,
        }) satisfies AstBlock,
    )

  return paragraphs.length > 0 ? paragraphs : null
}
