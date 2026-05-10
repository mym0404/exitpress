import { createHash } from "node:crypto"
import path from "node:path"
import { writeFile } from "node:fs/promises"

import type { AssetRecord, ExportOptions } from "./Types.js"
import { ensureDir, relativePathFrom } from "../common/FilePathUtils.js"
import { normalizeAssetUrl } from "../common/NaverUrlUtils.js"

type AssetBinary = {
  bytes: Buffer
  contentType: string | null
}

type AssetDownloader = {
  downloadBinary: (input: {
    sourceUrl: string
    destinationPath: string
  }) => Promise<void>
  fetchBinary?: (input: {
    sourceUrl: string
  }) => Promise<AssetBinary>
}

type AssetCompressor = (input: {
  bytes: Buffer
  contentType: string | null
  sourceUrl: string
}) => Promise<Buffer>

const extensionFromUrl = (value: string) => {
  try {
    const url = new URL(value)
    const extension = path.extname(url.pathname)

    return extension || ".jpg"
  } catch {
    return ".jpg"
  }
}

const extensionFromContentType = (value: string | null) => {
  const normalized = value?.split(";")[0]?.trim().toLowerCase() ?? ""

  if (normalized === "image/png") {
    return ".png"
  }

  if (normalized === "image/gif") {
    return ".gif"
  }

  if (normalized === "image/webp") {
    return ".webp"
  }

  if (normalized === "image/svg+xml") {
    return ".svg"
  }

  if (normalized === "image/jpeg") {
    return ".jpg"
  }

  return null
}

const inferMimeType = (value: string) => {
  const extension = extensionFromUrl(value).toLowerCase()

  if (extension === ".png") {
    return "image/png"
  }

  if (extension === ".gif") {
    return "image/gif"
  }

  if (extension === ".webp") {
    return "image/webp"
  }

  if (extension === ".svg") {
    return "image/svg+xml"
  }

  return "image/jpeg"
}

const normalizeOutputPath = (value: string) => value.split(path.sep).join("/")

const isCompressionSafeMimeType = (contentType: string | null, sourceUrl: string) => {
  const resolvedContentType = (contentType || inferMimeType(sourceUrl)).toLowerCase()

  return (
    resolvedContentType === "image/jpeg" ||
    resolvedContentType === "image/png" ||
    resolvedContentType === "image/webp"
  )
}

const compressWithSharp: AssetCompressor = async ({ bytes, contentType, sourceUrl }) => {
  const sharpModule = await import("sharp")
  const sharp = sharpModule.default
  const resolvedContentType = (contentType || inferMimeType(sourceUrl)).toLowerCase()
  const image = sharp(bytes, {
    failOn: "none",
  }).rotate()

  if (resolvedContentType === "image/png") {
    return image.png({ compressionLevel: 9 }).toBuffer()
  }

  if (resolvedContentType === "image/webp") {
    return image.webp({ quality: 80 }).toBuffer()
  }

  return image.jpeg({ quality: 82, mozjpeg: true }).toBuffer()
}

export class AssetStore {
  readonly outputDir: string
  readonly downloader: AssetDownloader
  readonly options: Pick<ExportOptions, "assets" | "structure">
  readonly cache = new Map<string, string>()
  readonly sourceUrlCache = new Map<string, string>()
  readonly inFlightSourceUrlCache = new Map<string, Promise<string>>()
  readonly compressImage: AssetCompressor

  constructor({
    outputDir,
    downloader,
    options,
    compressImage,
  }: {
    outputDir: string
    downloader: AssetDownloader
    options: Pick<ExportOptions, "assets" | "structure">
    compressImage?: AssetCompressor
  }) {
    this.outputDir = outputDir
    this.downloader = downloader
    this.options = options
    this.compressImage = compressImage ?? compressWithSharp
  }

  async saveAsset({
    kind,
    sourceUrl,
    markdownFilePath,
  }: {
    kind: "image" | "thumbnail"
    sourceUrl: string
    markdownFilePath: string
  }) {
    const normalizedSourceUrl = normalizeAssetUrl(sourceUrl)

    const shouldDownload =
      this.options.assets.imageHandlingMode !== "remote" &&
      ((kind === "image" && this.options.assets.downloadImages) ||
        (kind === "thumbnail" && this.options.assets.downloadThumbnails))

    if (!shouldDownload) {
      return {
        kind,
        sourceUrl: normalizedSourceUrl,
        reference: normalizedSourceUrl,
        relativePath: null,
        storageMode: "remote",
        uploadCandidate: null,
      } satisfies AssetRecord
    }

    if (!this.downloader.fetchBinary) {
      throw new Error("로컬 자산 저장을 지원하는 fetchBinary downloader가 필요합니다.")
    }

    const cachedBySourceUrl = this.sourceUrlCache.get(normalizedSourceUrl)

    if (cachedBySourceUrl) {
      const relativePath = relativePathFrom({
        from: markdownFilePath,
        to: cachedBySourceUrl,
      })

      return {
        kind,
        sourceUrl: normalizedSourceUrl,
        reference: relativePath,
        relativePath,
        storageMode: "relative",
        uploadCandidate: {
          kind,
          sourceUrl: normalizedSourceUrl,
          localPath: normalizeOutputPath(path.relative(this.outputDir, cachedBySourceUrl)),
          markdownReference: relativePath,
        },
      } satisfies AssetRecord
    }

    const absolutePath = await this.getOrCreateLocalAssetPath(normalizedSourceUrl)

    const relativePath = relativePathFrom({
      from: markdownFilePath,
      to: absolutePath,
    })

    return {
      kind,
      sourceUrl: normalizedSourceUrl,
      reference: relativePath,
      relativePath,
      storageMode: "relative",
      uploadCandidate: {
        kind,
        sourceUrl: normalizedSourceUrl,
        localPath: normalizeOutputPath(path.relative(this.outputDir, absolutePath)),
        markdownReference: relativePath,
      },
    } satisfies AssetRecord
  }

  private async getOrCreateLocalAssetPath(normalizedSourceUrl: string) {
    const cachedAbsolutePath = this.sourceUrlCache.get(normalizedSourceUrl)

    if (cachedAbsolutePath) {
      return cachedAbsolutePath
    }

    const inFlightAbsolutePath = this.inFlightSourceUrlCache.get(normalizedSourceUrl)

    if (inFlightAbsolutePath) {
      return inFlightAbsolutePath
    }

    const absolutePathPromise = (async () => {
      const binary = await this.downloader.fetchBinary!({
        sourceUrl: normalizedSourceUrl,
      })
      const contentHash = createHash("sha256").update(binary.bytes).digest("hex")
      const cachedByHash = this.cache.get(contentHash)

      if (cachedByHash) {
        this.sourceUrlCache.set(normalizedSourceUrl, cachedByHash)
        return cachedByHash
      }

      const extension =
        extensionFromContentType(binary.contentType) ?? extensionFromUrl(normalizedSourceUrl)
      const absolutePath = path.join(this.outputDir, "public", `${contentHash}${extension}`)

      await ensureDir(path.dirname(absolutePath))

      if (this.options.assets.compressionEnabled) {
        if (isCompressionSafeMimeType(binary.contentType, normalizedSourceUrl)) {
          try {
            const compressedBytes = await this.compressImage({
              bytes: binary.bytes,
              contentType: binary.contentType,
              sourceUrl: normalizedSourceUrl,
            })

            await writeFile(absolutePath, compressedBytes)
          } catch {
            await writeFile(absolutePath, binary.bytes)
          }
        } else {
          await writeFile(absolutePath, binary.bytes)
        }
      } else {
        await writeFile(absolutePath, binary.bytes)
      }

      this.cache.set(contentHash, absolutePath)
      this.sourceUrlCache.set(normalizedSourceUrl, absolutePath)

      return absolutePath
    })()

    this.inFlightSourceUrlCache.set(normalizedSourceUrl, absolutePathPromise)

    try {
      return await absolutePathPromise
    } finally {
      this.inFlightSourceUrlCache.delete(normalizedSourceUrl)
    }
  }
}
