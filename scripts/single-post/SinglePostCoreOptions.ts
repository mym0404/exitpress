import { defaultExportOptions } from "../../src/domain/export-options/ExportOptions.js"

import {
  assertAllowedKeys,
  assertBoolean,
  assertEnum,
  assertNullableString,
  assertNumberArray,
  assertPlainObject,
  assertString,
  failOptions,
} from "./SinglePostOptionGuards.js"
import {
  allowedFrontmatterFieldKeys,
  allowedFrontmatterKeys,
  allowedScopeKeys,
  allowedStructureKeys,
  categoryModes,
  postFolderNameModes,
  slugStyles,
  slugWhitespaces,
} from "./SinglePostOptionMetadata.js"

export const validateScopeOptions = (value: unknown, optionsPath: string) => {
  assertPlainObject(value, "scope", optionsPath)
  assertAllowedKeys(value, allowedScopeKeys, "scope", optionsPath)

  const scope = defaultExportOptions().scope

  if ("categoryIds" in value) {
    const categoryIds = value.categoryIds
    assertNumberArray(categoryIds, "scope.categoryIds", optionsPath)
    scope.categoryIds = categoryIds
  }

  if ("categoryMode" in value) {
    const categoryMode = value.categoryMode
    assertEnum(categoryMode, categoryModes, "scope.categoryMode", optionsPath)
    scope.categoryMode = categoryMode
  }

  if ("dateFrom" in value) {
    const dateFrom = value.dateFrom
    assertNullableString(dateFrom, "scope.dateFrom", optionsPath)
    scope.dateFrom = dateFrom
  }

  if ("dateTo" in value) {
    const dateTo = value.dateTo
    assertNullableString(dateTo, "scope.dateTo", optionsPath)
    scope.dateTo = dateTo
  }

  return scope
}

export const validateStructureOptions = (value: unknown, optionsPath: string) => {
  assertPlainObject(value, "structure", optionsPath)
  assertAllowedKeys(value, allowedStructureKeys, "structure", optionsPath)

  const structure = defaultExportOptions().structure

  if ("groupByCategory" in value) {
    const groupByCategory = value.groupByCategory
    assertBoolean(groupByCategory, "structure.groupByCategory", optionsPath)
    structure.groupByCategory = groupByCategory
  }

  if ("includeDateInPostFolderName" in value) {
    const includeDateInPostFolderName = value.includeDateInPostFolderName
    assertBoolean(includeDateInPostFolderName, "structure.includeDateInPostFolderName", optionsPath)
    structure.includeDateInPostFolderName = includeDateInPostFolderName
  }

  if ("includeLogNoInPostFolderName" in value) {
    const includeLogNoInPostFolderName = value.includeLogNoInPostFolderName
    assertBoolean(
      includeLogNoInPostFolderName,
      "structure.includeLogNoInPostFolderName",
      optionsPath,
    )
    structure.includeLogNoInPostFolderName = includeLogNoInPostFolderName
  }

  if ("postDirectoryName" in value) {
    failOptions(
      optionsPath,
      "structure.postDirectoryName is no longer supported; posts now export to per-post folders with index.md",
    )
  }

  if ("assetDirectoryName" in value) {
    failOptions(
      optionsPath,
      "structure.assetDirectoryName is no longer supported; assets now live beside each post's index.md",
    )
  }

  if ("slugStyle" in value) {
    const slugStyle = value.slugStyle
    assertEnum(slugStyle, slugStyles, "structure.slugStyle", optionsPath)
    structure.slugStyle = slugStyle
  }

  if ("slugWhitespace" in value) {
    const slugWhitespace = value.slugWhitespace
    assertEnum(slugWhitespace, slugWhitespaces, "structure.slugWhitespace", optionsPath)
    structure.slugWhitespace = slugWhitespace
  }

  if ("postFolderNameMode" in value) {
    const postFolderNameMode = value.postFolderNameMode
    assertEnum(postFolderNameMode, postFolderNameModes, "structure.postFolderNameMode", optionsPath)
    structure.postFolderNameMode = postFolderNameMode
  }

  if ("postFolderNameCustomTemplate" in value) {
    const postFolderNameCustomTemplate = value.postFolderNameCustomTemplate
    assertString(
      postFolderNameCustomTemplate,
      "structure.postFolderNameCustomTemplate",
      optionsPath,
    )
    structure.postFolderNameCustomTemplate = postFolderNameCustomTemplate
  }

  return structure
}

export const validateFrontmatterOptions = (value: unknown, optionsPath: string) => {
  assertPlainObject(value, "frontmatter", optionsPath)
  assertAllowedKeys(value, allowedFrontmatterKeys, "frontmatter", optionsPath)

  const frontmatter = defaultExportOptions().frontmatter

  if ("enabled" in value) {
    const enabled = value.enabled
    assertBoolean(enabled, "frontmatter.enabled", optionsPath)
    frontmatter.enabled = enabled
  }

  if ("fields" in value) {
    const fieldsValue = value.fields
    assertPlainObject(fieldsValue, "frontmatter.fields", optionsPath)
    assertAllowedKeys(fieldsValue, allowedFrontmatterFieldKeys, "frontmatter.fields", optionsPath)

    const fields = { ...frontmatter.fields }
    for (const key of allowedFrontmatterFieldKeys) {
      if (key in fieldsValue) {
        const fieldValue = fieldsValue[key]
        assertBoolean(fieldValue, `frontmatter.fields.${key}`, optionsPath)
        fields[key] = fieldValue
      }
    }
    frontmatter.fields = fields
  }

  if ("aliases" in value) {
    const aliasesValue = value.aliases
    assertPlainObject(aliasesValue, "frontmatter.aliases", optionsPath)
    assertAllowedKeys(aliasesValue, allowedFrontmatterFieldKeys, "frontmatter.aliases", optionsPath)

    const aliases = { ...frontmatter.aliases }
    for (const key of allowedFrontmatterFieldKeys) {
      if (key in aliasesValue) {
        const aliasValue = aliasesValue[key]
        assertString(aliasValue, `frontmatter.aliases.${key}`, optionsPath)
        aliases[key] = aliasValue
      }
    }
    frontmatter.aliases = aliases
  }

  return frontmatter
}
