import type { ParserBlockContext, ParserBlockTemplateDefinition } from "../../core/BaseBlock.js"

import { convertHtmlToMarkdown } from "../../../../markdown/TurndownMarkdownConverter.js"
import { compactText } from "../../../../shared/text/TextUtils.js"
import { LeafBlock } from "../../core/BaseBlock.js"

export class NaverSe4HeadingBlock extends LeafBlock {
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

  override match({ $node }: ParserBlockContext) {
    return $node.hasClass("se-sectionTitle")
  }

  override convert({ $node, options }: Parameters<LeafBlock["convert"]>[0]) {
    const $textModule = $node.find(".se-module-text")
    const hasTextModule = $textModule.length > 0
    const title = compactText(
      convertHtmlToMarkdown({
        html: $textModule.html() ?? "",
        resolveLinkUrl: options.resolveLinkUrl,
      }),
    )

    if (!title) {
      if (hasTextModule) {
        return []
      }

      throw new Error("SE4 heading block parsing failed.")
    }

    return [{ type: "heading" as const, level: 2 as const, text: title }]
  }
}
