import type { ParserBlockContext, ParserBlockTemplateDefinition } from "../../core/BaseBlock.js"

import { tableTemplate } from "../../../../domain/template/DefaultTemplates.js"
import { parseHtmlTable } from "../../common/parseHtmlTable.js"
import { parseSingleColumnTableAsParagraphs } from "../../common/Table.js"
import { LeafBlock } from "../../core/BaseBlock.js"
import { createTableBlock } from "../../core/ParsedBlockOutput.js"

const toParagraphBlockId = (blockId: string) =>
  blockId.replace(/:table$/, ":paragraph").replace(/^table$/, "paragraph")

export class NaverSe2TableBlock extends LeafBlock {
  override readonly id = "table"
  override readonly label = "표"
  override readonly templateDefinition = {
    label: this.label,
    presets: [
      {
        id: "default",
        label: "기본",
        template: tableTemplate,
      },
    ],
    props: {
      rows: { label: "행", type: "array" },
      html: { label: "HTML", type: "string" },
      complex: { label: "복합 표", type: "boolean" },
    },
  } satisfies ParserBlockTemplateDefinition

  override match({ node }: ParserBlockContext) {
    return node.type === "tag" && node.tagName.toLowerCase() === "table"
  }

  override convert({ $, $node, options, blockId }: Parameters<LeafBlock["convert"]>[0]) {
    if ($node.hasClass("colorscripter-code-table")) {
      return []
    }

    if (!$node.is("table")) {
      throw new Error("SE2 table block parsing failed.")
    }

    const parsedTable = parseHtmlTable({ $, table: $node })
    const flattenedTable = parseSingleColumnTableAsParagraphs({
      blockId,
      paragraphBlockId: toParagraphBlockId(blockId),
      parsedTable,
      options,
    })

    if (flattenedTable) {
      return flattenedTable
    }

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
