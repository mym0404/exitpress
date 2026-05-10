import {LeafBlock, type ParserBlockContext} from "../BaseBlock.js"
import type { OutputOption } from "../Types.js"

export class NaverSe4CodeBlock extends LeafBlock {
  override readonly id = "code"
  override readonly label = "코드"
  override readonly outputOptions = [
    {
      id: "backtick-fence",
      label: "``` fence",
      description: "backtick fence를 사용합니다.",
      preview: {
        type: "code",
        language: "ts",
        code: "const value = 1",
      },
      isDefault: true,
    },
    {
      id: "tilde-fence",
      label: "~~~ fence",
      description: "tilde fence를 사용합니다.",
      preview: {
        type: "code",
        language: "ts",
        code: "const value = 1",
      },
    },
  ] satisfies OutputOption<"code">[]

  override match({ $node, moduleType }: ParserBlockContext) {
    return moduleType === "v2_code" || $node.hasClass("se-code")
  }

  override convert({ $node }: Parameters<LeafBlock["convert"]>[0]) {
    const sourceNode = $node.find(".__se_code_view").first()
    /* v8 ignore next */
    const classNames = sourceNode.attr("class") ?? ""
    const languageMatch = classNames.match(/language-([\w-]+)/)
    const code = sourceNode.text().trimEnd()

    if (!code) {
      return []
    }

    return [
      {
        type: "code" as const,
        language: languageMatch?.[1] ?? null,
        code,
      },
    ]
  }
}
