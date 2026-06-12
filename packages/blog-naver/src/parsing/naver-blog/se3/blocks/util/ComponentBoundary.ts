import { compactText } from "@exitpress/engine/shared/text/util/TextCompaction.js"

import type { Cheerio, CheerioAPI } from "cheerio"
import type { AnyNode } from "domhandler"

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
