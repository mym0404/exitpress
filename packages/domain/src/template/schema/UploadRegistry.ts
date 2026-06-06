export const allUploadRegistryStatuses = ["pending", "uploading", "uploaded", "failed"] as const
// Upload state persisted for one local asset reference.
export type UploadRegistryStatus = (typeof allUploadRegistryStatuses)[number]

// Registry entry keyed by local asset path during upload rewriting.
export type UploadRegistryEntry = {
  uploadKey: string
  status: UploadRegistryStatus
  localPath: string
  uploadedUrl?: string
  message?: string
}

// Snapshot used to resume upload rewriting without repeating finished uploads.
export type UploadRegistrySnapshot = Record<string, UploadRegistryEntry>
