import { compactText } from "../../common/TextUtils.js"
import {LeafBlock, type ParserBlockContext} from "../BaseBlock.js"

export class NaverSe2TextNodeBlock extends LeafBlock {
  override readonly id = "paragraph"
  override readonly label = "문단"

  override match({ node }: ParserBlockContext) {
    return node.type === "text"
  }

  override convert({ node }: Parameters<LeafBlock["convert"]>[0]) {
    /* v8 ignore next */
    const text = node.type === "text" ? compactText(node.data ?? "") : ""

    return text ? [{ type: "paragraph" as const, text }] : []
  }
}
