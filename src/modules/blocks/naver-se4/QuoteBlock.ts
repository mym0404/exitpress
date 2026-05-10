import { convertHtmlToMarkdown } from "../../converter/TurndownMarkdownConverter.js"
import type { OutputOption } from "../Types.js"
import {LeafBlock, type ParserBlockContext} from "../BaseBlock.js"

export class NaverSe4QuoteBlock extends LeafBlock {
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

  override match({ hasQuote }: ParserBlockContext) {
    return Boolean(hasQuote)
  }

  override convert({ $node, options }: Parameters<LeafBlock["convert"]>[0]) {
    const quoteMarkdown = convertHtmlToMarkdown({
      /* v8 ignore next */
      html: $node.find("blockquote.se-quotation-container").html() ?? "",
      resolveLinkUrl: options.resolveLinkUrl,
    })

    return quoteMarkdown ? [{ type: "quote" as const, text: quoteMarkdown }] : []
  }
}
