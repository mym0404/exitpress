import type { CheerioAPI } from "cheerio"

import { convertHtmlToMarkdown } from "../../converter/HtmlFragmentConverter.js"
import { getMarkdownLinkStyleFromSelection } from "../../converter/BlockMarkdown.js"
import type { OutputOption } from "../Types.js"
import { compactMarkdownText } from "../../common/TextUtils.js"
import {LeafBlock, type ParserBlockContext} from "../BaseBlock.js"

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
