import type { CheerioAPI } from "cheerio"

import { LeafBlock } from "../../core/BaseBlock.js"
import { createCodeBlock } from "../../core/ParsedBlockOutput.js"

const parseColorScripterCode = ({
  $,
  element,
}: {
  $: CheerioAPI
  element: ReturnType<CheerioAPI>
}) => {
  if (!element.hasClass("colorscripter-code-table")) {
    return undefined
  }

  const lineNodes = element
    .find('div[style*="white-space:pre"], div[_foo*="white-space:pre"], pre')
    .toArray()
  const code = lineNodes
    .map((node) => $(node).text().replaceAll("\u00a0", " ").replaceAll("\u200b", ""))
    .map((line) => (line.trim() === "" ? "" : line))
    .join("\n")
    .trimEnd()

  return code || undefined
}

export class NaverSe2CodeBlock extends LeafBlock {
  override readonly id = "code"
  override readonly label = "코드"

  override match({ $, $node, node }: Parameters<LeafBlock["match"]>[0]) {
    if (node.type !== "tag") {
      return false
    }

    if (node.tagName.toLowerCase() === "pre") {
      return true
    }

    return parseColorScripterCode({ $, element: $node }) !== undefined
  }

  override convert({ $, $node, blockId }: Parameters<LeafBlock["convert"]>[0]) {
    const code = parseColorScripterCode({ $, element: $node }) ?? $node.text().trimEnd()

    if (!code) {
      return []
    }

    return [createCodeBlock({ blockId, language: null, code })]
  }
}
