import { convertHtmlToMarkdown } from "../../converter/TurndownMarkdownConverter.js"
import {LeafBlock, type ParserBlockContext} from "../BaseBlock.js"
import type { OutputOption } from "../Types.js"

export class NaverSe2QuoteBlock extends LeafBlock {
  override readonly id = "quote"
  override readonly label = "인용문"
  override readonly outputOptions = [
    {
      id: "blockquote",
      label: "blockquote",
      description: "모든 줄 앞에 `>`를 붙입니다.",
      preview: {
        type: "quote",
        text: "Quoted line\nsecond line",
      },
      isDefault: true,
    },
  ] satisfies OutputOption<"quote">[]

  override match({ node }: ParserBlockContext) {
    return node.type === "tag" && node.tagName.toLowerCase() === "blockquote"
  }

  override convert({ $node, options }: Parameters<LeafBlock["convert"]>[0]) {
    const markdown = convertHtmlToMarkdown({
      /* v8 ignore next */
      html: $node.html() ?? "",
      resolveLinkUrl: options.resolveLinkUrl,
    })

    if (!markdown) {
      throw new Error("SE2 quote block parsing failed.")
    }

    return [{ type: "quote" as const, text: markdown }]
  }
}
