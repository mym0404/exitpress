import type { ParsedBlock } from "@exitpress/domain/parser/schema/ParsedPost.js"
import type { ParserBlockOptions } from "@exitpress/domain/parser/schema/ParserBlockOptions.js"
import type { BlockTemplateDefinition } from "@exitpress/domain/template/schema/BlockTemplateDefinition.js"
import type { UnknownRecord } from "@exitpress/engine/shared/object/UnknownRecord.js"
import type { Cheerio, CheerioAPI } from "cheerio"
import type { AnyNode } from "domhandler"

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
  abstract readonly templateDefinition: ParserBlockTemplateDefinition
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
