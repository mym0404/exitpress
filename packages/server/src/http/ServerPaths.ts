import path from "node:path"

import { DEFAULT_OUTPUT_DIR } from "@exitpress/domain/export-options/ExportDefaults.js"
import { resolveRepoPath } from "@exitpress/engine/infra/node/util/FilePaths.js"

import type { ThemePreference } from "@exitpress/domain/preferences/schema/ThemePreference.js"

export const builtClientRoot = resolveRepoPath("dist/client")
export const devIndexPath = resolveRepoPath("packages/web/index.html")
export const viteConfigPath = resolveRepoPath("packages/web/vite.config.ts")
const cacheRoot = resolveRepoPath(".cache")
export const defaultScanCachePath = path.join(cacheRoot, "scan-cache.json")
export const defaultPostHtmlCacheDir = path.join(cacheRoot, "post-html")
export const defaultSettingsPath = path.join(cacheRoot, "export-ui-settings.json")
export const defaultOutputDir = DEFAULT_OUTPUT_DIR
export const defaultThemePreference: ThemePreference = "dark"
