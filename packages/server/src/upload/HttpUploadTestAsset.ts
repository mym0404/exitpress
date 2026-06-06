import { randomUUID } from "node:crypto"
import { rmdir, rm, writeFile } from "node:fs/promises"
import path from "node:path"

import { ensureDir, getProjectTempPath } from "@exitpress/engine/infra/node/util/FilePaths.js"

import type { UploadCandidate } from "@exitpress/domain/export-job/schema/UploadState.js"

const testPngBytes = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=",
  "base64",
)

export const createHttpUploadTestAsset = async () => {
  const outputDir = getProjectTempPath("image-upload")
  const localPath = path.posix.join("test-assets", `${randomUUID()}.png`)
  const filePath = path.join(outputDir, localPath)
  const assetDir = path.dirname(filePath)

  await ensureDir(assetDir)
  await writeFile(filePath, testPngBytes)

  return {
    outputDir,
    filePath,
    candidate: {
      kind: "image",
      sourceUrl: "http://localhost/upload-provider-test.png",
      localPath,
      markdownReference: localPath,
    } satisfies UploadCandidate,
    remove: async () => {
      await rm(filePath, { force: true })
      await rmdir(assetDir).catch(() => {})
      await rmdir(outputDir).catch(() => {})
    },
  }
}
