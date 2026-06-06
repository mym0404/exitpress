import { tableTemplate } from "@exitpress/domain/template/DefaultTemplates.js"

import type { ParserBlockContext, ParserBlockTemplateDefinition } from "../../core/ParserBlock.js"

import { parseHtmlTable } from "../../common/parseHtmlTable.js"
import { createTableBlock } from "../../core/ParsedBlockOutput.js"
import { LeafParserBlock } from "../../core/ParserBlock.js"

import { findInComponentRoot } from "./util/ComponentBoundary.js"

export class NaverSe3TableBlock extends LeafParserBlock {
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

  override match({ $, $node }: ParserBlockContext) {
    return (
      $node.hasClass("se_table") &&
      findInComponentRoot({ $, $component: $node, selector: "table" }).first().length > 0
    )
  }

  override convert({ $, $node, blockId }: Parameters<LeafParserBlock["convert"]>[0]) {
    const table = findInComponentRoot({ $, $component: $node, selector: "table" }).first()
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
