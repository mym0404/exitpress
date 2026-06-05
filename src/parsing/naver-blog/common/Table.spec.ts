import { describe, expect, it } from "vitest"

import { parseSingleColumnTableAsParagraphs } from "./Table.js"

describe("parseSingleColumnTableAsParagraphs", () => {
  it("rejects non-single-column table shapes", () => {
    const baseCell = {
      text: "cell",
      html: "cell",
      colspan: 1,
      rowspan: 1,
      isHeader: false,
    }

    expect(
      parseSingleColumnTableAsParagraphs({
        blockId: "naver-se2:table",
        parsedTable: {
          rows: [[baseCell, baseCell]],
          html: "<table></table>",
          complex: false,
        },
        options: {},
      }),
    ).toBeNull()

    expect(
      parseSingleColumnTableAsParagraphs({
        blockId: "naver-se2:table",
        parsedTable: {
          rows: [[{ ...baseCell, rowspan: 2 }]],
          html: "<table></table>",
          complex: false,
        },
        options: {},
      }),
    ).toBeNull()
  })
})
