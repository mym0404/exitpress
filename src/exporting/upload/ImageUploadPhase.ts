import path from "node:path"

import type { UploadCandidate } from "../../domain/export-job/Types.js"
import type { UnknownRecord } from "../../shared/object/UnknownRecord.js"

import { ensureDir, getProjectTempPath } from "../../infra/node/FilePathUtils.js"
import { throwIfAborted } from "../../infra/runtime/AbortOperation.js"

import { dedupeUploadCandidatesByLocalPath } from "./UploadCandidateUtils.js"

type RuntimeUploadResponse = {
  imgUrl?: string
  url?: string
}

type RuntimeUploaderClient = {
  changeCurrentUploader: (uploaderKey: string, uploaderConfig: UnknownRecord) => void
  upload: (input: string[]) => Promise<RuntimeUploadResponse[] | Error>
}

export type ImageUploadResult = {
  candidate: UploadCandidate
  uploadedUrl: string
}

export type ImageUploadProgress = {
  total: number
  uploadedCount: number
  lastCompletedLocalPath: string | null
}

export class ImageUploadPhaseError extends Error {
  readonly uploadedResults: ImageUploadResult[]

  constructor(message: string, uploadedResults: ImageUploadResult[]) {
    super(message)
    this.name = "ImageUploadPhaseError"
    this.uploadedResults = uploadedResults
  }
}

type RunImageUploadPhaseInput = {
  outputDir: string
  candidates: UploadCandidate[]
  uploaderKey: string
  uploaderConfig: UnknownRecord
  abortSignal?: AbortSignal | null
  onAssetStart?: (candidate: UploadCandidate) => void | Promise<void>
  onAssetUploaded?: (input: {
    result: ImageUploadResult
    progress: ImageUploadProgress
  }) => void | Promise<void>
  onProgress?: (progress: ImageUploadProgress) => void
}

const createRuntimeClient = async (): Promise<RuntimeUploaderClient> => {
  const runtimeModule = await import("piclist")
  const runtimeConfigPath = getProjectTempPath("image-upload", "picgo-upload.json")

  await ensureDir(path.dirname(runtimeConfigPath))

  return runtimeModule.PicGo.create(runtimeConfigPath)
}

export const runImageUploadPhase = async (
  input: RunImageUploadPhaseInput,
  createClient: () => Promise<RuntimeUploaderClient> = createRuntimeClient,
): Promise<ImageUploadResult[]> => {
  throwIfAborted(input.abortSignal)

  const dedupedCandidates = dedupeUploadCandidatesByLocalPath(input.candidates)
  const client = await createClient()

  client.changeCurrentUploader(input.uploaderKey, input.uploaderConfig)

  const total = dedupedCandidates.length
  const uploadedResults: ImageUploadResult[] = []

  input.onProgress?.({
    total,
    uploadedCount: 0,
    lastCompletedLocalPath: null,
  })

  for (const candidate of dedupedCandidates) {
    throwIfAborted(input.abortSignal)
    await input.onAssetStart?.(candidate)
    throwIfAborted(input.abortSignal)

    const filePath = path.join(input.outputDir, candidate.localPath)
    const uploaded = await client.upload([filePath])
    throwIfAborted(input.abortSignal)

    if (uploaded instanceof Error) {
      throw new ImageUploadPhaseError(
        `Image upload failed for ${candidate.localPath}.`,
        uploadedResults,
      )
    }

    if (uploaded.length !== 1) {
      throw new ImageUploadPhaseError(
        `Image upload result count mismatch for ${candidate.localPath}.`,
        uploadedResults,
      )
    }

    const uploadedResult = uploaded[0]!
    const uploadedUrl = uploadedResult.imgUrl || uploadedResult.url || null

    if (!uploadedUrl) {
      throw new ImageUploadPhaseError(
        `Image upload result is missing a URL for ${candidate.localPath}.`,
        uploadedResults,
      )
    }

    const result = {
      candidate,
      uploadedUrl,
    } satisfies ImageUploadResult

    uploadedResults.push(result)

    const progress = {
      total,
      uploadedCount: uploadedResults.length,
      lastCompletedLocalPath: candidate.localPath,
    } satisfies ImageUploadProgress

    input.onProgress?.(progress)
    await input.onAssetUploaded?.({
      result,
      progress,
    })
  }

  return uploadedResults
}
