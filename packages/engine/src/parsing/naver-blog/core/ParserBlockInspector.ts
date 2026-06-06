import { compactText } from "@exitpress/engine/shared/text/TextUtils.js"

import type { ParserBlockOptions } from "@exitpress/domain/parser/Types.js"
import type { UnknownRecord } from "@exitpress/engine/shared/object/UnknownRecord.js"
import type { CheerioAPI } from "cheerio"
import type { AnyNode } from "domhandler"

import type { ParserBlock, ParserBlockContext } from "./ParserBlock.js"
import type { ParserBlockInspection } from "./ParserBlockDiagnostics.js"

import { ContainerParserBlock, LeafParserBlock } from "./ParserBlock.js"

const inspectTextMaxLength = 200
const inspectHtmlMaxLength = 700

const truncateInspectionValue = (value: string, maxLength: number) =>
  value.length > maxLength ? `${value.slice(0, maxLength)}...` : value

export const inspectParserBlocks = ({
  $,
  nodes,
  tags,
  options,
  sourceUrl,
  supportedBlocks,
  moduleContext,
}: {
  $: CheerioAPI
  nodes: AnyNode[]
  tags: string[]
  options: ParserBlockOptions
  sourceUrl?: string
  supportedBlocks: readonly ParserBlock[]
  moduleContext?: (node: AnyNode) => {
    moduleData?: UnknownRecord | null
    moduleType?: string | null
    hasQuote?: boolean
  }
}) => {
  const createBlockContext = (node: AnyNode): ParserBlockContext => ({
    $,
    $node: $(node),
    node,
    sourceUrl,
    tags,
    options,
    matchLeafNode,
    ...moduleContext?.(node),
  })

  const matchLeafNode = (node: AnyNode) => {
    const context = createBlockContext(node)

    return supportedBlocks.some(
      (supportedBlock) =>
        supportedBlock instanceof LeafParserBlock && supportedBlock.match(context),
    )
  }

  const inspectNode = (node: AnyNode, path: string): ParserBlockInspection => {
    const context = createBlockContext(node)
    const block = supportedBlocks.find((supportedBlock) => supportedBlock.match(context))
    const $node = $(node)
    const tagName = node.type === "tag" ? node.tagName.toLowerCase() : node.type
    const children =
      node.type === "tag" && (!block || block instanceof ContainerParserBlock)
        ? $node
            .contents()
            .toArray()
            .map((child, index) => inspectNode(child, `${path}.${index}`))
        : []
    const id = $node.attr("id")
    const className = $node.attr("class")
    const style = $node.attr("style")
    const moduleType = typeof context.moduleType === "string" ? context.moduleType : undefined
    const moduleData = context.moduleData ?? undefined

    return {
      path,
      tagName,
      unsupported: !block,
      text: truncateInspectionValue(compactText($node.text()), inspectTextMaxLength),
      html: truncateInspectionValue(compactText($.html($node) ?? ""), inspectHtmlMaxLength),
      ...(id ? { id } : {}),
      ...(className ? { className } : {}),
      ...(style ? { style } : {}),
      ...(moduleType ? { moduleType } : {}),
      ...(moduleData ? { moduleData } : {}),
      ...(block ? { matchedBlockId: block.id, matchedBlockLabel: block.label } : {}),
      ...(children.length > 0 ? { children } : {}),
    }
  }

  return nodes.map((node, index) => inspectNode(node, String(index)))
}
