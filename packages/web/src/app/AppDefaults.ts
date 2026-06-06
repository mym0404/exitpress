import {
  defaultExportOptions,
  frontmatterFieldMeta,
  frontmatterFieldOrder,
  optionDescriptions,
} from "@exitpress/domain/export-options/ExportOptions.js"

import type { ExportBootstrapResponse } from "../lib/Api.js"

import { defaultOutputDir } from "../features/scan/ScanStatus.js"

export const fallbackDefaults: ExportBootstrapResponse = {
  profile: "gfm",
  options: defaultExportOptions(),
  lastOutputDir: defaultOutputDir,
  themePreference: "dark",
  resumedJob: null,
  resumeSummary: null,
  resumedScanResult: null,
  frontmatterFieldOrder,
  frontmatterFieldMeta,
  optionDescriptions,
  blockTemplateDefinitions: [],
}
