import type { AstBlock, OutputOption, ParserBlockOptions, BlockOutputSelection } from "./Types.js"
import type { UnknownRecord } from "../common/Types.js"
import {type CheerioAPI, Cheerio} from "cheerio";
import type {AnyNode} from "domhandler";

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
  outputSelection?: BlockOutputSelection
  matchNode: (node: AnyNode, path: string) => AstBlock[]
}

export abstract class BaseBlock {
  abstract readonly id: string
  readonly outputOptions?: readonly OutputOption[]
  abstract readonly label: string

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
