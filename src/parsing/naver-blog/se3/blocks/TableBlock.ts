import type { ParserBlockContext, ParserBlockTemplateDefinition } from "../../core/BaseBlock.js"

import { parseHtmlTable } from "../../common/parseHtmlTable.js"
import { LeafBlock } from "../../core/BaseBlock.js"

import { findInComponentRoot } from "./util/ComponentBoundary.js"

export class NaverSe3TableBlock extends LeafBlock {
  override readonly id = "table"
  override readonly label = "표"
  override readonly templateDefinition = {
    label: this.label,
    presets: [
      {
        id: "default",
        label: "기본",
        template: "${markdown}",
      },
    ],
    props: {
      markdown: { label: "Markdown", type: "string" },
    },
  } satisfies ParserBlockTemplateDefinition

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
