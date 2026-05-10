import { compactText } from "../../../shared/Utils.js"
import { LeafBlock } from "../BaseBlock.js"
import type { ParserBlockContext } from "../ParserNode.js"

export class NaverSe4MrBlogBlock extends LeafBlock {
  override readonly id = "mrBlog"
  override readonly label = "블로그씨 질문"

  override match({ $node }: ParserBlockContext) {
    return $node.hasClass("se-mrBlog")
  }

  override convert({ $node }: Parameters<LeafBlock["convert"]>[0]) {
    const from = compactText($node.find(".se-mrBlog-from").text())
    const question = compactText($node.find(".se-mrBlog-question").text())
    const text = [from, question].filter(Boolean).join("\n\n")

    if (!text) {
      throw new Error("SE4 mrBlog block parsing failed.")
    }

    return [{ type: "quote" as const, text }]
  }
}
