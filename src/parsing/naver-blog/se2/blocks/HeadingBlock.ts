import type { ParserBlockContext, ParserBlockTemplateDefinition } from "../../core/BaseBlock.js"

import { convertHtmlToMarkdown } from "../../../../markdown/TurndownMarkdownConverter.js"
import { compactText } from "../../../../shared/text/TextUtils.js"
import { LeafBlock } from "../../core/BaseBlock.js"
import { createHeadingBlock } from "../../core/ParsedBlockOutput.js"

export class NaverSe2HeadingBlock extends LeafBlock {
  override readonly id = "heading"
  override readonly label = "제목"
  override readonly templateDefinition = {
    label: this.label,
    presets: [
      {
        id: "default",
        label: "기본",
        template: "## ${text}",
      },
    ],
    props: {
      text: { label: "본문", type: "string" },
    },
  } satisfies ParserBlockTemplateDefinition

  override match({ node }: ParserBlockContext) {
    return node.type === "tag" && /^h[1-6]$/.test(node.tagName.toLowerCase())
  }

  override convert({ $node, node, options, blockId }: Parameters<LeafBlock["convert"]>[0]) {
    /* v8 ignore next 3 */
    if (node.type !== "tag") {
      throw new Error("SE2 heading block received a non-tag node.")
    }

    const level = Number(node.tagName[1])
    const text = compactText(
      convertHtmlToMarkdown({
        /* v8 ignore next */
        html: $node.html() ?? "",
        resolveLinkUrl: options.resolveLinkUrl,
      }),
    )

    if (!text) {
      throw new Error(`SE2 heading block parsing failed: <${node.tagName.toLowerCase()}>`)
    }

    return [createHeadingBlock({ blockId, level, text })]
  }
}
