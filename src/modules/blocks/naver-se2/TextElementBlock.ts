import { convertHtmlToMarkdown } from "../../converter/HtmlFragmentConverter.js"
import { getMarkdownLinkStyleFromSelection } from "../../converter/BlockMarkdown.js"
import type { OutputOption } from "../Types.js"
import { compactText } from "../../common/TextUtils.js"
import {LeafBlock, type ParserBlockContext} from "../BaseBlock.js"

export class NaverSe2TextElementBlock extends LeafBlock {
  override readonly id = "paragraph"
  override readonly label = "문단"
  override readonly outputOptions = [
    {
      id: "inline-links",
      label: "inline links",
      description: "문단 안 링크를 inline 형식으로 출력합니다.",
      preview: {
        type: "paragraph",
        text: "일반 링크: [example](https://example.com)",
      },
      isDefault: true,
    },
    {
      id: "reference-links",
      label: "reference links",
      description: "문단 안 링크를 reference 형식으로 분리합니다.",
      preview: {
        type: "paragraph",
        text: "일반 링크: [example][ref-1]\n\n[ref-1]: https://example.com",
      },
    },
  ] satisfies OutputOption<"paragraph">[]

  override match({ node, $node }: ParserBlockContext) {
    if (node.type !== "tag") {
      return false
    }

    if (compactText($node.text()) === "") {
      return false
    }

    return !["table", "hr", "br", "blockquote", "pre"].includes(node.tagName.toLowerCase())
  }

  override convert({ $, $node, node, options, outputSelection }: Parameters<LeafBlock["convert"]>[0]) {
    /* v8 ignore next 3 */
    if (node.type !== "tag") {
      throw new Error("SE2 text element block received a non-tag node.")
    }

    /* v8 ignore next */
    const html = $.html($node) ?? ""
    const markdown = convertHtmlToMarkdown({
      html,
      options: {
        linkStyle: getMarkdownLinkStyleFromSelection(outputSelection),
      },
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

    throw new Error(`SE2 text element block markdown conversion failed: <${node.tagName.toLowerCase()}>`)
  }
}
