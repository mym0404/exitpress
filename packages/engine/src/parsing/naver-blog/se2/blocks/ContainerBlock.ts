import { compactText } from "@exitpress/engine/shared/text/util/TextCompaction.js"

import type { CheerioAPI } from "cheerio"

import type { ParserBlockContext } from "../../core/ParserBlock.js"

import { ContainerParserBlock } from "../../core/ParserBlock.js"

const nestedBlockContainerTags = new Set(["div", "span", "font", "strong"])
const spacerContainerTags = new Set([
  "p",
  "div",
  "span",
  "font",
  "b",
  "strong",
  "i",
  "em",
  "o:p",
  "u",
  "strike",
  "ul",
  "a",
])

const shouldUnwrapNestedBlocks = ({
  $,
  element,
  matchLeafNode,
  tagName,
}: {
  $: CheerioAPI
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

  if (
    tagName === "strong" &&
    element.find("table,img,iframe,video,hr,blockquote,pre").length === 0
  ) {
    return false
  }

  const hasNestedLeafNode = (candidate: ReturnType<CheerioAPI>): boolean =>
    candidate
      .contents()
      .toArray()
      .some((node) => {
        if (node.type !== "tag") {
          return false
        }

        const childTagName = node.tagName.toLowerCase()

        return (
          matchLeafNode(node) ||
          (nestedBlockContainerTags.has(childTagName) && hasNestedLeafNode($(node)))
        )
      })

  return hasNestedLeafNode(element)
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

export class NaverSe2ContainerBlock extends ContainerParserBlock {
  override readonly id = "container"
  override readonly label = "중첩 컨테이너"

  override match({ $, node, $node, matchLeafNode }: ParserBlockContext) {
    return (
      node.type === "tag" &&
      shouldUnwrapNestedBlocks({
        $,
        element: $node,
        matchLeafNode,
        tagName: node.tagName.toLowerCase(),
      })
    )
  }
}
