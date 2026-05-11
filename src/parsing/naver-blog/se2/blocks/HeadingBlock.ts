import type { OutputOption } from "../../../../domain/ast/Types.js"
import type { ParserBlockContext } from "../../core/BaseBlock.js"
import { convertHtmlToMarkdown } from "../../../../markdown/TurndownMarkdownConverter.js"
import { compactText } from "../../../../shared/text/TextUtils.js"
import { LeafBlock } from "../../core/BaseBlock.js"

export class NaverSe2HeadingBlock extends LeafBlock {
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

  override match({ node }: ParserBlockContext) {
    return node.type === "tag" && /^h[1-6]$/.test(node.tagName.toLowerCase())
  }

  override convert({ $node, node, options }: Parameters<LeafBlock["convert"]>[0]) {
    /* v8 ignore next 3 */
    if (node.type !== "tag") {
      throw new Error("SE2 heading block received a non-tag node.")
    }

    const level = Number(node.tagName[1])
    const text = compactText(
      convertHtmlToMarkdown({
        /* v8 ignore next */
        html: $node.html() ?? "",
        resolveLinkUrl: options.resolveLinkUrl,
      }),
    )

    if (!text) {
      throw new Error(`SE2 heading block parsing failed: <${node.tagName.toLowerCase()}>`)
    }

    return [{ type: "heading" as const, level, text }]
  }
}
