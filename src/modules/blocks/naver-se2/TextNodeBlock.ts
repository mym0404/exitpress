import type { OutputOption } from "../Types.js"
import { compactText } from "../../common/TextUtils.js"
import {LeafBlock, type ParserBlockContext} from "../BaseBlock.js"

export class NaverSe2TextNodeBlock extends LeafBlock {
  override readonly id = "paragraph"
  override readonly label = "문단"
  override readonly outputOptions = [
    {
      id: "markdown-paragraph",
      label: "Markdown 문단",
      description: "정규화된 문단 텍스트를 그대로 출력합니다.",
      preview: {
        type: "paragraph",
        text: "첫 줄입니다.\n\n둘째 문단입니다.",
      },
      isDefault: true,
    },
  ] satisfies OutputOption<"paragraph">[]

  override match({ node }: ParserBlockContext) {
    return node.type === "text"
  }

  override convert({ node }: Parameters<LeafBlock["convert"]>[0]) {
    /* v8 ignore next */
    const text = node.type === "text" ? compactText(node.data ?? "") : ""

    return text ? [{ type: "paragraph" as const, text }] : []
  }
}
