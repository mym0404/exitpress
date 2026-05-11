import type { ExportOptions } from "../../src/domain/export-options/Types.js"
import { defaultExportOptions } from "../../src/domain/export-options/ExportOptions.js"
import { validateAssetsOptions, validateLinksOptions } from "./SinglePostAssetLinkOptions.js"
import { validateBlockOutputsOptions } from "./SinglePostBlockOutputOptions.js"
import {
  validateFrontmatterOptions,
  validateScopeOptions,
  validateStructureOptions,
} from "./SinglePostCoreOptions.js"
import { assertAllowedKeys, assertPlainObject, failOptions } from "./SinglePostOptionGuards.js"
import { allowedTopLevelOptionKeys } from "./SinglePostOptionMetadata.js"

const validateSinglePostOptionsJson = (value: unknown, optionsPath: string): ExportOptions => {
  assertPlainObject(value, "root", optionsPath)
  assertAllowedKeys(value, allowedTopLevelOptionKeys, "root", optionsPath)

  const options = defaultExportOptions()

  if ("scope" in value) {
    options.scope = validateScopeOptions(value.scope, optionsPath)
  }

  if ("structure" in value) {
    options.structure = validateStructureOptions(value.structure, optionsPath)
  }

  if ("frontmatter" in value) {
    options.frontmatter = validateFrontmatterOptions(value.frontmatter, optionsPath)
  }

  if ("blockOutputs" in value) {
    options.blockOutputs = validateBlockOutputsOptions(value.blockOutputs, optionsPath)
  }

  if ("assets" in value) {
    options.assets = validateAssetsOptions(value.assets, optionsPath)
  }

  if ("links" in value) {
    options.links = validateLinksOptions(value.links, optionsPath)
  }

  return options
}

export const readSinglePostOptions = async ({
  optionsPath,
  readFile,
}: {
  optionsPath: string
  readFile: (path: string, encoding: "utf8") => Promise<string>
}) => {
  const text = await readFile(optionsPath, "utf8")

  let parsed: unknown

  try {
    parsed = JSON.parse(text)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    failOptions(optionsPath, `invalid JSON: ${message}`)
  }

  return validateSinglePostOptionsJson(parsed, optionsPath)
}
