import type { EditorBlockOutputDefinition } from "../ast/Types.js"
import type { ExportOptions, FrontmatterFieldName } from "./Types.js"
import { frontmatterFieldOrder } from "./FrontmatterFields.js"

export type PartialExportOptions = {
  scope?: Partial<ExportOptions["scope"]>
  structure?: Partial<ExportOptions["structure"]>
  frontmatter?: {
    enabled?: boolean
    fields?: Partial<Record<FrontmatterFieldName, boolean>>
    aliases?: Partial<Record<FrontmatterFieldName, string>>
  }
  blockOutputs?: {
    defaults?: Partial<ExportOptions["blockOutputs"]["defaults"]>
  }
  assets?: Partial<ExportOptions["assets"]>
  links?: Partial<ExportOptions["links"]>
}

type ExportOptionsDefinitionContext = {
  blockOutputDefinitions?: EditorBlockOutputDefinition[]
}

export const pickFrontmatterRecord = <Value>(
  values: Partial<Record<FrontmatterFieldName, Value>> | undefined,
) => {
  const entries = frontmatterFieldOrder.flatMap((fieldName) => {
    const value = values?.[fieldName]

    return value === undefined ? [] : [[fieldName, value] as const]
  })

  return Object.fromEntries(entries) as Partial<Record<FrontmatterFieldName, Value>>
}

export const sanitizePersistedExportOptions = (
  options?: PartialExportOptions,
  context: ExportOptionsDefinitionContext = {},
): PartialExportOptions => {
  const sanitized: PartialExportOptions = {}

  if (options?.scope) {
    const scope: NonNullable<PartialExportOptions["scope"]> = {}

    if (options.scope.categoryMode) {
      scope.categoryMode = options.scope.categoryMode
    }

    if ("dateFrom" in options.scope) {
      scope.dateFrom = options.scope.dateFrom ?? null
    }

    if ("dateTo" in options.scope) {
      scope.dateTo = options.scope.dateTo ?? null
    }

    if (Object.keys(scope).length > 0) {
      sanitized.scope = scope
    }
  }

  if (options?.structure) {
    sanitized.structure = {
      groupByCategory: options.structure.groupByCategory,
      includeDateInPostFolderName: options.structure.includeDateInPostFolderName,
      includeLogNoInPostFolderName: options.structure.includeLogNoInPostFolderName,
      slugStyle: options.structure.slugStyle,
      slugWhitespace: options.structure.slugWhitespace,
      postFolderNameMode: options.structure.postFolderNameMode,
      postFolderNameCustomTemplate: options.structure.postFolderNameCustomTemplate,
    }

    Object.keys(sanitized.structure).forEach((key) => {
      if (
        sanitized.structure &&
        sanitized.structure[key as keyof typeof sanitized.structure] === undefined
      ) {
        delete sanitized.structure[key as keyof typeof sanitized.structure]
      }
    })

    if (sanitized.structure && Object.keys(sanitized.structure).length === 0) {
      delete sanitized.structure
    }
  }

  if (options?.frontmatter) {
    const frontmatter: NonNullable<PartialExportOptions["frontmatter"]> = {}

    if (typeof options.frontmatter.enabled === "boolean") {
      frontmatter.enabled = options.frontmatter.enabled
    }

    if (options.frontmatter.fields) {
      const fields = pickFrontmatterRecord(options.frontmatter.fields)

      if (Object.keys(fields).length > 0) {
        frontmatter.fields = fields
      }
    }

    if (options.frontmatter.aliases) {
      const aliases = pickFrontmatterRecord(options.frontmatter.aliases)

      if (Object.keys(aliases).length > 0) {
        frontmatter.aliases = aliases
      }
    }

    if (Object.keys(frontmatter).length > 0) {
      sanitized.frontmatter = frontmatter
    }
  }

  if (options?.blockOutputs) {
    const blockOutputs: NonNullable<PartialExportOptions["blockOutputs"]> = {}

    if (options.blockOutputs.defaults) {
      const allowedSelectionKeys = context.blockOutputDefinitions
        ? new Set(context.blockOutputDefinitions.map((definition) => definition.key))
        : undefined
      blockOutputs.defaults = Object.fromEntries(
        Object.entries(options.blockOutputs.defaults).filter(([selectionKey]) =>
          allowedSelectionKeys ? allowedSelectionKeys.has(selectionKey) : true,
        ),
      ) as NonNullable<PartialExportOptions["blockOutputs"]>["defaults"]
    }

    if (Object.keys(blockOutputs).length > 0) {
      sanitized.blockOutputs = blockOutputs
    }
  }

  if (options?.assets) {
    sanitized.assets = {
      ...options.assets,
    }
  }

  if (options?.links) {
    sanitized.links = {
      ...options.links,
    }
  }

  return sanitized
}
