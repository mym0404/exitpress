import type { BlockTemplateDefinition } from "./Types.js"

export const createDefaultBlockTemplateMap = (definitions: BlockTemplateDefinition[]) =>
  Object.fromEntries(
    definitions.flatMap((definition) => {
      const template = definition.presets[0]?.template

      return template ? [[definition.key, template]] : []
    }),
  )
