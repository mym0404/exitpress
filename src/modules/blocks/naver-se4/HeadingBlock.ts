import { convertHtmlToMarkdown } from "../../converter/HtmlFragmentConverter.js"
import type { OutputOption } from "../Types.js"
import { compactText } from "../../common/TextUtils.js"
import {LeafBlock, type ParserBlockContext} from "../BaseBlock.js"

export class NaverSe4HeadingBlock extends LeafBlock {
  override readonly id = "heading"
  override readonly label = "제목"
  override readonly outputOptions = [
    {
      id: "markdown-heading",
      label: "Markdown heading",
      description: "ATX heading(`#`) 형식으로 출력합니다.",
      preview: {
        type: "heading",
        level: 2,
        text: "Section title",
      },
      isDefault: true,
      params: [
        {
          key: "levelOffset",
          label: "제목 레벨 오프셋",
          description: "원본 제목 레벨에 더하거나 빼는 값입니다.",
          input: "number",
          defaultValue: 0,
        },
      ],
    },
  ] satisfies OutputOption<"heading">[]

  override match({ $node }: ParserBlockContext) {
    return $node.hasClass("se-sectionTitle")
  }

  override convert({ $node, options }: Parameters<LeafBlock["convert"]>[0]) {
    const $textModule = $node.find(".se-module-text")
    const hasTextModule = $textModule.length > 0
    const title = compactText(
      convertHtmlToMarkdown({
        html: $textModule.html() ?? "",
        options: {},
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
