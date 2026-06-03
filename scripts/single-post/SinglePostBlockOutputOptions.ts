import type { BlockOutputSelection } from "../../src/domain/ast/Types.js"
import type { ExportOptions } from "../../src/domain/export-options/Types.js"

import { resolveBlockOutputSelection } from "../../src/domain/export-options/BlockOutputSelection.js"
import { defaultExportOptions } from "../../src/domain/export-options/ExportOptions.js"

import {
  assertAllowedKeys,
  assertFiniteNumber,
  assertPlainObject,
  assertString,
  failOptions,
} from "./SinglePostOptionGuards.js"
import {
  allowedBlockOutputsKeys,
  editorBlockOutputDefinitionMap,
  editorBlockOutputSelectionKeys,
} from "./SinglePostOptionMetadata.js"

const validateBlockOutputSelection = ({
  value,
  context,
  optionsPath,
  selectionKey,
}: {
  value: unknown
  context: string
  optionsPath: string
  selectionKey: string
}) => {
  assertPlainObject(value, context, optionsPath)
  assertAllowedKeys(value, ["variant", "params"], context, optionsPath)

  const definition =
    editorBlockOutputDefinitionMap.get(selectionKey) ??
    failOptions(
      optionsPath,
      `${context} references unknown editor block output key: ${selectionKey}`,
    )
  const defaultOption =
    definition.options.find((option) => option.isDefault) ??
    definition.options[0] ??
    failOptions(optionsPath, `${context} has no output options`)
  const resolvedBlockType = defaultOption.preview.type

  const nextSelection = resolveBlockOutputSelection({
    blockType: resolvedBlockType,
    outputOptions: definition.options,
  })

  if ("variant" in value) {
    const variant = value.variant
    assertString(variant, `${context}.variant`, optionsPath)

    if (!definition.options.some((item) => item.id === variant)) {
      failOptions(
        optionsPath,
        `${context}.variant must be one of: ${definition.options.map((item) => item.id).join(", ")}`,
      )
    }

    nextSelection.variant = variant
  }

  if ("params" in value) {
    const paramsValue = value.params
    assertPlainObject(paramsValue, `${context}.params`, optionsPath)

    const selectedOption =
      definition.options.find((option) => option.id === nextSelection.variant) ?? defaultOption
    const allowedParamKeys = new Set(selectedOption.params?.map((param) => param.key) ?? [])
    assertAllowedKeys(paramsValue, Array.from(allowedParamKeys), `${context}.params`, optionsPath)

    nextSelection.params = {
      ...(nextSelection.params ?? {}),
    }

    for (const [paramKey, paramValue] of Object.entries(paramsValue)) {
      const paramDefinition =
        selectedOption.params?.find((param) => param.key === paramKey) ??
        failOptions(optionsPath, `${context}.params.${paramKey} is not supported`)

      if (paramDefinition.input === "number") {
        assertFiniteNumber(paramValue, `${context}.params.${paramKey}`, optionsPath)
      } else {
        assertString(paramValue, `${context}.params.${paramKey}`, optionsPath)
      }

      nextSelection.params[paramKey] = paramValue
    }
  }

  return nextSelection
}

const assignBlockOutputDefault = ({
  defaults,
  selectionKey,
  selection,
}: {
  defaults: ExportOptions["blockOutputs"]["defaults"]
  selectionKey: string
  selection: BlockOutputSelection
}) => {
  defaults[selectionKey] = selection
}

export const validateBlockOutputsOptions = (value: unknown, optionsPath: string) => {
  assertPlainObject(value, "blockOutputs", optionsPath)
  assertAllowedKeys(value, allowedBlockOutputsKeys, "blockOutputs", optionsPath)

  const blockOutputs = defaultExportOptions().blockOutputs

  if ("defaults" in value) {
    const defaultsValue = value.defaults
    assertPlainObject(defaultsValue, "blockOutputs.defaults", optionsPath)
    assertAllowedKeys(
      defaultsValue,
      editorBlockOutputSelectionKeys,
      "blockOutputs.defaults",
      optionsPath,
    )

    const nextDefaults: ExportOptions["blockOutputs"]["defaults"] = {
      ...blockOutputs.defaults,
    }

    for (const selectionKey of editorBlockOutputSelectionKeys) {
      if (selectionKey in defaultsValue) {
        assignBlockOutputDefault({
          defaults: nextDefaults,
          selectionKey,
          selection: validateBlockOutputSelection({
            value: defaultsValue[selectionKey],
            context: `blockOutputs.defaults.${selectionKey}`,
            optionsPath,
            selectionKey,
          }),
        })
      }
    }

    blockOutputs.defaults = nextDefaults
  }

  return blockOutputs
}
