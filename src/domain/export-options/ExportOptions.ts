import type { EditorBlockOutputDefinition } from "../ast/Types.js"

import type { PartialExportOptions as PersistedPartialExportOptions } from "./PersistedExportOptions.js"
import type { ExportOptions, FrontmatterFieldName } from "./Types.js"

import { resolveBlockOutputSelection } from "./BlockOutputSelection.js"
import { defaultExportOptions as createDefaultExportOptions } from "./DefaultExportOptions.js"
import {
  frontmatterFieldMeta as configuredFrontmatterFieldMeta,
  frontmatterFieldOrder as configuredFrontmatterFieldOrder,
} from "./FrontmatterFields.js"
import { optionDescriptions as configuredOptionDescriptions } from "./OptionDescriptions.js"
import {
  pickFrontmatterRecord,
  sanitizePersistedExportOptions as sanitizePersistedExportOptionsValue,
} from "./PersistedExportOptions.js"

export type PartialExportOptions = PersistedPartialExportOptions

type ExportOptionsDefinitionContext = {
  blockOutputDefinitions?: EditorBlockOutputDefinition[]
}

export const frontmatterFieldOrder = configuredFrontmatterFieldOrder

export const frontmatterFieldMeta = configuredFrontmatterFieldMeta

const frontmatterAliasPattern = /^[A-Za-z_][A-Za-z0-9_-]*$/

export const optionDescriptions = configuredOptionDescriptions

export const getDefaultSlugWhitespace = (slugStyle: ExportOptions["structure"]["slugStyle"]) => {
  switch (slugStyle) {
    case "kebab":
      return "dash" as const
    case "snake":
      return "underscore" as const
    case "keep-title":
      return "keep-space" as const
  }
}

export const getFrontmatterExportKey = ({
  fieldName,
  alias,
}: {
  fieldName: FrontmatterFieldName
  alias: string
}) => alias.trim() || fieldName

export const validateFrontmatterAliases = ({
  enabled,
  fields,
  aliases,
}: ExportOptions["frontmatter"]) => {
  if (!enabled) {
    return []
  }

  const aliasOwners = new Map<string, FrontmatterFieldName>()
  const errors: string[] = []

  for (const fieldName of frontmatterFieldOrder) {
    if (!fields[fieldName]) {
      continue
    }

    const alias = aliases[fieldName]?.trim() ?? ""
    const exportKey = getFrontmatterExportKey({
      fieldName,
      alias,
    })

    if (alias && !frontmatterAliasPattern.test(alias)) {
      errors.push(
        `${fieldName} alias는 영문자 또는 _로 시작하고 영문자, 숫자, -, _만 사용할 수 있습니다.`,
      )
      continue
    }

    const existingOwner = aliasOwners.get(exportKey)

    if (existingOwner) {
      errors.push(
        `${existingOwner}와 ${fieldName}가 같은 alias "${exportKey}"를 사용하고 있습니다.`,
      )
      continue
    }

    aliasOwners.set(exportKey, fieldName)
  }

  return errors
}

export const defaultExportOptions = createDefaultExportOptions

export const sanitizePersistedExportOptions = sanitizePersistedExportOptionsValue

const coerceAssetOptions = (options: ExportOptions["assets"]) => {
  const downloadFailureMode =
    options.downloadFailureMode === "use-source" || options.downloadFailureMode === "omit"
      ? options.downloadFailureMode
      : "fail"
  const coercedOptions = {
    ...options,
    downloadFailureMode,
  } satisfies ExportOptions["assets"]

  if (coercedOptions.imageHandlingMode === "download-and-upload") {
    return {
      ...coercedOptions,
      downloadImages: true,
      downloadThumbnails: true,
    } satisfies ExportOptions["assets"]
  }

  return coercedOptions
}

const buildDefaultBlockOutputs = (
  options?: PartialExportOptions["blockOutputs"],
  blockOutputDefinitions: EditorBlockOutputDefinition[] = [],
) =>
  Object.fromEntries(
    blockOutputDefinitions.flatMap((definition) => {
      const defaultOption =
        definition.options.find((option) => option.isDefault) ?? definition.options[0]

      if (!defaultOption) {
        return []
      }

      return [
        [
          definition.key,
          resolveBlockOutputSelection({
            blockType: defaultOption.preview.type,
            outputOptions: definition.options,
            blockOutputs: options,
            selectionKey: definition.key,
          }),
        ],
      ]
    }),
  ) as ExportOptions["blockOutputs"]["defaults"]

export const cloneExportOptions = (
  options?: PartialExportOptions,
  context: ExportOptionsDefinitionContext = {},
) => {
  const defaults = defaultExportOptions()
  const slugStyle = options?.structure?.slugStyle ?? defaults.structure.slugStyle
  const slugWhitespace = options?.structure?.slugWhitespace ?? getDefaultSlugWhitespace(slugStyle)
  const resolvedBlockOutputDefaults = buildDefaultBlockOutputs(
    options?.blockOutputs,
    context.blockOutputDefinitions,
  )

  const clonedOptions = {
    scope: {
      ...defaults.scope,
      ...options?.scope,
      categoryIds: options?.scope?.categoryIds ?? defaults.scope.categoryIds,
    },
    structure: {
      ...defaults.structure,
      ...options?.structure,
      slugStyle,
      slugWhitespace,
    },
    frontmatter: {
      enabled: options?.frontmatter?.enabled ?? defaults.frontmatter.enabled,
      fields: {
        ...defaults.frontmatter.fields,
        ...pickFrontmatterRecord(options?.frontmatter?.fields),
      },
      aliases: {
        ...defaults.frontmatter.aliases,
        ...pickFrontmatterRecord(options?.frontmatter?.aliases),
      },
    },
    blockOutputs: {
      defaults: resolvedBlockOutputDefaults,
    },
    assets: {
      imageHandlingMode: options?.assets?.imageHandlingMode ?? defaults.assets.imageHandlingMode,
      compressionEnabled: options?.assets?.compressionEnabled ?? defaults.assets.compressionEnabled,
      downloadFailureMode:
        options?.assets?.downloadFailureMode ?? defaults.assets.downloadFailureMode,
      stickerAssetMode: options?.assets?.stickerAssetMode ?? defaults.assets.stickerAssetMode,
      downloadImages: options?.assets?.downloadImages ?? defaults.assets.downloadImages,
      downloadThumbnails: options?.assets?.downloadThumbnails ?? defaults.assets.downloadThumbnails,
      includeImageCaptions:
        options?.assets?.includeImageCaptions ?? defaults.assets.includeImageCaptions,
      thumbnailSource: options?.assets?.thumbnailSource ?? defaults.assets.thumbnailSource,
    },
    links: {
      sameBlogPostMode: options?.links?.sameBlogPostMode ?? defaults.links.sameBlogPostMode,
      sameBlogPostCustomUrlTemplate:
        options?.links?.sameBlogPostCustomUrlTemplate ??
        defaults.links.sameBlogPostCustomUrlTemplate,
    },
  } satisfies ExportOptions

  clonedOptions.assets = coerceAssetOptions(clonedOptions.assets)

  const frontmatterErrors = validateFrontmatterAliases(clonedOptions.frontmatter)

  if (frontmatterErrors.length > 0) {
    throw new Error(frontmatterErrors.join(" "))
  }

  return clonedOptions
}
