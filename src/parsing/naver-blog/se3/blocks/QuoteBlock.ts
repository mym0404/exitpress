import type { OutputOption } from "../../../../domain/ast/Types.js"
import type { ParserBlockContext } from "../../core/BaseBlock.js"
import { convertHtmlToMarkdown } from "../../../../markdown/TurndownMarkdownConverter.js"
import { LeafBlock } from "../../core/BaseBlock.js"

export class NaverSe3QuoteBlock extends LeafBlock {
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

  override match({ $node }: ParserBlockContext) {
    return $node.find("blockquote").first().length > 0
  }

  override convert({ $node, options }: Parameters<LeafBlock["convert"]>[0]) {
    const markdown = convertHtmlToMarkdown({
      /* v8 ignore next */
      html: $node.find("blockquote").first().html() ?? "",
      resolveLinkUrl: options.resolveLinkUrl,
    })

    if (!markdown) {
      throw new Error("SE3 quote block parsing failed.")
    }

    return [{ type: "quote" as const, text: markdown }]
  }
}
