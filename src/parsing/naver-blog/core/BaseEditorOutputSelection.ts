import type {
  AstBlock,
  BlockOutputSelection,
  ParserBlockOptions,
} from "../../../domain/ast/Types.js"

import type { BaseBlock } from "./BaseBlock.js"

import { resolveBlockOutputSelection } from "../../../domain/export-options/BlockOutputSelection.js"

export const createBlockOutputSelectionKey = ({
  editorType,
  blockId,
}: {
  editorType: string
  blockId: string
}) => `${editorType}:${blockId}`

export const applyBlockOutputSelection = ({
  editorType,
  parsedBlock,
  parserBlock,
  options,
}: {
  editorType: string
  parsedBlock: AstBlock
  parserBlock: BaseBlock
  options: ParserBlockOptions
}) => {
  const outputOptions = parserBlock.outputOptions

  if (
    !parserBlock.id ||
    !outputOptions ||
    outputOptions.length < 2 ||
    !outputOptions.some((option) => option.preview.type === parsedBlock.type)
  ) {
    return parsedBlock
  }

  const selectionKey = createBlockOutputSelectionKey({
    editorType,
    blockId: parserBlock.id,
  })

  return {
    ...parsedBlock,
    outputSelectionKey: selectionKey,
    outputSelection: resolveBlockOutputSelection({
      blockType: parsedBlock.type,
      outputOptions: outputOptions.filter((option) => option.preview.type === parsedBlock.type),
      blockOutputs: options.blockOutputs,
      selectionKey,
    }) as BlockOutputSelection,
  } as AstBlock & {
    outputSelectionKey: string
    outputSelection: BlockOutputSelection
  }
}
