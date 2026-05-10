import {LeafBlock, type ParserBlockContext} from "../BaseBlock.js"

export class NaverSe3CodeBlock extends LeafBlock {
  override readonly id = "code"
  override readonly label = "코드"

  override match({ $node }: ParserBlockContext) {
    return $node.find("pre").first().length > 0
  }

  override convert({ $node }: Parameters<LeafBlock["convert"]>[0]) {
    const code = $node.find("pre").first().text().trimEnd()

    if (!code) {
      return []
    }

    return [{ type: "code" as const, language: null, code }]
  }
}
