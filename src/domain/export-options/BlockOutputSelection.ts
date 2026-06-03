import type {
  BlockOutputParamValue,
  BlockOutputSelection,
  BlockType,
  OutputOption,
} from "../ast/Types.js"

import type { ExportOptions } from "./Types.js"

const fallbackBlockOutputSelections: Partial<Record<BlockType, BlockOutputSelection>> = {
  heading: {
    variant: "markdown-heading",
    params: {
      levelOffset: 0,
    },
  },
  quote: { variant: "blockquote" },
  formula: {
    variant: "wrapper",
    params: {
      inlineWrapper: "$",
      blockWrapper: "$$",
    },
  },
  image: { variant: "markdown-image" },
  imageGroup: { variant: "split-images" },
  video: { variant: "source-link" },
  table: { variant: "gfm-or-html" },
}

const mergeBlockOutputSelection = ({
  baseSelection,
  nextSelection,
}: {
  baseSelection: BlockOutputSelection
  nextSelection?: BlockOutputSelection
}) => {
  const params = {
    ...(baseSelection.params ?? {}),
    ...(nextSelection?.params ?? {}),
  }

  return {
    variant: nextSelection?.variant ?? baseSelection.variant,
    ...(Object.keys(params).length > 0 ? { params } : {}),
  }
}

const getDefaultOutputOption = (outputOptions: readonly OutputOption[]) =>
  outputOptions.find((option) => option.isDefault) ?? outputOptions[0]

const createSelectionFromOutputOption = (option: OutputOption): BlockOutputSelection => {
  const params = (option.params ?? []).reduce<Record<string, BlockOutputParamValue>>(
    (nextParams, param) => {
      if (param.defaultValue !== undefined) {
        nextParams[param.key] = param.defaultValue
      }

      return nextParams
    },
    {},
  )

  return {
    variant: option.id,
    ...(Object.keys(params).length > 0 ? { params } : {}),
  }
}

export const resolveBlockOutputSelection = ({
  blockType,
  outputOptions,
  blockOutputs,
  selectionKey,
}: {
  blockType: BlockType
  outputOptions?: readonly OutputOption[]
  blockOutputs?: {
    defaults?: ExportOptions["blockOutputs"]["defaults"]
  }
  selectionKey?: string
}): BlockOutputSelection => {
  const nextSelection = selectionKey ? blockOutputs?.defaults?.[selectionKey] : undefined

  const defaultOption = outputOptions ? getDefaultOutputOption(outputOptions) : undefined
  const baseSelection = defaultOption
    ? createSelectionFromOutputOption(defaultOption)
    : fallbackBlockOutputSelections[blockType]

  if (!baseSelection) {
    throw new Error(`No default output selection for ${blockType}.`)
  }

  return mergeBlockOutputSelection({
    baseSelection,
    nextSelection,
  })
}
