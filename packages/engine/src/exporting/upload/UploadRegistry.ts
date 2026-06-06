import type {
  UploadRegistryEntry,
  UploadRegistrySnapshot,
} from "@exitpress/domain/template/Types.js"

type UploadAsset = (input: { uploadKey: string; localPath: string }) => Promise<{
  uploadedUrl: string
}>

export const createUploadRegistry = ({
  upload,
  seed = {},
}: {
  upload: UploadAsset
  seed?: UploadRegistrySnapshot
}) => {
  const entries = new Map<string, UploadRegistryEntry>(Object.entries(seed))
  const uploads = new Map<string, Promise<string>>()

  const uploadOnce = async ({ uploadKey, localPath }: { uploadKey: string; localPath: string }) => {
    const current = entries.get(uploadKey)

    if (current?.status === "uploaded" && current.uploadedUrl) {
      return current.uploadedUrl
    }

    const currentUpload = uploads.get(uploadKey)

    if (currentUpload) {
      return currentUpload
    }

    entries.set(uploadKey, {
      uploadKey,
      localPath,
      status: "uploading",
    })

    const uploadPromise = upload({ uploadKey, localPath })
      .then(({ uploadedUrl }) => {
        entries.set(uploadKey, {
          uploadKey,
          localPath,
          status: "uploaded",
          uploadedUrl,
        })

        return uploadedUrl
      })
      .catch((error) => {
        const message = error instanceof Error ? error.message : String(error)

        entries.set(uploadKey, {
          uploadKey,
          localPath,
          status: "failed",
          message,
        })
        throw error
      })
      .finally(() => {
        uploads.delete(uploadKey)
      })

    uploads.set(uploadKey, uploadPromise)

    return uploadPromise
  }

  return {
    getSnapshot: (): UploadRegistrySnapshot => Object.fromEntries(entries),
    uploadOnce,
  }
}
