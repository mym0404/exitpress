import type { Cheerio, CheerioAPI } from "cheerio"
import type { AnyNode } from "domhandler"

import type { ParsedBlock, ParserBlockOptions } from "../../../domain/parser/Types.js"
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
  blockId: string
  path: string
  matchNode: (node: AnyNode, path: string) => ParsedBlock[]
}

export abstract class ParserBlock {
  abstract readonly id: string
  readonly templateDefinition?: ParserBlockTemplateDefinition
  abstract readonly label: string

  abstract match(context: ParserBlockContext): boolean

  abstract convert(context: ParserBlockConvertContext): ParsedBlock[]
}

export abstract class ContainerParserBlock extends ParserBlock {
  override convert({ $node, matchNode, path }: ParserBlockConvertContext) {
    return $node
      .contents()
      .toArray()
      .flatMap((node, index) => matchNode(node, `${path}.${index}`))
  }
}

export abstract class LeafParserBlock extends ParserBlock {}
