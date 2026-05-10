import type { CheerioAPI } from "cheerio"

import {ContainerBlock, type ParserBlockContext} from "../BaseBlock.js"
import { compactText } from "../../common/TextUtils.js"

const nestedBlockContainerTags = new Set(["div", "span", "font"])
const spacerContainerTags = new Set(["p", "div", "span", "font", "b", "strong", "i", "em", "u", "ul"])

const shouldUnwrapNestedBlocks = ({
  element,
  matchLeafNode,
  tagName,
}: {
  element: ReturnType<CheerioAPI>
  matchLeafNode: ParserBlockContext["matchLeafNode"]
  tagName: string
}) => {
  if (!nestedBlockContainerTags.has(tagName)) {
    return false
  }

  const childNodes = element.contents().toArray()
  const hasMeaningfulDirectText = childNodes.some(
    /* v8 ignore next */
    (node) => node.type === "text" && compactText(node.data ?? "") !== "",
  )

  if (hasMeaningfulDirectText) {
    return false
  }

  return childNodes.some((node) => node.type === "tag" && matchLeafNode(node))
}

export const isSpacerBlock = ({
  element,
  tagName,
}: {
  element: ReturnType<CheerioAPI>
  tagName: string
}) => {
  if (!spacerContainerTags.has(tagName)) {
    return false
  }

  const clone = element.clone()

  clone.find("br").remove()

  if (clone.find("img,iframe,video,table").length > 0) {
    return false
  }

  return compactText(clone.text()) === ""
}

export class NaverSe2ContainerBlock extends ContainerBlock {
  override readonly id = "container"
  override readonly label = "중첩 컨테이너"

  override match({ node, $node, matchLeafNode }: ParserBlockContext) {
    return (
      node.type === "tag" &&
      shouldUnwrapNestedBlocks({
        element: $node,
        matchLeafNode,
        tagName: node.tagName.toLowerCase(),
      })
    )
  }
}
