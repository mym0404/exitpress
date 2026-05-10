import type {
  ParserBlockContext,
  ParserBlockConvertContext,
} from "./ParserNode.js"
import type { AstBlock, OutputOption } from "../../shared/Types.js"

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
