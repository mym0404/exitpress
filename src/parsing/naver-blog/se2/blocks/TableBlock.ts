import type { CheerioAPI } from "cheerio"

import type { AstBlock } from "../../../../domain/ast/Types.js"
import type { ParserBlockContext, ParserBlockTemplateDefinition } from "../../core/BaseBlock.js"

import { convertHtmlToMarkdown } from "../../../../markdown/TurndownMarkdownConverter.js"
import { compactText } from "../../../../shared/text/TextUtils.js"
import { parseHtmlTable } from "../../common/parseHtmlTable.js"
import { parseSingleColumnTableAsParagraphs } from "../../common/Table.js"
import { LeafBlock } from "../../core/BaseBlock.js"

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

    if ($node.hasClass("colorscripter-code-table")) {
      const text = compactText($node.text())

      if (!text) {
        return []
      }

      if (!$node.is("table")) {
        const markdown = convertHtmlToMarkdown({
          html: $.html($node) ?? "",
          resolveLinkUrl: options.resolveLinkUrl,
        })

        return [{ type: "paragraph" as const, text: markdown || text }]
      }
    }

    if (!$node.is("table")) {
      throw new Error("SE2 table block parsing failed.")
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
