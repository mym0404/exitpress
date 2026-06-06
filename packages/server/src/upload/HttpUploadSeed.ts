import type { ExportJobItem } from "@exitpress/domain/export-job/schema/ExportJobState.js"
import type { ImageUploadResult } from "@exitpress/engine/exporting/upload/ImageUploadPhase.js"

export const buildSeededUploadResults = (items: ExportJobItem[]) =>
  items.flatMap((item) => {
    if (item.upload.rewriteStatus !== "completed") {
      return []
    }

    return item.upload.candidates.flatMap((candidate, index) => {
      const uploadedUrl = item.upload.uploadedUrls[index]

      return uploadedUrl
        ? [
            {
              candidate,
              uploadedUrl,
            } satisfies ImageUploadResult,
          ]
        : []
    })
  })

export const buildSeededUploadedLocalPaths = (items: ExportJobItem[]) =>
  new Set(
    items.flatMap((item) =>
      item.upload.rewriteStatus === "completed"
        ? item.upload.candidates.map((candidate) => candidate.localPath)
        : [],
    ),
  )
