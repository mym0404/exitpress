import type { Cheerio, CheerioAPI } from "cheerio"
import type { AnyNode } from "domhandler"

import type { AstBlock, ParserBlockOptions } from "../../../domain/ast/Types.js"
import type { BlockTemplateDefinition } from "../../../domain/template/Types.js"
import type { UnknownRecord } from "../../../shared/object/UnknownRecord.js"

export type ParserBlockTemplateDefinition = Omit<BlockTemplateDefinition, "key"> & {
  key?: string
}

export type ParserBlockContext = {
  $: CheerioAPI
  $node: Cheerio<AnyNode>
  node: AnyNode
  sourceUrl?: string
  tags: string[]
  options: ParserBlockOptions
  moduleData?: UnknownRecord | null
  moduleType?: string | null
  hasQuote?: boolean
  matchLeafNode: (node: AnyNode) => boolean
}
export type ParserBlockConvertContext = ParserBlockContext & {
  path: string
  matchNode: (node: AnyNode, path: string) => AstBlock[]
}

export type ParserBlockStoryGroup = "output" | "auxiliary"

type ParserBlockStoryMetadata = {
  group?: ParserBlockStoryGroup
  sourceUrl?: string
  inspectPath?: string
  inputHtml?: string
  screenshotSrc?: string
}

export abstract class BaseBlock {
  abstract readonly id: string
  readonly templateDefinition?: ParserBlockTemplateDefinition
  abstract readonly label: string
  readonly story?: ParserBlockStoryMetadata

  abstract match(context: ParserBlockContext): boolean

  abstract convert(context: ParserBlockConvertContext): AstBlock[]
}

export abstract class ContainerBlock extends BaseBlock {
  override convert({ $node, matchNode, path }: ParserBlockConvertContext) {
    return $node
      .contents()
      .toArray()
      .flatMap((node, index) => matchNode(node, `${path}.${index}`))
  }
}

export abstract class LeafBlock extends BaseBlock {}
