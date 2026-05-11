import type { AstBlock } from "../../../domain/ast/Types.js"
import type { UnknownRecord } from "../../../shared/object/UnknownRecord.js"

export type ParserBlockInspection = {
  path: string
  tagName: string
  unsupported: boolean
  text: string
  html: string
  id?: string
  className?: string
  style?: string
  moduleType?: string
  moduleData?: UnknownRecord
  matchedBlockId?: string
  matchedBlockLabel?: string
  children?: ParserBlockInspection[]
}

export type ParserBlockSourceEvidence = {
  path: string
  block: AstBlock
  blockType: AstBlock["type"]
  parserBlockId: string
  parserBlockLabel: string
}
