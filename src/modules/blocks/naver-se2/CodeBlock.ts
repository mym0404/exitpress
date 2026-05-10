import { LeafBlock } from "../BaseBlock.js"
import type { OutputOption } from "../Types.js"

export class NaverSe2CodeBlock extends LeafBlock {
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

  override match({ node }: Parameters<LeafBlock["match"]>[0]) {
    return node.type === "tag" && node.tagName.toLowerCase() === "pre"
  }

  override convert({ $node }: Parameters<LeafBlock["convert"]>[0]) {
    const code = $node.text().trimEnd()

    if (!code) {
      return []
    }

    return [{ type: "code" as const, language: null, code }]
  }
}
