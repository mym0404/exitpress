import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"

import {
  cloneExportOptions,
  sanitizePersistedExportOptions,
} from "@exitpress/domain/export-options/ExportOptions.js"

import type { ScanCacheMap } from "@exitpress/domain/blog/schema/BlogScan.js"
import type { PartialExportOptions } from "@exitpress/domain/export-options/schema/ExportOptions.js"
import type { ThemePreference } from "@exitpress/domain/preferences/schema/ThemePreference.js"
import type { BlockTemplateDefinition } from "@exitpress/domain/template/schema/BlockTemplateDefinition.js"

const templateExpressionPattern = /\$\{([^{}]+)\}/g
const templateStringPattern = /(["'`])(?:\\.|(?!\1).)*\1/g
const rootIdentifierPattern = /(?<![.\w$])([A-Za-z_$][\w$]*)/g
const reservedTemplateIdentifiers = new Set(["false", "null", "true", "undefined"])

const getTemplateExpressionRootIdentifiers = (expression: string) => {
  const withoutStrings = expression.replace(templateStringPattern, "")
  const arrowParams = new Set(
    [...withoutStrings.matchAll(/\b([A-Za-z_$][\w$]*)\s*=>/g)].map((match) => match[1]!),
  )

  return [...withoutStrings.matchAll(rootIdentifierPattern)]
    .map((match) => match[1]!)
    .filter(
      (identifier) => !arrowParams.has(identifier) && !reservedTemplateIdentifiers.has(identifier),
    )
}

const templateMatchesDefinition = ({
  template,
  definition,
}: {
  template: string
  definition: BlockTemplateDefinition
}) => {
  const propNames = new Set(Object.keys(definition.props))

  for (const match of template.matchAll(templateExpressionPattern)) {
    const expression = match[1] ?? ""
    const identifiers = getTemplateExpressionRootIdentifiers(expression)

    if (identifiers.some((identifier) => !propNames.has(identifier))) {
      return false
    }
  }

  return true
}

const filterBlockOutputTemplates = ({
  options,
  blockTemplateDefinitions,
}: {
  options: PartialExportOptions
  blockTemplateDefinitions?: BlockTemplateDefinition[]
}) => {
  if (!options.blockOutputs?.templates || !blockTemplateDefinitions) {
    return options
  }

  const definitionByKey: Record<string, BlockTemplateDefinition> = Object.fromEntries(
    blockTemplateDefinitions.map((definition) => [definition.key, definition]),
  )
  const templates = Object.fromEntries(
    Object.entries(options.blockOutputs.templates).filter((entry): entry is [string, string] => {
      const [key, template] = entry
      const definition = definitionByKey[key]

      return typeof template === "string" && definition
        ? templateMatchesDefinition({ template, definition })
        : false
    }),
  )

  return {
    ...options,
    blockOutputs: {
      ...options.blockOutputs,
      templates,
    },
  }
}

export const readScanCacheFile = async ({ scanCachePath }: { scanCachePath: string }) => {
  try {
    const raw = await readFile(scanCachePath, "utf8")
    const parsed = JSON.parse(raw) as {
      scans?: ScanCacheMap
    }

    return parsed.scans && typeof parsed.scans === "object" ? parsed.scans : {}
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return {}
    }

    throw error
  }
}

export const writeScanCacheFile = async ({
  scanCachePath,
  scans,
}: {
  scanCachePath: string
  scans: ScanCacheMap
}) => {
  await mkdir(path.dirname(scanCachePath), { recursive: true })
  await writeFile(
    scanCachePath,
    JSON.stringify(
      {
        scans,
      },
      null,
      2,
    ),
    "utf8",
  )
}

export const readPersistedUiState = async ({
  settingsPath,
  defaultOutputDir,
  defaultThemePreference,
  blockTemplateDefinitions,
}: {
  settingsPath: string
  defaultOutputDir: string
  defaultThemePreference: ThemePreference
  blockTemplateDefinitions?: BlockTemplateDefinition[]
}) => {
  try {
    const raw = await readFile(settingsPath, "utf8")
    const parsed = JSON.parse(raw) as {
      options?: PartialExportOptions
      lastOutputDir?: string
      themePreference?: ThemePreference
    }

    return {
      options: cloneExportOptions(
        filterBlockOutputTemplates({
          options: sanitizePersistedExportOptions(
            parsed &&
              typeof parsed === "object" &&
              parsed.options &&
              typeof parsed.options === "object" &&
              !Array.isArray(parsed.options)
              ? parsed.options
              : undefined,
          ),
          blockTemplateDefinitions,
        }),
      ),
      lastOutputDir:
        parsed &&
        typeof parsed === "object" &&
        typeof parsed.lastOutputDir === "string" &&
        parsed.lastOutputDir.trim()
          ? parsed.lastOutputDir.trim()
          : defaultOutputDir,
      themePreference:
        parsed &&
        typeof parsed === "object" &&
        (parsed.themePreference === "dark" || parsed.themePreference === "light")
          ? parsed.themePreference
          : defaultThemePreference,
    }
  } catch {
    return {
      options: cloneExportOptions(),
      lastOutputDir: defaultOutputDir,
      themePreference: defaultThemePreference,
    }
  }
}

export const writePersistedUiState = async ({
  settingsPath,
  input,
  defaultOutputDir,
  defaultThemePreference,
  blockTemplateDefinitions,
}: {
  settingsPath: string
  input: {
    options?: PartialExportOptions
    lastOutputDir?: string
    themePreference?: ThemePreference
  }
  defaultOutputDir: string
  defaultThemePreference: ThemePreference
  blockTemplateDefinitions?: BlockTemplateDefinition[]
}) => {
  const current = await readPersistedUiState({
    settingsPath,
    defaultOutputDir,
    defaultThemePreference,
    blockTemplateDefinitions,
  })

  await mkdir(path.dirname(settingsPath), { recursive: true })
  await writeFile(
    settingsPath,
    JSON.stringify(
      {
        options: filterBlockOutputTemplates({
          options: sanitizePersistedExportOptions(input.options ?? current.options),
          blockTemplateDefinitions,
        }),
        lastOutputDir: input.lastOutputDir ?? current.lastOutputDir,
        themePreference: input.themePreference ?? current.themePreference,
      },
      null,
      2,
    ),
    "utf8",
  )
}
