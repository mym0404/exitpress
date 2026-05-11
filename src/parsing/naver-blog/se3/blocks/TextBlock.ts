import type { CheerioAPI } from "cheerio"
import type { ParserBlockContext } from "../../core/BaseBlock.js"
import { convertHtmlToMarkdown } from "../../../../markdown/TurndownMarkdownConverter.js"
import { compactMarkdownText } from "../../../../shared/text/TextUtils.js"
import { LeafBlock } from "../../core/BaseBlock.js"

const parseTextBlocks = ({
  $,
  $component,
  options,
}: {
  $: CheerioAPI
  $component: ReturnType<CheerioAPI>
  options: ParserBlockContext["options"]
}) =>
  $component
    .find(".se_textarea")
    .toArray()
    .map((node) =>
      convertHtmlToMarkdown({
        /* v8 ignore next */
        html: $(node).html() ?? "",
        resolveLinkUrl: options.resolveLinkUrl,
      }),
    )
    .map((text) => compactMarkdownText(text))
    .filter(Boolean)
    .map((text) => ({
      type: "paragraph" as const,
      text,
    }))

export class NaverSe3TextBlock extends LeafBlock {
  override readonly id = "paragraph"
  override readonly label = "문단"

  override match({ $node }: ParserBlockContext) {
    return $node.find(".se_textarea").length > 0
  }

  override convert({ $, $node, options }: Parameters<LeafBlock["convert"]>[0]) {
    const blocks = parseTextBlocks({ $, $component: $node, options })

    if (blocks.length === 0) {
      return []
    }

    return blocks
  }
}
