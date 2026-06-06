import type { ExportOptions } from "../../export-options/schema/ExportOptions.js"

export const allExportProfiles = ["gfm"] as const
// Markdown output profile selected by export requests.
export type ExportProfile = (typeof allExportProfiles)[number]

// Request body used to start an export job.
export type ExportRequest = {
  blogIdOrUrl: string
  outputDir: string
  profile: ExportProfile
  options: ExportOptions
}
