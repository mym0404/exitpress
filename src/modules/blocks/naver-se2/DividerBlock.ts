import {LeafBlock, type ParserBlockContext} from "../BaseBlock.js"
import type { OutputOption } from "../Types.js"

export class NaverSe2DividerBlock extends LeafBlock {
  override readonly id = "divider"
  override readonly label = "구분선"
  override readonly outputOptions = [
    {
      id: "dash-rule",
      label: "`---`",
      description: "dash 구분선으로 출력합니다.",
      preview: {
        type: "divider",
      },
      isDefault: true,
    },
    {
      id: "asterisk-rule",
      label: "`***`",
      description: "asterisk 구분선으로 출력합니다.",
      preview: {
        type: "divider",
      },
    },
  ] satisfies OutputOption<"divider">[]

  override match({ node }: ParserBlockContext) {
    return node.type === "tag" && node.tagName.toLowerCase() === "hr"
  }

  override convert() {
    return [{ type: "divider" as const }]
  }
}
