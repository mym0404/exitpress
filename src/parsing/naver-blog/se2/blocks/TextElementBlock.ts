import type { ParserBlockContext } from "../../core/BaseBlock.js"
import { convertHtmlToMarkdown } from "../../../../markdown/TurndownMarkdownConverter.js"
import { compactText } from "../../../../shared/text/TextUtils.js"
import { LeafBlock } from "../../core/BaseBlock.js"

export class NaverSe2TextElementBlock extends LeafBlock {
  override readonly id = "paragraph"
  override readonly label = "문단"

  override match({ node, $node }: ParserBlockContext) {
    if (node.type !== "tag") {
      return false
    }

    if (compactText($node.text()) === "") {
      return false
    }

    return !["table", "hr", "br", "blockquote", "pre"].includes(node.tagName.toLowerCase())
  }

  override convert({ $, $node, node, options }: Parameters<LeafBlock["convert"]>[0]) {
    /* v8 ignore next 3 */
    if (node.type !== "tag") {
      throw new Error("SE2 text element block received a non-tag node.")
    }

    /* v8 ignore next */
    const html = $.html($node) ?? ""
    const markdown = convertHtmlToMarkdown({
      html,
      resolveLinkUrl: options.resolveLinkUrl,
    })

    if (markdown) {
      return [{ type: "paragraph" as const, text: markdown }]
    }

    const text = compactText($node.text())

    /* v8 ignore next 3 */
    if (!text) {
      throw new Error(`SE2 text element block parsing failed: <${node.tagName.toLowerCase()}>`)
    }

    throw new Error(
      `SE2 text element block markdown conversion failed: <${node.tagName.toLowerCase()}>`,
    )
  }
}
