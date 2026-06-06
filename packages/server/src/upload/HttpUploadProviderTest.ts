import { runImageUploadPhase } from "@exitpress/engine/exporting/upload/ImageUploadPhase.js"

import type { UnknownRecord } from "@exitpress/engine/shared/object/UnknownRecord.js"

export const runUploadProviderTest = async ({
  uploadPhaseRunner,
  outputDir,
  candidate,
  uploaderKey,
  uploaderConfig,
}: {
  uploadPhaseRunner: typeof runImageUploadPhase
  outputDir: string
  candidate: Parameters<typeof runImageUploadPhase>[0]["candidates"][number]
  uploaderKey: string
  uploaderConfig: UnknownRecord
}) => {
  const results = await uploadPhaseRunner({
    outputDir,
    candidates: [candidate],
    uploaderKey,
    uploaderConfig,
  })
  const uploadedUrl = results[0]?.uploadedUrl

  if (!uploadedUrl) {
    throw new Error("Image upload test did not return an uploaded URL.")
  }

  return uploadedUrl
}
