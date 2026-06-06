import { compactText } from "@exitpress/engine/shared/text/util/TextCompaction.js"

import type { Cheerio, CheerioAPI } from "cheerio"
import type { AnyNode } from "domhandler"

import type { ParserBlockContext } from "../../../core/ParserBlock.js"

import { createLinkParagraphBlocks } from "../../../common/LinkParagraph.js"

// Finds nodes that belong to the current SE3 component, not nested components.
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

// Extracts text from the current component while ignoring nested component bodies.
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

// Converts SE3 place widgets into plain link paragraph blocks.
export const convertSe3MapPlace = ({
  $,
  $node,
  blockId,
  options,
}: Pick<ParserBlockContext, "$" | "$node" | "options"> & { blockId: string }) => {
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
    blockId,
    title,
    description,
    url: buildNaverMapSearchUrl(title),
    hasThumbnail: false,
    resolveLinkUrl: options.resolveLinkUrl,
  })
}
