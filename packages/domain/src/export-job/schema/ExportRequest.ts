import type { ExportOptions } from "../../export-options/schema/ExportOptions.js"
import type { UploadProviderFields } from "../../upload/schema/UploadProvider.js"

export const allExportProfiles = ["gfm"] as const
// Markdown output profile selected by export requests.
export type ExportProfile = (typeof allExportProfiles)[number]

export type ExportUploadProviderRequest = {
  providerKey: string
  providerFields: UploadProviderFields
}

// Request body used to start an export job.
export type ExportRequest = {
  sourceInput: string
  outputDir: string
  profile: ExportProfile
  options: ExportOptions
  uploadProvider?: ExportUploadProviderRequest
}
