import path from "node:path"

import type { ThemePreference } from "../../domain/preferences/ThemePreference.js"

import { DEFAULT_OUTPUT_DIR } from "../../domain/export-options/ExportDefaults.js"
import { resolveRepoPath } from "../../infra/node/FilePathUtils.js"

export const builtClientRoot = resolveRepoPath("dist/client")
export const devIndexPath = resolveRepoPath("index.html")
const cacheRoot = resolveRepoPath(".cache")
const legacyOutputsRoot = resolveRepoPath("outputs")
export const defaultScanCachePath = path.join(cacheRoot, "scan-cache.json")
export const legacyScanCachePath = path.join(legacyOutputsRoot, "scan-cache.json")
export const defaultSettingsPath = path.join(cacheRoot, "export-ui-settings.json")
export const legacySettingsPath = resolveRepoPath("export-ui-settings.json")
export const defaultOutputDir = DEFAULT_OUTPUT_DIR
export const defaultThemePreference: ThemePreference = "dark"
