import type { parseHtmlTable } from "./parseHtmlTable.js"

import { convertHtmlToMarkdown } from "../../../markdown/utils/convertHtmlToMarkdown.js"
import { createParagraphBlock } from "../core/ParsedBlockOutput.js"

export const parseSingleColumnTableAsParagraphs = ({
  blockId,
  paragraphBlockId = blockId,
  parsedTable,
  options,
}: {
  blockId: string
  paragraphBlockId?: string
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
        resolveLinkUrl: options.resolveLinkUrl,
      }),
    )
    .map((text) => text.trim())
    .filter(Boolean)
    .map((text) => createParagraphBlock({ blockId: paragraphBlockId, text }))

  return paragraphs.length > 0 ? paragraphs : null
}
