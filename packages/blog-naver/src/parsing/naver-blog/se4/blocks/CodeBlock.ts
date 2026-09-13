import type { ParserBlockContext, ParserBlockTemplateDefinition } from "../../core/ParserBlock.js"

import { createCodeBlock } from "../../core/ParsedBlockOutput.js"
import { LeafParserBlock } from "../../core/ParserBlock.js"

const getColorScripterSource = ($node: ParserBlockContext["$node"]) => {
  const table = $node.find("table").first()
  const rows = table.find("tr")
  const cells = rows.children("td")
  const attribution = cells.last()
  const link = attribution.find("a")
  const source = cells.first()

  if (
    !$node.hasClass("se-table") ||
    rows.length !== 1 ||
    cells.length !== 2 ||
    cells.is('[colspan]:not([colspan="1"]), [rowspan]:not([rowspan="1"])') ||
    link.length !== 1 ||
    !/^https?:\/\/colorscripter\.com\/info#e$/.test(link.attr("href") ?? "") ||
    attribution.text().trim() !== "cs" ||
    source.find("p").length === 0 ||
    table.find("img, video, iframe, pre, ul, ol, blockquote, table").length > 0
  ) {
    return null
  }

  return source
}

export class NaverSe4CodeBlock extends LeafParserBlock {
  override readonly id = "code"
  override readonly label = "코드"
  override readonly templateDefinition = {
    label: this.label,
    presets: [
      {
        id: "default",
        label: "코드 펜스",
        template: "{{ `\\`\\`\\`${language ?? ''}\n${code}\n\\`\\`\\`` }}",
      },
    ],
    props: {
      language: { label: "언어", type: "string?" },
      code: { label: "코드", type: "string" },
    },
  } satisfies ParserBlockTemplateDefinition

  override match({ $node, moduleType }: ParserBlockContext) {
    return (
      moduleType === "v2_code" ||
      $node.hasClass("se-code") ||
      getColorScripterSource($node) !== null
    )
  }

  override convert({ $, $node, blockId }: Parameters<LeafParserBlock["convert"]>[0]) {
    const colorScripterSource = getColorScripterSource($node)

    if (colorScripterSource) {
      const code = colorScripterSource
        .find("p")
        .toArray()
        .map((paragraph) => {
          const line = $(paragraph).clone()
          line.find("br").replaceWith("\n")
          return line.text()
        })
        .join("\n")

      return [createCodeBlock({ blockId, language: null, code })]
    }

    const sourceNode = $node.find(".__se_code_view").first()
    /* v8 ignore next */
    const classNames = sourceNode.attr("class") ?? ""
    const languageMatch = classNames.match(/language-([\w-]+)/)
    const code = sourceNode.text().trimEnd()

    if (!code) {
      return []
    }

    return [createCodeBlock({ blockId, language: languageMatch?.[1] ?? null, code })]
  }
}
