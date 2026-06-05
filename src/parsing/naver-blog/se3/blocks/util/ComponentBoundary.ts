import type { Cheerio, CheerioAPI } from "cheerio"
import type { AnyNode } from "domhandler"

import type { ParserBlockContext } from "../../../core/BaseBlock.js"
import type { ParserBlockNode } from "../../../core/ParserBlockNode.js"

import { compactText } from "../../../../../shared/text/TextUtils.js"
import { createLinkParagraphBlocks } from "../../../common/LinkParagraph.js"

export const findInComponentRoot = ({
  $,
  $component,
  selector,
}: {
  $: CheerioAPI
  $component: Cheerio<AnyNode>
  selector: string
}) => {
  const componentNode = $component[0]

  return $component.find(selector).filter((_, node) => {
    const ownerComponent = $(node).closest(".se_component")[0]

    return !ownerComponent || ownerComponent === componentNode
  })
}

export const textOutsideNestedComponents = ({
  $component,
  selector,
}: {
  $component: Cheerio<AnyNode>
  selector: string
}) =>
  compactText(
    $component
      .clone()
      .find(".se_component, script, style, template")
      .remove()
      .end()
      .find(selector)
      .remove()
      .end()
      .text(),
  )

const buildNaverMapSearchUrl = (query: string) =>
  `https://map.naver.com/p/search/${encodeURIComponent(query)}`

export const convertSe3MapPlace = ({
  $,
  $node,
  options,
}: Pick<ParserBlockContext, "$" | "$node" | "options">): ParserBlockNode[] => {
  const title = compactText(
    findInComponentRoot({ $, $component: $node, selector: ".se_title" })
      .first()
      .contents()
      .first()
      .text(),
  )
  const description = compactText(
    findInComponentRoot({ $, $component: $node, selector: ".se_address" }).first().text(),
  )

  if (!title) {
    throw new Error("SE3 map block parsing failed.")
  }

  return createLinkParagraphBlocks({
    title,
    description,
    url: buildNaverMapSearchUrl(title),
    hasThumbnail: false,
    resolveLinkUrl: options.resolveLinkUrl,
  })
}
