import { LeafBlock } from "../../core/BaseBlock.js"

export class NaverSe2CodeBlock extends LeafBlock {
  override readonly id = "code"
  override readonly label = "코드"

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
