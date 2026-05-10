import type { CheerioAPI } from "cheerio"

import { convertHtmlToMarkdown } from "../../converter/HtmlFragmentConverter.js"
import { compactMarkdownText } from "../../../shared/Utils.js"
import {LeafBlock, type ParserBlockContext} from "../BaseBlock.js"
import {
  getMarkdownLinkStyleFromSelection,
  paragraphOutputOptions,
} from "../../../shared/BlockOutputOptions.js"

const parseTextBlocks = ({
  $,
  $component,
  options,
  outputSelection,
}: {
  $: CheerioAPI
  $component: ReturnType<CheerioAPI>
  options: ParserBlockContext["options"]
  outputSelection?: Parameters<LeafBlock["convert"]>[0]["outputSelection"]
}) =>
  $component
    .find(".se_textarea")
    .toArray()
    .map((node) =>
      convertHtmlToMarkdown({
        /* v8 ignore next */
        html: $(node).html() ?? "",
        options: {
          linkStyle: getMarkdownLinkStyleFromSelection(outputSelection),
        },
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
  override readonly outputOptions = paragraphOutputOptions

  override match({ $node }: ParserBlockContext) {
    return $node.find(".se_textarea").length > 0
  }

  override convert({ $, $node, options, outputSelection }: Parameters<LeafBlock["convert"]>[0]) {
    const blocks = parseTextBlocks({ $, $component: $node, options, outputSelection })

    if (blocks.length === 0) {
      return []
    }

    return blocks
  }
}
