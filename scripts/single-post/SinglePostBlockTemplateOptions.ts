import type { ExportOptions } from "../../src/domain/export-options/Types.js"

import { defaultExportOptions } from "../../src/domain/export-options/ExportOptions.js"

import {
  assertAllowedKeys,
  assertPlainObject,
  assertString,
  failOptions,
} from "./SinglePostOptionGuards.js"
import { allowedBlockTemplateKeys } from "./SinglePostOptionMetadata.js"

export const validateBlockTemplateOptions = (value: unknown, optionsPath: string) => {
  assertPlainObject(value, "blockOutputs", optionsPath)
  assertAllowedKeys(value, allowedBlockTemplateKeys, "blockOutputs", optionsPath)

  const blockOutputs = defaultExportOptions().blockOutputs

  if ("templates" in value) {
    const templatesValue = value.templates
    assertPlainObject(templatesValue, "blockOutputs.templates", optionsPath)

    const templates: ExportOptions["blockOutputs"]["templates"] = {}

    for (const [templateKey, template] of Object.entries(templatesValue)) {
      assertString(template, `blockOutputs.templates.${templateKey}`, optionsPath)

      if (templateKey.trim()) {
        if (!templateKey.includes(":")) {
          failOptions(
            optionsPath,
            `blockOutputs.templates contains unsupported keys: ${templateKey}`,
          )
        }

        templates[templateKey] = template
      }
    }

    blockOutputs.templates = templates
  }

  return blockOutputs
}
