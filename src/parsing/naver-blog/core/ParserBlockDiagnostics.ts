import type { ParsedBlock } from "../../../domain/parser/Types.js"
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

export type ParserBlockParseEvidence = {
  path: string
  blocks: ParsedBlock[]
  blockIndexes: number[]
  blockId: string
  parserBlockId: string
  parserBlockLabel: string
}
